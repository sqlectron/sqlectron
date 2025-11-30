import { union } from 'lodash';
import React, {
  createRef,
  CSSProperties,
  FC,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useHistory, useRouteMatch } from 'react-router';
import { ResizableBox } from 'react-resizable';
import { DB_CLIENTS } from '../api';
import * as ConnActions from '../actions/connections';
import * as QueryActions from '../actions/queries';
import * as DbAction from '../actions/databases';
import { fetchTablesIfNeeded, selectTablesForDiagram } from '../actions/tables';
import { fetchSchemasIfNeeded } from '../actions/schemas';
import { fetchTableColumnsIfNeeded } from '../actions/columns';
import { fetchTableTriggersIfNeeded } from '../actions/triggers';
import { fetchTableIndexesIfNeeded } from '../actions/indexes';
import { fetchViewsIfNeeded } from '../actions/views';
import { fetchRoutinesIfNeeded } from '../actions/routines';
import { getSQLScriptIfNeeded } from '../actions/sqlscripts';
import { fetchTableKeysIfNeeded } from '../actions/keys';
import DatabaseFilter from '../components/database-filter';
import DatabaseList from '../components/database-list';
import DatabaseDiagramModal from '../components/database-diagram-modal';
import Header from '../components/header';
import Footer from '../components/footer';
import Loader from '../components/loader';
import PromptModal from '../components/prompt-modal';
import * as eventKeys from '../../common/event';
import { requireClientLogo } from '../components/require-context';
import MenuHandler from '../utils/menu';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { Database } from '../reducers/databases';
import { DbTable } from '../../common/types/database';
import QueryTabs from '../components/query-tabs';
import type { ActionType, ObjectType } from '../reducers/sqlscripts';
import { escapeRegExpString } from '../utils/regexp';

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('./query-browser.css');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('../components/react-resizable.css');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('../components/react-tabs.scss');

const SIDEBAR_WIDTH = 235;
const STYLES: Record<string, CSSProperties> = {
  wrapper: {},
  container: {
    display: 'flex',
    height: '100vh',
    boxSizing: 'border-box',
    padding: '50px 10px 40px 10px',
  },
  sidebar: { transition: 'all .2s' },
  content: { flex: 1, overflow: 'auto', paddingLeft: '5px' },
  collapse: {
    position: 'fixed',
    color: '#fff',
    cursor: 'pointer',
    width: 10,
    left: 0,
    height: '100vh',
    backgroundColor: 'rgb(102,102,102)',
    zIndex: 1,
    MozUserSelect: 'none',
    WebkitUserSelect: 'none',
    msUserSelect: 'none',
  },
  resizeable: { width: 'auto', maxWidth: '100%' },
};

const CLIENTS = DB_CLIENTS.reduce((clients, dbClient) => {
  clients[dbClient.key] = {
    title: dbClient.name,
    image: requireClientLogo(dbClient.key),
  };
  return clients;
}, {});

