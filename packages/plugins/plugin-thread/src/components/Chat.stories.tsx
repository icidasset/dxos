//
// Copyright 2023 DXOS.org
//

import '@dxos-theme';

import { type Meta } from '@storybook/react';
import React, { useEffect, useState } from 'react';

import { SurfaceProvider } from '@dxos/app-framework';
import { ThreadType } from '@dxos/plugin-space/types';
import { faker } from '@dxos/random';
import { useClient } from '@dxos/react-client';
import { type Space } from '@dxos/react-client/echo';
import { useIdentity } from '@dxos/react-client/halo';
import { ClientRepeater } from '@dxos/react-client/testing';
import { Mosaic } from '@dxos/react-ui-mosaic';
import { Thread } from '@dxos/react-ui-thread';
import { withLayout, withTheme } from '@dxos/storybook-utils';

import { ChatContainer } from './ChatContainer';
import { createChatThread } from './testing';
import translations from '../translations';

faker.seed(1);

const Story = () => {
  const client = useClient();
  const identity = useIdentity();
  const [space, setSpace] = useState<Space>();
  const [thread, setThread] = useState<ThreadType | null>();

  useEffect(() => {
    if (identity) {
      setTimeout(async () => {
        const space = await client.spaces.create();
        const thread = space.db.add(createChatThread(identity));
        setSpace(space);
        setThread(thread);
      });
    }
  }, [identity]);

  if (!identity || !thread) {
    return null;
  }

  return (
    <SurfaceProvider
      value={{
        components: {
          ObjectMessage: ({ role }) => {
            return <span>{JSON.stringify({ role })}</span>;
          },
        },
      }}
    >
      <Mosaic.Root debug>
        <main className='max-is-prose mli-auto bs-dvh overflow-hidden'>
          {space && <ChatContainer thread={thread} />}
        </main>
        <Mosaic.DragOverlay />
      </Mosaic.Root>
    </SurfaceProvider>
  );
};

export const Default = {};

const meta: Meta = {
  title: 'plugins/plugin-thread/Chat',
  component: Thread,
  // TODO(burdon): Use decorator.
  render: () => <ClientRepeater component={Story} createIdentity createSpace types={[ThreadType]} />,
  decorators: [withTheme, withLayout({ fullscreen: true })],
  parameters: { translations },
};

export default meta;
