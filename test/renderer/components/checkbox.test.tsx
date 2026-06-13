import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import Checkbox from '../../../src/renderer/components/checkbox';

const emptyFunc = () => {
  /* pass */
};

describe('<Checkbox />', () => {
  it('should have input with name and label elements', () => {
    render(
      <Checkbox
        name="test-name"
        label="test-label"
        checked={true}
        onChecked={emptyFunc}
        onUnchecked={emptyFunc}
      />,
    );
    const input = screen.getByRole('checkbox', { name: 'test-label' });
    expect(input).toHaveAttribute('name', 'test-name');
    expect(screen.getByText('test-label')).toBeInTheDocument();
  });

  it('should be checked', () => {
    render(
      <Checkbox
        name="test"
        label="test"
        checked={true}
        onChecked={emptyFunc}
        onUnchecked={emptyFunc}
      />,
    );
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('should be unchecked', () => {
    render(
      <Checkbox
        name="test"
        label="test"
        checked={false}
        onChecked={emptyFunc}
        onUnchecked={emptyFunc}
      />,
    );
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('should trigger onChecked for checked event', () => {
    let checked = false;
    let unchecked = false;
    render(
      <Checkbox
        name="test"
        label="test"
        checked={false}
        onChecked={() => {
          checked = true;
        }}
        onUnchecked={() => {
          unchecked = true;
        }}
      />,
    );
    const input = screen.getByRole('checkbox');
    expect(input).not.toBeChecked();
    fireEvent.click(input);
    expect(checked).toBe(true);
    expect(unchecked).toBe(false);
  });

  it('should trigger onUnchecked for unchecked event', () => {
    let checked = false;
    let unchecked = false;
    render(
      <Checkbox
        name="test"
        label="test"
        checked={true}
        onChecked={() => {
          checked = true;
        }}
        onUnchecked={() => {
          unchecked = true;
        }}
      />,
    );
    const input = screen.getByRole('checkbox');
    expect(input).toBeChecked();
    fireEvent.click(input);
    expect(checked).toBe(false);
    expect(unchecked).toBe(true);
  });
});
