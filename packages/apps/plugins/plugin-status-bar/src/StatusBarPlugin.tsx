//
// Copyright 2024 DXOS.org
//

import React from 'react';

import { type PluginDefinition, type SurfaceProvides, type TranslationsProvides } from '@dxos/app-framework';

import { StatusBarImpl } from './components';
import meta from './meta';
import translations from './translations';

export type StatusBarPluginProvides = SurfaceProvides & TranslationsProvides;

export const StatusBarPlugin = (): PluginDefinition<StatusBarPluginProvides> => {
  return {
    meta,
    provides: {
      translations,
      surface: {
        component: ({ role }) => {
          switch (role) {
            case 'status-bar': {
              return <StatusBarImpl />;
            }
          }

          return null;
        },
      },
    },
  };
};
