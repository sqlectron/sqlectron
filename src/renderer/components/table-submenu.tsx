import React, { useCallback, useState } from 'react';
import { ChevronDown, ChevronRight, Columns } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props<T> {
  title: string;
  table: string;
  itemsByTable: undefined | { [table: string]: T[] };
  startCollapsed?: boolean;
}

const TableSubmenu = <T extends { name: string; dataType?: string }>({
  title,
  table,
  itemsByTable,
  startCollapsed = false,
}: Props<T>) => {
  const [collapsed, setCollapsed] = useState(startCollapsed);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const hasItems = !!itemsByTable?.[table]?.length;
  const Icon = collapsed ? ChevronRight : ChevronDown;

  return (
    <div>
      <div
        title={collapsed ? 'Expand' : 'Collapse'}
        className={cn(
          'flex cursor-pointer items-center gap-1 px-2 py-0.5 text-xs font-medium text-slate-600',
          !hasItems && 'text-slate-300',
        )}
        onClick={toggleCollapse}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {title}
      </div>
      {!collapsed && (
        <div className="ml-4 flex flex-col">
          {!itemsByTable?.[table] ? null : !itemsByTable[table].length ? (
            <div className="px-2 py-0.5 text-xs italic text-slate-300">No results found</div>
          ) : (
            itemsByTable[table].map((item) => (
              <div
                key={item.name}
                title={item.name}
                className="flex items-center gap-1 px-2 py-0.5 text-xs"
              >
                {title === 'Columns' && <Columns className="h-3.5 w-3.5 shrink-0" />}
                <span className="truncate">{item.name}</span>
                {title === 'Columns' && (
                  <span className="ml-auto shrink-0 uppercase text-slate-400">{item.dataType}</span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

TableSubmenu.displayName = 'TableSubmenu';
export default TableSubmenu;
