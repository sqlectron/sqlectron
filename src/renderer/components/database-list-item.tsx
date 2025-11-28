import React, {
  CSSProperties,
  FC,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import DatabaseListItemMetatada from './database-list-item-metadata';
import DatabaseFilter from './database-filter';
import * as eventKeys from '../../common/event';
import ContextMenu from '../utils/context-menu';
import { useAppSelector } from '../hooks/redux';
import { Database } from '../reducers/databases';
import { DbTable } from '../../common/types/database';
import type { ActionType, ObjectType } from '../reducers/sqlscripts';
import { escapeRegExpString } from '../utils/regexp';

const MENU_CTX_ID = 'CONTEXT_MENU_DATABASE_LIST_ITEM';

const STYLE: Record<string, CSSProperties> = {
  database: {
    fontSize: '0.85em',
    color: '#636363',
    wordBreak: 'break-all',
    cursor: 'pointer',
    // force menu item go over the parent padding
    // this way allows the whole line be clickable
    position: 'absolute',
    margin: '-0.92857143em -1.14285714em',
    padding: '0.92857143em 1.14285714em',
    display: 'block',
  },
  activeDatabase: {
    backgroundColor: '#FFFAF3',
    boxShadow: '0 0 0 1px #C9BA9B inset,0 0 0 0 transparent',
  },
  loadedDatabase: {
    backgroundColor: '#F8FFFF',
  },
};

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
  onShowDiagramModal: (database: Database) => void;
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
  onShowDiagramModal,
}) => {
  const {
    tables,
    views,
    functions,
    procedures,
    columnsByTable,
    triggersByTable,
    indexesByTable,
  } = useAppSelector((state) => ({
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

    contextMenu.append({
      label: 'Show Database Diagram',
      event: eventKeys.BROWSER_MENU_SHOW_DATABASE_DIAGRAM,
      click: () => onShowDiagramModal(database),
    });

    contextMenu.build();

    return () => {
      contextMenu.dispose();
    };
  }, [contextMenu, database, onRefreshDatabase, onOpenTab, onShowDiagramModal]);

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

  const styleComponent = isCurrentDB
    ? STYLE.activeDatabase
    : isMetadataLoaded
    ? STYLE.loadedDatabase
    : {};

  const collapseCssClass = !isMetadataLoaded || collapsed ? 'right' : 'down';

  const filteredTables = !collapsed && isMetadataLoaded ? filterItems(filter, tables) : tables;
  const filteredViews = !collapsed && isMetadataLoaded ? filterItems(filter, views) : views;
  const filteredFunctions =
    !collapsed && isMetadataLoaded ? filterItems(filter, functions) : functions;
  const filteredProcedures =
    !collapsed && isMetadataLoaded ? filterItems(filter, procedures) : procedures;

  const cssStyleItems = collapsed || !isMetadataLoaded ? { display: 'none' } : {};

  return (
    <div className={`item ${isCurrentDB ? 'active' : ''}`} style={styleComponent}>
      <span
        className="header"
        onClick={() => onHeaderClick(database)}
        onContextMenu={onContextMenu}
        style={STYLE.database}>
        <i className={`${collapseCssClass} triangle icon`} />
        <i className="database icon" />
        {database.name}
      </span>
      {isCurrentDB && !isMetadataLoaded ? (
        <div className="ui list">
          <div className="item">
            <DatabaseFilter
              isFetching
              placeholder="Loading..."
              onFilterChange={() => {
                /* pass */
              }}
            />
          </div>
        </div>
      ) : (
        <div className="ui list" style={cssStyleItems}>
          <div className="item" style={cssStyleItems}>
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
      )}
      {/* create a blank empty div the user cannot click on, so cannot accidently trigger onFocus */}
      <div ref={databaseRef} tabIndex={-1} onFocus={onFocus}></div>
    </div>
  );
};

DatabaseListItem.displayName = 'DatabaseListItem';
export default DatabaseListItem;
