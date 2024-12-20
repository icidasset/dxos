//
// Copyright 2023 DXOS.org
//

import '@dxos-theme';

import React from 'react';

import { Status } from './Status';
import { withTheme } from '../../testing';

export default {
  title: 'ui/react-ui-core/Status',
  component: Status,
  decorators: [withTheme],
  parameters: { chromatic: { disableSnapshot: false } },
};

export const Normal = (props: any) => {
  return (
    <div className='m-5 space-b-5'>
      <Status classNames='block' progress={0} {...props} />
      <Status classNames='block' progress={0.3} {...props} />
      <Status classNames='block' progress={0.7} {...props} />
      <Status classNames='block' progress={1} {...props} />
    </div>
  );
};

export const Indeterminate = (props: any) => {
  return (
    <div className='m-5'>
      <Status classNames='block' indeterminate {...props} />
    </div>
  );
};
