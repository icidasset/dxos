//
// Copyright 2024 DXOS.org
//

import { BaseBlockstore } from 'blockstore-core';
import { IDBBlockstore } from 'blockstore-idb';
import { CID } from 'multiformats';

import { storeName } from './common';

export const create = () => {
  return new MixedBlockstore();
};

/**
 * A blockstore that communicates with the DXOS blob service,
 * and which uses an indexedDB blockstore as a client cache.
 */
class MixedBlockstore extends BaseBlockstore {
  readonly #apiHost: string;
  readonly #idbStore: IDBBlockstore;

  #isConnected: boolean;
  #queue: string[];

  constructor() {
    super();

    this.#apiHost = 'http://localhost:8787';
    this.#idbStore = new IDBBlockstore(storeName());
    this.#isConnected = navigator.onLine;
    this.#queue = [];
  }

  async open() {
    await this.#idbStore.open();
    await this.#restoreQueue();

    document.addEventListener('online', async () => {
      this.#isConnected = navigator.onLine;
      await this.#flushQueue();
    });
  }

  url(cid?: CID) {
    const path = cid ? cid.toString() : '';
    return `${this.#apiHost}/api/file/${path}`;
  }

  // BLOCKSTORE IMPLEMENTATION

  override async delete(key: CID): Promise<void> {
    await this.#idbStore.delete(key);
    await fetch(this.url(key), {
      method: 'DELETE',
    });
  }

  override async get(key: CID): Promise<Uint8Array> {
    if (await this.#idbStore.has(key)) {
      return await this.#idbStore.get(key);
    }

    return await fetch(this.url(key), {
      method: 'GET',
    })
      .then((r) => r.arrayBuffer())
      .then((r) => new Uint8Array(r));
  }

  override async has(key: CID): Promise<boolean> {
    if (await this.#idbStore.has(key)) {
      return true;
    }

    return await fetch(this.url(key), {
      method: 'HEAD',
    }).then((r) => r.ok);
  }

  override async put(key: CID, val: Uint8Array): Promise<CID> {
    await this.#idbStore.put(key, val);

    if (this.#isConnected) {
      await this.putRemote(key, val);
    } else {
      this.#addToQueue(key);
    }

    return key;
  }

  async destroy(): Promise<void> {
    await this.#idbStore.destroy();
  }

  // REMOTE

  async putRemote(key: CID, val: Uint8Array) {
    await fetch(this.url(key), {
      method: 'POST',
      body: val,
    });
  }

  // QUEUE

  #addToQueue(key: CID) {
    this.#queue = [...this.#queue, key.toString()];
  }

  async #flushQueue() {
    const keys = [...this.#queue];

    if (!this.#isConnected) {
      return;
    }

    await Promise.all(
      keys.map(async (key) => {
        const cid = CID.parse(key);
        const val = await this.#idbStore.get(cid);

        await this.putRemote(cid, val);
      }),
    );

    this.#queue = [];
  }

  async #restoreQueue() {
    await this.#flushQueue();
  }
}
