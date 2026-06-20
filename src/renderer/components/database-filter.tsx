import { Loader2, Search } from 'lucide-react';
import React, { ChangeEvent, forwardRef, useCallback } from 'react';

import { Input } from './ui/input';

interface Props {
  value?: string;
  placeholder?: string;
  isFetching: boolean;
  onFilterChange: (value: string) => void;
  onFocus?: () => void;
}

const DatabaseFilter = forwardRef<HTMLInputElement, Props>(
  ({ value, placeholder, isFetching, onFilterChange, onFocus }, ref) => {
    const handleFilterChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>): void => {
        onFilterChange(event.target.value);
      },
      [onFilterChange],
    );

    return (
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <Input
          type="text"
          placeholder={placeholder || 'Search...'}
          value={value || ''}
          disabled={isFetching}
          onChange={handleFilterChange}
          onFocus={onFocus}
          ref={ref}
          className="h-7 pl-7 pr-7 text-xs"
        />
        {isFetching && (
          <Loader2 className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-slate-400" />
        )}
      </div>
    );
  },
);

DatabaseFilter.displayName = 'DatabaseFilter';

export default DatabaseFilter;
