//
// Copyright 2023 DXOS.org
//

import {
  type FileManagerProvides,
  type MetadataRecordsProvides,
  type SurfaceProvides,
  type TranslationsProvides,
} from '@dxos/app-framework';
import { type SchemaProvides } from '@dxos/plugin-client';

import { IPFS_PLUGIN } from '../meta';

const IPFS_ACTION = `${IPFS_PLUGIN}/action`;

export enum IpfsAction {
  CREATE = `${IPFS_ACTION}/create`,
}

export type IpfsPluginProvides = FileManagerProvides &
  SurfaceProvides &
  MetadataRecordsProvides &
  TranslationsProvides &
  SchemaProvides;
