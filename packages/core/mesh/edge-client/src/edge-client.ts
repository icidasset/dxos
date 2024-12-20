//
// Copyright 2024 DXOS.org
//

import WebSocket from 'isomorphic-ws';

import { Trigger, Event, scheduleTaskInterval, scheduleTask, TriggerState } from '@dxos/async';
import { Context, LifecycleState, Resource, type Lifecycle } from '@dxos/context';
import { log } from '@dxos/log';
import { buf } from '@dxos/protocols/buf';
import { type Message, MessageSchema } from '@dxos/protocols/buf/dxos/edge/messenger_pb';

import { protocol } from './defs';
import { type EdgeIdentity, handleAuthChallenge } from './edge-identity';
import { EdgeConnectionClosedError, EdgeIdentityChangedError } from './errors';
import { PersistentLifecycle } from './persistent-lifecycle';
import { type Protocol, toUint8Array } from './protocol';
import { getEdgeUrlWithProtocol } from './utils';

const DEFAULT_TIMEOUT = 10_000;
const SIGNAL_KEEPALIVE_INTERVAL = 5_000;

export type MessageListener = (message: Message) => void | Promise<void>;

export interface EdgeConnection extends Required<Lifecycle> {
  connected: Event;
  reconnect: Event;

  get info(): any;
  get identityKey(): string;
  get peerKey(): string;
  get isOpen(): boolean;
  get isConnected(): boolean;
  setIdentity(identity: EdgeIdentity): void;
  addListener(listener: MessageListener): () => void;
  send(message: Message): Promise<void>;
}

export type MessengerConfig = {
  socketEndpoint: string;
  timeout?: number;
  protocol?: Protocol;
  disableAuth?: boolean;
};

/**
 * Messenger client.
 */
export class EdgeClient extends Resource implements EdgeConnection {
  public readonly reconnect = new Event();
  public readonly connected = new Event();
  private readonly _persistentLifecycle = new PersistentLifecycle({
    start: async () => this._openWebSocket(),
    stop: async () => this._closeWebSocket(),
    onRestart: async () => this.reconnect.emit(),
  });

  private readonly _listeners = new Set<MessageListener>();
  private _ready = new Trigger();
  private _ws?: WebSocket = undefined;
  private _keepaliveCtx?: Context = undefined;
  private _heartBeatContext?: Context = undefined;

  private _baseWsUrl: string;
  private _baseHttpUrl: string;

  constructor(
    private _identity: EdgeIdentity,
    private readonly _config: MessengerConfig,
  ) {
    super();
    this._baseWsUrl = getEdgeUrlWithProtocol(_config.socketEndpoint, 'ws');
    this._baseHttpUrl = getEdgeUrlWithProtocol(_config.socketEndpoint, 'http');
  }

  // TODO(burdon): Attach logging.
  public get info() {
    return {
      open: this.isOpen,
      identity: this._identity.identityKey,
      device: this._identity.peerKey,
    };
  }

  get isConnected() {
    return Boolean(this._ws) && this._ready.state === TriggerState.RESOLVED;
  }

  get identityKey() {
    return this._identity.identityKey;
  }

  get peerKey() {
    return this._identity.peerKey;
  }

  setIdentity(identity: EdgeIdentity) {
    if (identity.identityKey !== this._identity.identityKey || identity.peerKey !== this._identity.peerKey) {
      log('Edge identity changed', { identity, oldIdentity: this._identity });
      this._identity = identity;
      this._persistentLifecycle.scheduleRestart();
    }
  }

