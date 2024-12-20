//
// Copyright 2024 DXOS.org
//

import { type UnsubscribeCallback } from '@dxos/async';
import {
  create,
  MutableSchema,
  type ObjectAnnotation,
  ObjectAnnotationId,
  effectToJsonSchema,
  getObjectAnnotation,
  makeStaticSchema,
  type StaticSchema,
  StoredSchema,
  type S,
} from '@dxos/echo-schema';
import { invariant } from '@dxos/invariant';
import { log } from '@dxos/log';

import { type EchoDatabase } from './database';
import { getObjectCore } from '../echo-handler';
import { Filter } from '../query';

type SchemaListChangedCallback = (schema: MutableSchema[]) => void;

export type MutableSchemaRegistryOptions = {
  /**
   * Run a reactive query for dynamic schemas.
   * @default true
   */
  reactiveQuery?: boolean;
};

/**
 * Per-space set of mutable schemas.
 */
export class MutableSchemaRegistry {
  private readonly _schemaById: Map<string, MutableSchema> = new Map();
  private readonly _schemaByType: Map<string, MutableSchema> = new Map();
  private readonly _unsubscribeById: Map<string, UnsubscribeCallback> = new Map();
  private readonly _schemaListChangeListeners: SchemaListChangedCallback[] = [];

  constructor(
    private readonly _db: EchoDatabase,
    { reactiveQuery = true }: MutableSchemaRegistryOptions = {},
  ) {
    if (reactiveQuery) {
      this._db.query(Filter.schema(StoredSchema)).subscribe(({ objects }) => {
        const currentObjectIds = new Set(objects.map((o) => o.id));
        const newObjects = objects.filter((o) => !this._schemaById.has(o.id));
        const removedObjects = [...this._schemaById.keys()].filter((oid) => !currentObjectIds.has(oid));
        newObjects.forEach((obj) => this._register(obj));
        removedObjects.forEach((oid) => this._unregisterById(oid));
        if (newObjects.length > 0 || removedObjects.length > 0) {
          this._notifySchemaListChanged();
        }
      });
    }
  }

  public hasSchema(schema: S.Schema<any>): boolean {
    const schemaId = schema instanceof MutableSchema ? schema.id : getObjectAnnotation(schema)?.schemaId;
    return schemaId != null && this.getSchemaById(schemaId) != null;
  }

  public getSchemaByTypename(typename: string): MutableSchema | undefined {
    return this._schemaByType.get(typename);
  }

  public getSchemaById(id: string): MutableSchema | undefined {
    const existing = this._schemaById.get(id);
    if (existing != null) {
      return existing;
    }

    const typeObject = this._db.getObjectById(id);
    if (typeObject == null) {
      return undefined;
    }

    if (!(typeObject instanceof StoredSchema)) {
      log.warn('type object is not a stored schema', { id: typeObject?.id });
      return undefined;
    }

    return this._register(typeObject);
  }

  // TODO(burdon): Remove?
  public async list(): Promise<MutableSchema[]> {
    const { objects } = await this._db.query(Filter.schema(StoredSchema)).run();
    return objects.map((stored) => {
      return this._register(stored);
    });
  }

  // TODO(burdon): Reconcile with list.
  public async listAll(): Promise<StaticSchema[]> {
    const { objects } = await this._db.query(Filter.schema(StoredSchema)).run();
    const storedSchemas = objects.map((storedSchema) => {
      const schema = new MutableSchema(storedSchema);
      return {
        id: storedSchema.id,
        version: storedSchema.version,
        typename: schema.typename,
        schema: schema.schema,
      } satisfies StaticSchema;
    });

    const runtimeSchemas = this._db.graph.schemaRegistry.schemas.map(makeStaticSchema);
    return [...runtimeSchemas, ...storedSchemas];
  }

  public subscribe(callback: SchemaListChangedCallback): UnsubscribeCallback {
    callback([...this._schemaById.values()]);
    this._schemaListChangeListeners.push(callback);
    return () => {
      const index = this._schemaListChangeListeners.indexOf(callback);
      if (index >= 0) {
        this._schemaListChangeListeners.splice(index, 1);
      }
    };
  }

  public addSchema(schema: S.Schema<any>): MutableSchema {
    const typeAnnotation = getObjectAnnotation(schema);
    invariant(typeAnnotation, 'use S.Struct({}).pipe(EchoObject(...)) or class syntax to create a valid schema');
    const schemaToStore = create(StoredSchema, {
      typename: typeAnnotation.typename,
      version: typeAnnotation.version,
      jsonSchema: {},
    });

    const updatedSchema = schema.annotations({
      [ObjectAnnotationId]: { ...typeAnnotation, schemaId: schemaToStore.id } satisfies ObjectAnnotation,
    });

    schemaToStore.jsonSchema = effectToJsonSchema(updatedSchema);
    const storedSchema = this._db.add(schemaToStore);
    const result = this._register(storedSchema);
    this._notifySchemaListChanged();
    return result;
  }

  public registerSchema(schema: StoredSchema): MutableSchema {
    const existing = this._schemaById.get(schema.id);
    if (existing != null) {
      return existing;
    }

    const registered = this._register(schema);
    this._notifySchemaListChanged();
    return registered;
  }

  private _register(schema: StoredSchema): MutableSchema {
    const existing = this._schemaById.get(schema.id);
    if (existing != null) {
      return existing;
    }

    const mutableSchema = new MutableSchema(schema);
    const subscription = getObjectCore(schema).updates.on(() => {
      mutableSchema.invalidate();
    });

    this._schemaById.set(schema.id, mutableSchema);
    this._schemaByType.set(schema.typename, mutableSchema);
    this._unsubscribeById.set(schema.id, subscription);
    return mutableSchema;
  }

  private _unregisterById(id: string) {
    const schema = this._schemaById.get(id);
    if (schema != null) {
      this._schemaById.delete(id);
      this._schemaByType.delete(schema.typename);
      this._unsubscribeById.get(schema.id)?.();
      this._unsubscribeById.delete(schema.id);
    }
  }

  private _notifySchemaListChanged() {
    const list = [...this._schemaById.values()];
    this._schemaListChangeListeners.forEach((s) => s(list));
  }
}
