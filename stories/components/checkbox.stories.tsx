import { Meta } from '@storybook/react';
import React, { FC } from 'react';

import Checkbox, { CheckboxProps } from '../../src/renderer/components/checkbox';

export default {
  title: 'Components/Checkbox',
  component: Checkbox,
  argTypes: {
    name: {
      control: {
        type: 'text',
      },
      defaultValue: 'test',
    },
    label: {
      control: {
        type: 'text',
      },
      defaultValue: 'label',
    },
    disabled: {
      control: {
        type: 'boolean',
      },
    },
    checked: {
      control: {
        type: 'boolean',
      },
    },
    onChecked: {
      action: 'onChecked',
    },
    onUnchecked: {
      action: 'onUnchecked',
    },
  },
} as Meta;

export const Primary: FC<CheckboxProps> = (args) => <Checkbox {...args} />;