  public addListener(listener: MessageListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Open connection to messaging service.
   */
  protected override async _open() {
    log('opening...', { info: this.info });
    this._persistentLifecycle.open().catch((err) => {
      log.warn('Error while opening connection', { err });
    });
  }

  /**
   * Close connection and free resources.
   */
  protected override async _close() {
    log('closing...', { peerKey: this._identity.peerKey });
    await this._persistentLifecycle.close();
  }

  private async _openWebSocket() {
    if (this._ctx.disposed) {
      return;
    }
    const path = `/ws/${this._identity.identityKey}/${this._identity.peerKey}`;
    const protocolHeader = this._config.disableAuth ? undefined : await this._createAuthHeader(path);

    const url = new URL(path, this._baseWsUrl);
    log('Opening websocket', { url: url.toString(), protocolHeader });
    this._ws = new WebSocket(url, protocolHeader ? [protocolHeader] : []);

    this._ws.onopen = () => {
      log('opened', this.info);
      this._ready.wake();
      this.connected.emit();
    };
    this._ws.onclose = () => {
      log('closed', this.info);
      this._persistentLifecycle.scheduleRestart();
    };
    this._ws.onerror = (event) => {
      log.warn('EdgeClient socket error', { error: event.error, info: event.message });
      this._persistentLifecycle.scheduleRestart();
    };
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent/data
     */
    this._ws.onmessage = async (event) => {
      if (event.data === '__pong__') {
        this._onHeartbeat();
        return;
      }
      const data = await toUint8Array(event.data);
      const message = buf.fromBinary(MessageSchema, data);
      log('received', { peerKey: this._identity.peerKey, payload: protocol.getPayloadType(message) });
      if (message) {
        for (const listener of this._listeners) {
          try {
            await listener(message);
          } catch (err) {
            log.error('processing', { err, payload: protocol.getPayloadType(message) });
          }
        }
      }
    };

    // TODO(dmaretskyi): Potential race condition here since web socket errors don't resolve this trigger.
    await this._ready.wait({ timeout: this._config.timeout ?? DEFAULT_TIMEOUT });
    log('Websocket is ready', { identity: this._identity.identityKey, peer: this._identity.peerKey });

    // TODO(dmaretskyi): Potential leak: context re-assigned without disposing the previous one.
    this._keepaliveCtx = new Context();
    scheduleTaskInterval(
      this._keepaliveCtx,
      async () => {
        // TODO(mykola): use RFC6455 ping/pong once implemented in the browser?
        // Cloudflare's worker responds to this `without interrupting hibernation`. https://developers.cloudflare.com/durable-objects/api/websockets/#setwebsocketautoresponse
        this._ws?.send('__ping__');
      },
      SIGNAL_KEEPALIVE_INTERVAL,
    );
    this._ws.send('__ping__');
    this._onHeartbeat();
  }

  private async _closeWebSocket() {
    if (!this._ws) {
      return;
    }
    try {
      this._ready.throw(this.isOpen ? new EdgeIdentityChangedError() : new EdgeConnectionClosedError());
      this._ready.reset();
      void this._keepaliveCtx?.dispose();
      this._keepaliveCtx = undefined;
      void this._heartBeatContext?.dispose();
      this._heartBeatContext = undefined;

      // NOTE: Remove event handlers to avoid scheduling restart.
      this._ws.onopen = () => {};
      this._ws.onclose = () => {};
      this._ws.onerror = () => {};
      this._ws.close();
      this._ws = undefined;
    } catch (err) {
      if (err instanceof Error && err.message.includes('WebSocket is closed before the connection is established.')) {
        return;
      }
      log.warn('Error closing websocket', { err });
    }
  }

  /**
   * Send message.
   * NOTE: The message is guaranteed to be delivered but the service must respond with a message to confirm processing.
   */
  public async send(message: Message): Promise<void> {
    if (this._ready.state !== TriggerState.RESOLVED) {
      log('waiting for websocket to become ready');
      await this._ready.wait({ timeout: this._config.timeout ?? DEFAULT_TIMEOUT });
    }
    if (!this._ws) {
      throw new EdgeConnectionClosedError();
    }
    if (
      message.source &&
      (message.source.peerKey !== this._identity.peerKey || message.source.identityKey !== this.identityKey)
    ) {
      throw new EdgeIdentityChangedError();
    }

    log('sending...', { peerKey: this._identity.peerKey, payload: protocol.getPayloadType(message) });
    this._ws.send(buf.toBinary(MessageSchema, message));
  }

  private _onHeartbeat() {
    if (this._lifecycleState !== LifecycleState.OPEN) {
      return;
    }
    void this._heartBeatContext?.dispose();
    this._heartBeatContext = new Context();
    scheduleTask(
      this._heartBeatContext,
      () => {
        this._persistentLifecycle.scheduleRestart();
      },
      2 * SIGNAL_KEEPALIVE_INTERVAL,
    );
  }

  private async _createAuthHeader(path: string): Promise<string | undefined> {
    const httpUrl = new URL(path, this._baseHttpUrl);
    httpUrl.protocol = getEdgeUrlWithProtocol(this._baseWsUrl.toString(), 'http');
    const response = await fetch(httpUrl, { method: 'GET' });
    if (response.status === 401) {
      return encodePresentationWsAuthHeader(await handleAuthChallenge(response, this._identity));
    } else {
      log.warn('no auth challenge from edge', { status: response.status, statusText: response.statusText });
      return undefined;
    }
  }
}

const encodePresentationWsAuthHeader = (encodedPresentation: Uint8Array): string => {
  // = and / characters are not allowed in the WebSocket subprotocol header.
  const encodedToken = Buffer.from(encodedPresentation).toString('base64').replace(/=*$/, '').replaceAll('/', '|');
  return `base64url.bearer.authorization.dxos.org.${encodedToken}`;
};
