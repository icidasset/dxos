//
// Copyright 2024 DXOS.org
//

import { type Meta } from '@storybook/react';
import React, { useEffect, useState } from 'react';

import { create } from '@dxos/echo-schema';
import { FunctionDef, FunctionTrigger } from '@dxos/functions/types';
import { useSpace } from '@dxos/react-client/echo';
import { type ClientRepeatedComponentProps, ClientRepeater } from '@dxos/react-client/testing';
import { withTheme } from '@dxos/storybook-utils';

import { TriggerEditor } from './TriggerEditor';
import translations from '../../translations';
import { ChainPromptType } from '../../types';

const functions: Omit<FunctionDef, 'id'>[] = [
  {
    uri: 'dxos.org/function/email-worker',
    route: '/email-worker',
    handler: 'email-worker',
    description: 'Email Sync',
  },
  {
    uri: 'dxos.org/function/gpt',
    route: '/gpt',
    handler: 'gpt',
    description: 'GPT Chat',
  },
];

const TriggerEditorStory = ({ spaceKey }: ClientRepeatedComponentProps) => {
  const [trigger, setTrigger] = useState<FunctionTrigger>();
  const space = useSpace(spaceKey);
  useEffect(() => {
    if (!space) {
      return;
    }

    const trigger = space.db.add(create(FunctionTrigger, { function: '', spec: { type: 'timer', cron: '0 0 * * *' } }));
    setTrigger(trigger);
  }, [space, setTrigger]);
  if (!space || !trigger) {
    return null;
  }

  return (
    <div role='none' className='max-w-[300px] border border-separator overflow-hidden'>
      <TriggerEditor space={space} trigger={trigger} />
    </div>
  );
};

export const Default = {};

const meta: Meta = {
  title: 'plugins/plugin-automation/TriggerEditor',
  render: () => (
    <ClientRepeater
      component={TriggerEditorStory}
      types={[FunctionTrigger, FunctionDef, ChainPromptType]}
      createIdentity
      createSpace
      onSpaceCreated={({ space }) => {
        for (const fn of functions) {
          space.db.add(create(FunctionDef, fn));
        }
      }}
    />
  ),
  decorators: [withTheme],
  parameters: {
    layout: 'centered',
    translations,
  },
};

export default meta;