const QueryBrowserContainer: FC = () => {
  const { columns, connections, databases, keys, queries, status, tables, views } = useAppSelector(
    (state) => state,
  );
  const dispatch = useAppDispatch();
  const history = useHistory();
  const match = useRouteMatch<{ id: string }>();

  const [sideBarWidth, setSideBarWidth] = useState(SIDEBAR_WIDTH);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filter, setFilter] = useState('');

  const databaseListRefs = useMemo(
    () =>
      databases.items.reduce<Record<string, RefObject<HTMLDivElement>>>((acc, db) => {
        acc[db.name] = createRef<HTMLDivElement>();
        return acc;
      }, {}),
    [databases.items],
  );

  const databaseFilterRef = useRef<HTMLInputElement>(null);

  const queryRefs = useMemo(
    () =>
      queries.queryIds.reduce<Record<number, RefObject<HTMLDivElement>>>((acc, queryId) => {
        acc[queryId] = createRef<HTMLDivElement>();
        return acc;
      }, {}),
    [queries.queryIds],
  );

  const [menuHandler] = useState<MenuHandler>(new MenuHandler());

  useEffect(() => {
    return () => {
      menuHandler.dispose();
    };
  }, [menuHandler]);

  useEffect(() => {
    dispatch(ConnActions.connect(match.params.id));
  }, [dispatch, match.params.id]);

  useEffect(() => {
    if (
      connections.error ||
      (!connections.connecting && !connections.server && !connections.waitingPrivateKeyPassphrase)
    ) {
      history.push('/');
      return;
    }

    if (!connections.connected) {
      return;
    }

    const lastConnectedDB = connections.databases[connections.databases.length - 1];
    const filter = connections.server?.filter;

    dispatch(DbAction.fetchDatabasesIfNeeded(filter));
    dispatch(fetchSchemasIfNeeded(lastConnectedDB));
    dispatch(fetchTablesIfNeeded(lastConnectedDB, filter));
    dispatch(fetchViewsIfNeeded(lastConnectedDB, filter));
    dispatch(fetchRoutinesIfNeeded(lastConnectedDB, filter));
  }, [dispatch, history, connections]);

  const currentQuery = queries.currentQueryId ? queries.queriesById[queries.currentQueryId] : null;

  const onPromptCancelClick = useCallback(() => {
    dispatch(ConnActions.disconnect());
  }, [dispatch]);

  const onPromptOKClick = useCallback(
    (password: string) => {
      dispatch(ConnActions.connect(match.params.id, undefined, false, password));
    },
    [dispatch, match],
  );

  const onCloseConnectionClick = useCallback(() => {
    dispatch(ConnActions.disconnect());
  }, [dispatch]);

  const onReConnectionClick = useCallback(() => {
    if (currentQuery) {
      dispatch(ConnActions.reconnect(match.params.id, currentQuery.database));
    }
  }, [dispatch, match, currentQuery]);

  const onRefreshDatabase = useCallback(
    (database: Database) => {
      dispatch(DbAction.refreshDatabase(database.name));
    },
    [dispatch],
  );

  const onOpenTab = useCallback(
    (database: Database) => {
      dispatch(QueryActions.newQuery(database.name));
    },
    [dispatch],
  );

  const onShowDiagramModal = useCallback(
    (database: Database) => {
      dispatch(DbAction.showDatabaseDiagram(database.name));
    },
    [dispatch],
  );

  const onCollapseClick = useCallback(() => {
    setSidebarCollapsed(!sidebarCollapsed);
  }, [sidebarCollapsed]);

  const onFilterChange = useCallback((value: string) => {
    setFilter(value);
  }, []);

  const onSelectDatabase = useCallback(
    (database: Database) => {
      dispatch(ConnActions.connect(match.params.id, database.name));
    },
    [dispatch, match],
  );

  const onExecuteDefaultQuery = useCallback(
    (database: Database, table: DbTable) => {
      const schema = table.schema || connections.server?.schema;
      dispatch(QueryActions.executeDefaultSelectQueryIfNeeded(database.name, table.name, schema));
    },
    [dispatch, connections],
  );

  const onSelectTable = useCallback(
    (database: Database, table: DbTable) => {
      const schema = table.schema || connections.server?.schema;
      dispatch(fetchTableColumnsIfNeeded(database.name, table.name, schema));
      dispatch(fetchTableTriggersIfNeeded(database.name, table.name, schema));
      dispatch(fetchTableIndexesIfNeeded(database.name, table.name, schema));
    },
    [dispatch, connections],
  );

  const onGetSQLScript = useCallback(
    (
      database: Database,
      item: { name: string; schema?: string },
      actionType: ActionType,
      objectType: ObjectType,
    ) => {
      const schema = item.schema || connections.server?.schema;
      dispatch(getSQLScriptIfNeeded(database.name, item.name, actionType, objectType, schema));
    },
    [dispatch, connections],
  );

  const fetchTableDiagramData = useCallback(
    (database, tables: string[]) => {
      tables.forEach((item) => {
        const schema = connections.server?.schema;
        dispatch(fetchTableColumnsIfNeeded(database, item, schema));
        dispatch(fetchTableKeysIfNeeded(database, item, schema));
      });
    },
    [dispatch, connections],
  );

  const onGenerateDatabaseDiagram = useCallback(
    (database) => {
      const selectedTables: string[] = [];

      dispatch(DbAction.generateDatabaseDiagram());

      $(':checkbox:checked', 'div.ui.list').map((index, checkbox) =>
        selectedTables.push(checkbox.id),
      );

      dispatch(selectTablesForDiagram(selectedTables));
      fetchTableDiagramData(database, selectedTables);
    },
    [dispatch, fetchTableDiagramData],
  );

  const onAddRelatedTables = useCallback(
    (relatedTables: string[]) => {
      const database = databases.diagramDatabase;
      const tablesOnDiagram = tables.selectedTablesForDiagram;
      const selectedTables = union(tablesOnDiagram, relatedTables);

      dispatch(selectTablesForDiagram(selectedTables));
      fetchTableDiagramData(database, relatedTables);
    },
    [dispatch, databases, tables, fetchTableDiagramData],
  );

  const onSaveDatabaseDiagram = useCallback(
    (diagram) => {
      dispatch(DbAction.saveDatabaseDiagram(diagram));
    },
    [dispatch],
  );

  const onExportDatabaseDiagram = useCallback(
    (diagram, imageType) => {
      dispatch(DbAction.exportDatabaseDiagram(diagram, imageType));
    },
    [dispatch],
  );

  const onOpenDatabaseDiagram = useCallback(() => {
    dispatch(DbAction.openDatabaseDiagram());
  }, [dispatch]);

  const onCloseDiagramModal = useCallback(() => {
    dispatch(DbAction.closeDatabaseDiagram());
  }, [dispatch]);

  const executeQuery = useCallback(() => {
    if (!currentQuery) {
      return;
    }

    dispatch(
      QueryActions.executeQueryIfNeeded(
        currentQuery.selectedQuery || currentQuery.query,
        currentQuery.id,
      ),
    );
  }, [dispatch, currentQuery]);

  const newTab = useCallback(() => {
    if (currentQuery) {
      dispatch(QueryActions.newQuery(currentQuery.database));
    }
  }, [dispatch, currentQuery]);

  const closeTab = useCallback(() => {
    if (queries.currentQueryId) {
      dispatch(QueryActions.removeQuery(queries.currentQueryId));
    }
  }, [dispatch, queries]);

  const saveQuery = useCallback(() => {
    dispatch(QueryActions.saveQuery(false));
  }, [dispatch]);

  const saveQueryAs = useCallback(() => {
    dispatch(QueryActions.saveQuery(true));
  }, [dispatch]);

  const openQuery = useCallback(() => {
    dispatch(QueryActions.openQuery());
  }, [dispatch]);

  const focusQuery = useCallback(() => {
    if (!currentQuery) {
      return;
    }

    queryRefs[currentQuery.id].current?.focus();
  }, [currentQuery, queryRefs]);

  const toggleDatabaseSearch = useCallback(() => {
    databaseFilterRef.current?.focus();
  }, [databaseFilterRef]);

  const toggleDatabaseObjectsSearch = useCallback(() => {
    if (!currentQuery) {
      return;
    }

    databaseListRefs[currentQuery.database].current?.focus();
  }, [databaseListRefs, currentQuery]);

  useEffect(() => {
    menuHandler.setMenus({
      [eventKeys.BROWSER_MENU_QUERY_EXECUTE]: () => executeQuery(),
      [eventKeys.BROWSER_MENU_QUERY_TAB_NEW]: () => newTab(),
      [eventKeys.BROWSER_MENU_QUERY_TAB_CLOSE]: () => closeTab(),
      [eventKeys.BROWSER_MENU_QUERY_SAVE]: () => saveQuery(),
      [eventKeys.BROWSER_MENU_QUERY_SAVE_AS]: () => saveQueryAs(),
      [eventKeys.BROWSER_MENU_QUERY_OPEN]: () => openQuery(),
      [eventKeys.BROWSER_MENU_QUERY_FOCUS]: () => focusQuery(),
      [eventKeys.BROWSER_MENU_TOGGLE_DB_SEARCH]: () => toggleDatabaseSearch(),
      [eventKeys.BROWSER_MENU_TOGGLE_DB_OBJS_SEARCH]: () => toggleDatabaseObjectsSearch(),
    });
  }, [
    closeTab,
    executeQuery,
    focusQuery,
    menuHandler,
    newTab,
    openQuery,
    saveQuery,
    saveQueryAs,
    toggleDatabaseObjectsSearch,
    toggleDatabaseSearch,
  ]);

  if (connections.waitingPrivateKeyPassphrase) {
    return (
      <PromptModal
        type="password"
        title="SSH Private Key Passphrase"
        message="Enter the private key passphrase:"
        onCancelClick={onPromptCancelClick}
        onOKClick={onPromptOKClick}
      />
    );
  }

  const isLoading = !connections.connected;
  if (isLoading || !connections.server) {
    return <Loader message={status} type="page" />;
  }

  const breadcrumb = connections.server
    ? [
        { icon: 'server', label: connections.server.name },
        ...(currentQuery ? [{ icon: 'database', label: currentQuery?.database }] : []),
      ]
    : [];

  const regex = RegExp(escapeRegExpString(filter), 'i');
  const filteredDatabases = databases.items.filter((db) => regex.test(db.name));

  const selectedDb = databases.diagramDatabase;

  return (
    <div style={STYLES.wrapper}>
      <div>
        <Header
          items={breadcrumb}
          onCloseConnectionClick={onCloseConnectionClick}
          onReConnectionClick={onReConnectionClick}
        />
      </div>
      <div id="main-collapse" onClick={onCollapseClick} style={STYLES.collapse}>
        <i
          className={`${sidebarCollapsed ? 'right' : 'left'} triangle icon`}
          style={{ top: 'calc(100vh/2 - 7px)', position: 'absolute', marginLeft: -3 }}
        />
      </div>
      <div style={STYLES.container}>
        <div
          id="sidebar"
          style={{
            ...STYLES.sidebar,
            marginLeft: sidebarCollapsed ? -sideBarWidth : 0,
          }}>
          <ResizableBox
            className="react-resizable react-resizable-ew-resize"
            onResizeStop={(_, { size }) => setSideBarWidth(size.width)}
            width={sideBarWidth || SIDEBAR_WIDTH}
            axis="x"
            minConstraints={[SIDEBAR_WIDTH, 300]}
            maxConstraints={[750, 10000]}>
            <div className="ui vertical menu" style={STYLES.resizeable}>
              <div className="item active" style={{ textAlign: 'center' }}>
                <b>{connections.server?.name}</b>
                <img
                  title={CLIENTS[connections.server.client].name}
                  alt={CLIENTS[connections.server.client].name}
                  style={{ width: '2.5em' }}
                  className="ui mini left spaced image right"
                  src={CLIENTS[connections.server.client].image}
                />
              </div>
              <div className="item">
                <DatabaseFilter
                  ref={databaseFilterRef}
                  value={filter}
                  isFetching={databases.isFetching}
                  onFilterChange={onFilterChange}
                />
              </div>
              <DatabaseList
                client={connections.server.client}
                databases={filteredDatabases}
                databaseRefs={databaseListRefs}
                currentDB={currentQuery?.database || null}
                isFetching={databases.isFetching}
                onSelectDatabase={onSelectDatabase}
                onExecuteDefaultQuery={onExecuteDefaultQuery}
                onSelectTable={onSelectTable}
                onGetSQLScript={onGetSQLScript}
                onRefreshDatabase={onRefreshDatabase}
                onOpenTab={onOpenTab}
                onShowDiagramModal={onShowDiagramModal}
              />
            </div>
          </ResizableBox>
        </div>
        <div style={STYLES.content}>
          <QueryTabs sideBarWidth={sideBarWidth} queryRefs={queryRefs} />
        </div>
        {databases.showingDiagram && selectedDb && (
          <DatabaseDiagramModal
            database={databases.diagramDatabase}
            tables={tables.itemsByDatabase[selectedDb]}
            selectedTables={tables.selectedTablesForDiagram}
            views={views.viewsByDatabase[selectedDb]}
            columnsByTable={columns.columnsByTable[selectedDb]}
            tableKeys={keys.keysByTable[selectedDb]}
            diagramJSON={databases.diagramJSON}
            isSaving={databases.isSaving}
            onGenerateDatabaseDiagram={onGenerateDatabaseDiagram}
            addRelatedTables={onAddRelatedTables}
            onSaveDatabaseDiagram={onSaveDatabaseDiagram}
            onExportDatabaseDiagram={onExportDatabaseDiagram}
            onOpenDatabaseDiagram={onOpenDatabaseDiagram}
            onClose={onCloseDiagramModal}
          />
        )}
      </div>
      <div style={STYLES.footer}>
        <Footer status={status} />
      </div>
    </div>
  );
};

QueryBrowserContainer.displayName = 'QueryBrowserContainer';
export default QueryBrowserContainer;
