//
// Copyright 2023 DXOS.org
//

import type {
  GraphBuilderProvides,
  IntentResolverProvides,
  MetadataRecordsProvides,
  SurfaceProvides,
  TranslationsProvides,
} from '@dxos/app-framework';
import { type SchemaProvides } from '@dxos/plugin-client';
import { type SpaceInitProvides } from '@dxos/plugin-space';
import { type StackProvides } from '@dxos/plugin-stack';

import { TableType } from './table';
import { TABLE_PLUGIN } from '../meta';

const TABLE_ACTION = `${TABLE_PLUGIN}/action`;

export enum TableAction {
  CREATE = `${TABLE_ACTION}/create`,
}

export type TableProvides = {};

export type TablePluginProvides = SurfaceProvides &
  IntentResolverProvides &
  GraphBuilderProvides &
  MetadataRecordsProvides &
  SchemaProvides &
  SpaceInitProvides &
  StackProvides &
  TranslationsProvides;

export const isTable = (object: unknown): object is TableType => object != null && object instanceof TableType;
