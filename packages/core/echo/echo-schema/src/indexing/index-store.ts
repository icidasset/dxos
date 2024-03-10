//
// Copyright 2024 DXOS.org
//

import { invariant } from '@dxos/invariant';
import { log } from '@dxos/log';
import { type Directory } from '@dxos/random-access-storage';

import { IndexConstructors } from './index-constructors';
import { type IndexKind, type Index } from './types';
import { overrideFile } from './util';

const RESERVED_SIZE = 4; // 4 bytes
const HEADER_VERSION = 1;

type IndexHeader = {
  kind: IndexKind;
  version: number;
};

export type IndexStoreParams = {
  directory: Directory;
};

export class IndexStore {
  private readonly _directory: Directory;
  constructor({ directory }: IndexStoreParams) {
    this._directory = directory;
  }

  async save(index: Index) {
    const file = this._directory.getOrCreateFile(index.identifier);

    const serialized = Buffer.from(await index.serialize());
    const header = Buffer.from(JSON.stringify(headerEncoder.encode(index.kind)));

    const metadata = Buffer.alloc(RESERVED_SIZE);
    metadata.writeInt32LE(header.length, 0);
    const data = Buffer.concat([metadata, header, serialized]);

    await overrideFile(file, data);
  }

  async load(identifier: string): Promise<Index> {
    const file = this._directory.getOrCreateFile(identifier);
    const { size } = await file.stat();

    const headerSize = fromBytesInt32(await file.read(0, 4));
    const header: IndexHeader = JSON.parse((await file.read(RESERVED_SIZE, headerSize)).toString());
    invariant(header.version === HEADER_VERSION, `Index version ${header.version} is not supported`);

    const kind = headerEncoder.decode(header);
    const IndexConstructor = IndexConstructors[kind.kind];
    invariant(IndexConstructor, `Index kind ${kind.kind} is not supported`);

    const offset = RESERVED_SIZE + headerSize;
    const serialized = (await file.read(offset, size - offset)).toString();
    return IndexConstructor.load({ serialized, indexKind: kind, identifier });
  }

  async loadAllIndexes(): Promise<Index[]> {
    const files = await this._directory.list();
    const indexes = await Promise.all(
      files.map((file) => this.load(file).catch((err) => log.warn('failed to load index', { file, err }))),
    );
    return indexes.filter(Boolean) as Index[];
  }
}

const headerEncoder = {
  encode: (kind: IndexKind): IndexHeader => {
    return {
      kind,
      version: HEADER_VERSION,
    };
  },
  decode: (header: IndexHeader): IndexKind => {
    return header.kind;
  },
};

const fromBytesInt32 = (buf: Buffer) => buf.readInt32LE(0);