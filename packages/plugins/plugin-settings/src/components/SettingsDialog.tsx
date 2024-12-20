//
// Copyright 2023 DXOS.org
//

import React, { useState } from 'react';

import { type PluginMeta, Surface, usePlugins } from '@dxos/app-framework';
import { Button, Dialog, Icon, useTranslation } from '@dxos/react-ui';
import { Tabs, type TabsActivePart } from '@dxos/react-ui-tabs';
import { getSize } from '@dxos/react-ui-theme';
import { nonNullable } from '@dxos/util';

import { SETTINGS_PLUGIN } from '../meta';

const sortPlugin = ({ name: a }: PluginMeta, { name: b }: PluginMeta) => a?.localeCompare(b ?? '') ?? 0;

// TODO(burdon): Factor out common defs?
const core = [
  'dxos.org/plugin/deck',
  'dxos.org/plugin/space',
  'dxos.org/plugin/stack',
  'dxos.org/plugin/observability',
  'dxos.org/plugin/registry',
  'dxos.org/plugin/settings',
];

export type SettingsDialogProps = {
  selected: string;
  onSelected: (plugin: string) => void;
};

export const SettingsDialog = ({ selected, onSelected }: SettingsDialogProps) => {
  const { t } = useTranslation(SETTINGS_PLUGIN);
  const { plugins, enabled } = usePlugins();

  const corePlugins = core
    .map((id) => plugins.find((plugin) => plugin.meta.id === id)?.meta)
    .filter(nonNullable)
    .sort(sortPlugin);

  const filteredPlugins = enabled
    .filter((id) => !core.includes(id))
    .map((id) => plugins.find((plugin) => plugin.meta.id === id))
    .filter((plugin) => (plugin?.provides as any)?.settings)
    .map((plugin) => plugin!.meta)
    .sort(sortPlugin);

  const [tabsActivePart, setTabsActivePart] = useState<TabsActivePart>('list');

  // TODO(burdon): Standardize dialogs.
  return (
    <Dialog.Content classNames='p-0 bs-content max-bs-full md:max-is-[40rem] overflow-hidden'>
      <div role='none' className='flex justify-between mbe-1 pbs-3 pis-2 pie-3 @md:pbs-4 @md:pis-4 @md:pie-5'>
        <Dialog.Title
          onClick={() => setTabsActivePart('list')}
          aria-description={t('click to return to tablist description')}
          classNames='flex cursor-pointer items-center group/title'
        >
          <Icon
            icon='ph--caret-left--regular'
            classNames={['@md:hidden', getSize(4), tabsActivePart === 'list' && 'invisible']}
          />
          <span
            className={
              tabsActivePart !== 'list'
                ? 'group-hover/title:underline @md:group-hover/title:no-underline underline-offset-4 decoration-1'
                : ''
            }
          >
            {t('settings dialog title')}
          </span>
        </Dialog.Title>
        <Dialog.Close asChild>
          <Button density='fine' variant='ghost' autoFocus>
            <Icon icon='ph--x--regular' size={3} />
          </Button>
        </Dialog.Close>
      </div>

      <Tabs.Root
        orientation='vertical'
        value={selected}
        onValueChange={(nextSelected) => onSelected(nextSelected)}
        activePart={tabsActivePart}
        onActivePartChange={setTabsActivePart}
        classNames='flex flex-col flex-1 mbs-2'
      >
        <Tabs.Viewport classNames='flex-1 min-bs-0'>
          <div role='none' className='overflow-y-auto pli-3 @md:pis-2 @md:pie-0 mbe-4 border-r border-separator'>
            <Tabs.Tablist classNames='flex flex-col max-bs-none min-is-[200px] gap-4 overflow-y-auto'>
              <PluginList title={t('core plugins label')} plugins={corePlugins} />
              {filteredPlugins.length > 0 && <PluginList title={t('custom plugins label')} plugins={filteredPlugins} />}
            </Tabs.Tablist>
          </div>

          {corePlugins.map((plugin) => (
            <Tabs.Tabpanel key={plugin.id} value={plugin.id} classNames='pli-3 @md:pli-5 max-bs-dvh overflow-y-auto'>
              <Surface role='settings' data={{ plugin: plugin.id }} />
            </Tabs.Tabpanel>
          ))}

          {filteredPlugins.map((plugin) => (
            <Tabs.Tabpanel key={plugin.id} value={plugin.id} classNames='pli-3 @md:pli-5 max-bs-dvh overflow-y-auto'>
              <Surface role='settings' data={{ plugin: plugin.id }} />
            </Tabs.Tabpanel>
          ))}
        </Tabs.Viewport>
      </Tabs.Root>
    </Dialog.Content>
  );
};

const PluginList = ({ title, plugins }: { title: string; plugins: PluginMeta[] }) => {
  return (
    <div role='none'>
      <Tabs.TabGroupHeading classNames={'pli-1 mlb-2 mbs-4 @md:mbs-2'}>{title}</Tabs.TabGroupHeading>
      <div className='flex flex-col ml-1'>
        {plugins.map((plugin) => (
          <Tabs.Tab key={plugin.id} value={plugin.id}>
            {plugin.name}
          </Tabs.Tab>
        ))}
      </div>
    </div>
  );
};
