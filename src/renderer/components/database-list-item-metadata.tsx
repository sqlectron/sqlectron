import React, { useCallback, useMemo, useState } from 'react';
import groupBy from 'lodash/groupBy';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import CollapseIcon from './collapse-icon';
import DatabaseItem from './database-item';
import type { Database } from '../reducers/databases';
import type { DbTable } from '../../common/types/database';
import type { ActionType, ObjectType } from '../reducers/sqlscripts';
import type { ColumnsByTable } from '../reducers/columns';
import type { TriggersByTable } from '../reducers/triggers';
import type { IndexesByTable } from '../reducers/indexes';

interface Props<T> {
  title: string;
  objectType: ObjectType;
  client: string;
  items: undefined | null | T[];
  columnsByTable?: ColumnsByTable;
  triggersByTable?: TriggersByTable;
  indexesByTable?: IndexesByTable;
  collapsed?: boolean;
  database: Database;
  onExecuteDefaultQuery?: (database: Database, table: DbTable) => void;
  onSelectItem?: (database: Database, item: DbTable) => void;
  onGetSQLScript: (
    database: Database,
    item: { name: string; schema?: string },
    actionType: ActionType,
    objectType: ObjectType,
  ) => void;
}

const DatabaseListItemMetatada = <T extends { schema?: string; name: string }>({
  title,
  objectType,
  client,
  items,
  columnsByTable,
  triggersByTable,
  indexesByTable,
  collapsed = false,
  database,
  onExecuteDefaultQuery,
  onGetSQLScript,
  onSelectItem,
}: Props<T>) => {
  const [tableUncollapsed, setTableUncollapsed] = useState<Record<string, boolean>>({});

  const [isCollapsed, setIsCollapsed] = useState(!!collapsed);

  const handleTableCollapse = useCallback((key: string) => {
    setTableUncollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const grouped = useMemo(() => (items ? groupBy(items, 'schema') : {}), [items]);

  const hasItems = !!items?.length;
  const Icon = isCollapsed ? ChevronRight : ChevronDown;

  return (
    <div>
      <div
        title={isCollapsed ? 'Expand' : 'Collapse'}
        className={cn(
          'flex cursor-pointer items-center gap-1 px-2 py-0.5 text-xs font-medium text-slate-600',
          !hasItems && 'text-slate-300',
        )}
        onClick={toggleCollapse}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {title}
      </div>
      {!isCollapsed && items && (
        <div className="ml-2 flex flex-col">
          {!items.length ? (
            <div className="px-2 py-0.5 text-xs italic text-slate-300">No results found</div>
          ) : (
            Object.keys(grouped).map((key) => {
              const hasGroup = !(key === 'undefined' || key === undefined || key === '');
              const hasChildren = !!grouped[key].length;
              return (
                <div key={`list-item.${key}.${title}.${database.name}`}>
                  {hasGroup && (
                    <div
                      className={cn(
                        'flex items-center gap-1 px-2 py-0.5 text-xs',
                        hasChildren ? 'cursor-pointer' : 'cursor-default',
                      )}
                      onClick={() => handleTableCollapse(key)}
                    >
                      {hasChildren ? (
                        <CollapseIcon arrowDirection={tableUncollapsed[key] ? 'down' : 'right'} />
                      ) : (
                        <span className="w-3.5 shrink-0" />
                      )}
                      {key}
                    </div>
                  )}
                  {(!hasGroup || (hasChildren && tableUncollapsed[key])) &&
                    grouped[key].map((item) => {
                      const { schema, name } = item;
                      const fullName = schema ? `${schema}.${name}` : name;

                      return (
                        <DatabaseItem
                          key={`${key}.${title}.${database.name}.${fullName}`}
                          client={client}
                          database={database}
                          item={item}
                          dbObjectType={objectType}
                          indent={hasGroup}
                          columnsByTable={columnsByTable}
                          triggersByTable={triggersByTable}
                          indexesByTable={indexesByTable}
                          onSelectItem={onSelectItem}
                          onExecuteDefaultQuery={onExecuteDefaultQuery}
                          onGetSQLScript={onGetSQLScript}
                        />
                      );
                    })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

DatabaseListItemMetatada.displayName = 'DatabaseListItemMetatada';
export default DatabaseListItemMetatada;
