//
// Copyright 2023 DXOS.org
//

import { type PluginMeta } from '@dxos/app-framework';

export const IPFS_PLUGIN = 'dxos.org/plugin/ipfs';

export default {
  id: IPFS_PLUGIN,
  name: 'IPFS',
  description: 'Upload & view files with IPFS.',
  tags: ['experimental'],
  icon: 'ph--file-cloud--regular',
} satisfies PluginMeta;
