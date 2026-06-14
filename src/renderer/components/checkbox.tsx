import React, { ChangeEvent, FC, useCallback } from 'react';
import { cn } from '../lib/utils';

export interface CheckboxProps {
  name: string;
  label: string;
  disabled?: boolean;
  checked: boolean;
  onChecked: () => void;
  onUnchecked: () => void;
}

const Checkbox: FC<CheckboxProps> = ({
  name,
  label,
  disabled,
  checked,
  onChecked,
  onUnchecked,
}) => {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
        onChecked();
      } else {
        onUnchecked();
      }
    },
    [onChecked, onUnchecked],
  );

  return (
    <label
      className={cn(
        'inline-flex items-center gap-2 text-sm font-medium',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      )}
    >
      <input
        type="checkbox"
        name={name}
        disabled={disabled}
        onChange={handleChange}
        checked={checked === true}
        className="peer sr-only"
      />
      <span
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full bg-slate-300 transition-colors',
          'after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full',
          'after:bg-white after:transition-transform after:content-[""]',
          'peer-checked:bg-slate-900 peer-checked:after:translate-x-4',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-slate-400 peer-focus-visible:ring-offset-2',
        )}
      />
      {label}
    </label>
  );
};

export default Checkbox;
