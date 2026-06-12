import React, { ChangeEvent, ChangeEventHandler, FC, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface Props {
  onFilterChange: ChangeEventHandler<HTMLInputElement>;
  onAddClick: () => void;
  onSettingsClick: () => void;
}

const ServerFilter: FC<Props> = ({ onFilterChange, onAddClick, onSettingsClick }) => {
  const debouncedFilterChange = useMemo(() => debounce(onFilterChange, 200), [onFilterChange]);

  const handleFilterChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      event.persist();
      debouncedFilterChange(event);
    },
    [debouncedFilterChange],
  );

  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input type="text" placeholder="Search..." onChange={handleFilterChange} className="pl-8" />
      </div>
      <Button variant="positive" onClick={onAddClick}>
        Add
      </Button>
      <Button variant="outline" onClick={onSettingsClick}>
        Settings
      </Button>
    </div>
  );
};

ServerFilter.displayName = 'ServerFilter';

export default ServerFilter;
