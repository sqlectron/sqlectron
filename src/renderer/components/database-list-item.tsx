import { ChevronDown, ChevronRight, Database as DatabaseIcon } from 'lucide-react';
import React, { FC, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import * as eventKeys from '../../common/event';
import { DbTable } from '../../common/types/database';
import { useAppSelector } from '../hooks/redux';
import { cn } from '../lib/utils';
import { Database } from '../reducers/databases';
import type { ActionType, ObjectType } from '../reducers/sqlscripts';
import ContextMenu from '../utils/context-menu';
import { escapeRegExpString } from '../utils/regexp';

import DatabaseFilter from './database-filter';
import DatabaseListItemMetatada from './database-list-item-metadata';

const MENU_CTX_ID = 'CONTEXT_MENU_DATABASE_LIST_ITEM';

const filterItems: <T extends { schema?: string; name: string }>(
  filterInput: string,
  items: T[],
) => T[] = (filterInput, items) => {
  const regex = RegExp(escapeRegExpString(filterInput), 'i');
  return items.filter((item) => regex.test(`${item.schema ? `${item.schema}.` : ''}${item.name}`));
};

interface Props {
  databaseRef: RefObject<HTMLDivElement>;
  client: string;
  currentDB: string | null;
  database: Database;
  onExecuteDefaultQuery: (database: Database, table: DbTable) => void;
  onSelectTable: (database: Database, table: DbTable) => void;
  onSelectDatabase: (database: Database) => void;
  onGetSQLScript: (
    database: Database,
    item: { name: string; schema?: string },
    actionType: ActionType,
    objectType: ObjectType,
  ) => void;
  onRefreshDatabase: (database: Database) => void;
  onOpenTab: (database: Database) => void;
}

const DatabaseListItem: FC<Props> = ({
  databaseRef,
  client,
  currentDB,
  database,
  onExecuteDefaultQuery,
  onSelectTable,
  onSelectDatabase,
  onGetSQLScript,
  onRefreshDatabase,
  onOpenTab,
}) => {
  const { tables, views, functions, procedures, columnsByTable, triggersByTable, indexesByTable } =
    useAppSelector((state) => ({
      tables: state.tables.itemsByDatabase[database.name],
      views: state.views.viewsByDatabase[database.name],
      functions: state.routines.functionsByDatabase[database.name],
      procedures: state.routines.proceduresByDatabase[database.name],
      columnsByTable: state.columns.columnsByTable[database.name],
      triggersByTable: state.triggers.triggersByTable[database.name],
      indexesByTable: state.indexes.indexesByTable[database.name],
    }));

  const [filter, setFilter] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [focused, setFocused] = useState(false);

  const filterRef = useRef<HTMLInputElement>(null);

  const contextMenu = useMemo(() => {
    if (!database || !tables || !views || !functions || !procedures) {
      return;
    }
    return new ContextMenu(`${MENU_CTX_ID}@${database.name}`);
  }, [tables, views, functions, procedures, database]);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }
    if (contextMenu.isMenuBuilt) {
      return () => {
        contextMenu.dispose();
      };
    }

    contextMenu.append({
      label: 'Refresh Database',
      event: eventKeys.BROWSER_MENU_REFRESH_DATABASE,
      click: () => onRefreshDatabase(database),
    });

    contextMenu.append({
      label: 'Open Tab',
      event: eventKeys.BROWSER_MENU_OPEN_TAB,
      click: () => onOpenTab(database),
    });

    contextMenu.build();

    return () => {
      contextMenu.dispose();
    };
  }, [contextMenu, database, onRefreshDatabase, onOpenTab]);

  const onContextMenu = useCallback(
    (event) => {
      event.preventDefault();
      if (contextMenu) {
        contextMenu.popup({
          x: event.clientX,
          y: event.clientY,
        });
      }
    },
    [contextMenu],
  );

  const onFilterChange = useCallback((value) => {
    setFilter(value);
  }, []);

  const onHeaderClick = useCallback(
    (database) => {
      if (!tables || !views || !functions || !procedures) {
        onSelectDatabase(database);
        return;
      }

      setCollapsed((prev) => !prev);
    },
    [tables, views, functions, procedures, onSelectDatabase],
  );

  const onFocus = useCallback(() => {
    setCollapsed(false);
    setFocused(true);
  }, []);

  useEffect(() => {
    if (!collapsed && focused) {
      filterRef.current?.focus();
      setFocused(false);
    }
  }, [collapsed, focused]);

  const isMetadataLoaded = Boolean(tables && views && functions && procedures);
  const isCurrentDB = currentDB === database.name;

  const Icon = !isMetadataLoaded || collapsed ? ChevronRight : ChevronDown;

  const filteredTables = !collapsed && isMetadataLoaded ? filterItems(filter, tables) : tables;
  const filteredViews = !collapsed && isMetadataLoaded ? filterItems(filter, views) : views;
  const filteredFunctions =
    !collapsed && isMetadataLoaded ? filterItems(filter, functions) : functions;
  const filteredProcedures =
    !collapsed && isMetadataLoaded ? filterItems(filter, procedures) : procedures;

  return (
    <div
      className={cn(
        'rounded-sm',
        isCurrentDB && 'bg-amber-50 ring-1 ring-inset ring-amber-200',
        !isCurrentDB && isMetadataLoaded && 'bg-cyan-50/60',
      )}
    >
      <div
        data-testid="db-header"
        className="flex cursor-pointer items-center gap-1 px-2 py-1 text-sm"
        onClick={() => onHeaderClick(database)}
        onContextMenu={onContextMenu}
      >
        <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <DatabaseIcon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{database.name}</span>
      </div>
      {isCurrentDB && !isMetadataLoaded ? (
        <div className="ml-2 px-2 py-0.5">
          <DatabaseFilter
            isFetching
            placeholder="Loading..."
            onFilterChange={() => {
              /* pass */
            }}
          />
        </div>
      ) : (
        !collapsed &&
        isMetadataLoaded && (
          <div className="ml-2 flex flex-col">
            <div className="px-2 py-0.5">
              <DatabaseFilter
                ref={filterRef}
                value={filter}
                isFetching={!isMetadataLoaded}
                onFilterChange={onFilterChange}
              />
            </div>
            <DatabaseListItemMetatada
              title="Tables"
              objectType="Table"
              client={client}
              items={filteredTables}
              columnsByTable={columnsByTable}
              triggersByTable={triggersByTable}
              indexesByTable={indexesByTable}
              database={database}
              onExecuteDefaultQuery={onExecuteDefaultQuery}
              onSelectItem={onSelectTable}
              onGetSQLScript={onGetSQLScript}
            />
            <DatabaseListItemMetatada
              collapsed
              title="Views"
              objectType="View"
              client={client}
              items={filteredViews}
              database={database}
              onExecuteDefaultQuery={onExecuteDefaultQuery}
              onGetSQLScript={onGetSQLScript}
            />
            <DatabaseListItemMetatada
              collapsed
              title="Functions"
              objectType="Function"
              client={client}
              items={filteredFunctions}
              database={database}
              onGetSQLScript={onGetSQLScript}
            />
            <DatabaseListItemMetatada
              collapsed
              title="Procedures"
              objectType="Procedure"
              client={client}
              items={filteredProcedures}
              database={database}
              onGetSQLScript={onGetSQLScript}
            />
          </div>
        )
      )}
      {/* create a blank empty div the user cannot click on, so cannot accidently trigger onFocus */}
      <div ref={databaseRef} tabIndex={-1} onFocus={onFocus}></div>
    </div>
  );
};

DatabaseListItem.displayName = 'DatabaseListItem';
export default DatabaseListItem;
