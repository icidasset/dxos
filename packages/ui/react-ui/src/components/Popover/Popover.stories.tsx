//
// Copyright 2022 DXOS.org
//

import '@dxos-theme';

import React, { type PropsWithChildren, type ReactNode } from 'react';

import { faker } from '@dxos/random';

import { Popover } from './Popover';
import { withTheme } from '../../testing';
import { Button } from '../Buttons';

faker.seed(1234);

const StorybookPopover = ({ openTrigger, children }: PropsWithChildren<{ openTrigger: ReactNode }>) => {
  return (
    <Popover.Root defaultOpen>
      <Popover.Trigger asChild>{openTrigger}</Popover.Trigger>
      <Popover.Content>
        <Popover.Viewport>
          <p className='pli-2 plb-1 min-is-[18rem] max-is-[38rem]'>{children}</p>
        </Popover.Viewport>
        <Popover.Arrow />
      </Popover.Content>
    </Popover.Root>
  );
};

export default {
  title: 'ui/react-ui-core/Popover',
  component: Popover,
  render: StorybookPopover,
  decorators: [withTheme],
  parameters: { chromatic: { disableSnapshot: false } },
};

export const Default = {
  args: {
    openTrigger: <Button>Open popover</Button>,
    children: faker.lorem.paragraphs(3),
  },
};
