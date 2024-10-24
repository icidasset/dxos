//
// Copyright 2024 DXOS.org
//

import type { Heads } from '@dxos/automerge/automerge';
import type { DocumentId } from '@dxos/automerge/automerge-repo';
import { headsEncoding } from '@dxos/indexing';
import type { BatchLevel, SublevelDB } from '@dxos/kv-store';

export type HeadsStoreParams = {
  db: SublevelDB;
};

export class HeadsStore {
  private readonly _db: SublevelDB;

  constructor({ db }: HeadsStoreParams) {
    this._db = db;
  }

  setHeads(documentId: DocumentId, heads: Heads, batch: BatchLevel) {
    batch.put<DocumentId, Heads>(documentId, heads, {
      sublevel: this._db,
      keyEncoding: 'utf8',
      valueEncoding: headsEncoding,
    });
  }

  async getHeads(documentId: DocumentId): Promise<Heads | undefined> {
    try {
      return await this._db.get<DocumentId, Heads>(documentId, { keyEncoding: 'utf8', valueEncoding: headsEncoding });
    } catch (err: any) {
      if (err.notFound) {
        return undefined;
      }
      throw err;
    }
  }
}
