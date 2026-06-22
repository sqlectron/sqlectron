import { autocompletion, CompletionContext } from '@codemirror/autocomplete';
import { selectLine } from '@codemirror/commands';
import {
  sql,
  Cassandra,
  keywordCompletionSource,
  MariaSQL,
  MSSQL,
  MySQL,
  PostgreSQL,
  SQLDialect,
  SQLite,
  StandardSQL,
} from '@codemirror/lang-sql';
import { search } from '@codemirror/search';
import { Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { githubLight } from '@uiw/codemirror-theme-github';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import debounce from 'lodash/debounce';
import { Info, Loader2 } from 'lucide-react';
import React, { FC, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { ResizableBox } from 'react-resizable';
import { format } from 'sql-formatter';

import { BROWSER_MENU_EDITOR_FORMAT } from '../../common/event';
import { useAppSelector } from '../hooks/redux';
import { Query } from '../reducers/queries';
import MenuHandler from '../utils/menu';

import CheckBox from './checkbox';
import QueryResults from './query-results';
import ServerDBClientInfoModal from './server-db-client-info-modal';
import { Button } from './ui/button';

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('./react-resizable.css');

const QUERY_EDITOR_HEIGHT = 200;

const CLIENT_DIALECT_MAP: Record<string, SQLDialect> = {
  mysql: MySQL,
  mariadb: MariaSQL,
  postgresql: PostgreSQL,
  sqlite: SQLite,
  sqlserver: MSSQL,
  cassandra: Cassandra,
};

const FORMAT_LANGUAGE_MAP: Record<string, string> = {
  cassandra: 'sql',
  sqlite: 'sql',
  sqlserver: 'tsql',
};

const INFOS = {
  mysql: [
    'MySQL treats commented query as a non select query. ' +
      'So you may see "affected rows" for a commented query.',
    'Usually executing a single query per tab will give better results.',
  ],
  sqlserver: [
    'MSSQL treats multiple non select queries as a single query result. ' +
      'So you affected rows will show the amount over all queries executed in the same tab.',
    'Usually executing a single query per tab will give better results.',
  ],
};

interface Props {
  client: string;
  editorName: string;
  allowCancel: boolean;
  query: Query;
  queryRef: RefObject<HTMLDivElement> | null;
  onExecQueryClick: (sqlQuery: string) => void;
  onCancelQueryClick: () => void;
  onCopyToClipboardClick: (rows, type: string, delimiter?: string) => void;
  onSaveToFileClick: (rows, type: string, delimiter?: string) => void;
  onSQLChange: (sqlQuery: string) => void;
  onSelectionChange: (sqlQuery: string, selectedQuery: string) => void;
}

const Query: FC<Props> = ({
  client,
  editorName,
  allowCancel,
  query,
  queryRef,
  onExecQueryClick,
  onCancelQueryClick,
  onCopyToClipboardClick,
  onSaveToFileClick,
  onSQLChange,
  onSelectionChange,
}) => {
  const {
    isCurrentQuery,
    enabledAutoComplete,
    enabledLiveAutoComplete,
    databases,
    schemas,
    tables,
    views,
    columnsByTable,
    triggersByTable,
    indexesByTable,
    functions,
    procedures,
  } = useAppSelector(
    (state) => ({
      isCurrentQuery: query.id === state.queries.currentQueryId,
      enabledAutoComplete: state.config.data?.enabledAutoComplete || false,
      enabledLiveAutoComplete: state.config.data?.enabledLiveAutoComplete || false,
      databases: state.databases.items,
      schemas: state.schemas.itemsByDatabase[query.database],
      tables: state.tables.itemsByDatabase[query.database],
      views: state.views.viewsByDatabase[query.database],
      columnsByTable: state.columns.columnsByTable[query.database],
      triggersByTable: state.triggers.triggersByTable[query.database],
      indexesByTable: state.indexes.indexesByTable[query.database],
      functions: state.routines.functionsByDatabase[query.database],
      procedures: state.routines.proceduresByDatabase[query.database],
    }),
    shallowEqual,
  );

  const menuHandler = useMemo(() => new MenuHandler(), []);

  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [wrapEnabled, setWrapEnabled] = useState(false);
  const [fontSize, setFontSize] = useState(12);
  const editorRef = useRef<ReactCodeMirrorRef>(null);

  // Refs for mutable values referenced inside stable extensions
  const currentQueryRef = useRef(query.query);
  currentQueryRef.current = query.query;
  const clientRef = useRef(client);
  clientRef.current = client;
  const onSQLChangeRef = useRef(onSQLChange);
  onSQLChangeRef.current = onSQLChange;
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;
  const onExecQueryClickRef = useRef(onExecQueryClick);
  onExecQueryClickRef.current = onExecQueryClick;

  const debouncedSelectionChange = useMemo(
    () => debounce((q: string, selected: string) => onSelectionChangeRef.current(q, selected), 100),
    [],
  );

  const formatQuery = useCallback(() => {
    const q = currentQueryRef.current;
    const c = clientRef.current;
    if (q) {
      onSQLChangeRef.current(format(q, { language: (FORMAT_LANGUAGE_MAP[c] ?? c) as any }));
    }
  }, []);

  // Stable extensions — created once at mount; mutable values accessed via refs
  const stableExtensions = useMemo(
    () => [
      sql({ dialect: CLIENT_DIALECT_MAP[client] ?? StandardSQL }),
      search({ top: true }),
      EditorView.updateListener.of((update) => {
        if (update.selectionSet && !update.docChanged) {
          const sel = update.state.selection.main;
          debouncedSelectionChange(
            currentQueryRef.current,
            update.state.sliceDoc(sel.from, sel.to),
          );
        }
      }),
      Prec.highest(
        keymap.of([
          {
            key: 'Mod-Enter',
            run: (view) => {
              const sel = view.state.selection.main;
              const selectedText = !sel.empty ? view.state.sliceDoc(sel.from, sel.to) : '';
              onExecQueryClickRef.current(selectedText || currentQueryRef.current);
              return true;
            },
          },
        ]),
      ),
      keymap.of([
        {
          key: 'Mod-=',
          run: () => {
            setFontSize((s) => s + 1);
            return true;
          },
        },
        {
          key: 'Mod-+',
          run: () => {
            setFontSize((s) => s + 1);
            return true;
          },
        },
        {
          key: 'Mod--',
          run: () => {
            setFontSize((s) => Math.max(s - 1, 1));
            return true;
          },
        },
        {
          key: 'Mod-_',
          run: () => {
            setFontSize((s) => Math.max(s - 1, 1));
            return true;
          },
        },
        {
          key: 'Mod-0',
          run: () => {
            setFontSize(12);
            return true;
          },
        },
        { key: 'Mod-l', run: selectLine },
        {
          key: 'Mod-i',
          run: () => {
            formatQuery();
            return true;
          },
        },
      ]),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const fontSizeTheme = useMemo(
    () =>
      EditorView.theme({
        '&': { fontSize: `${fontSize}px` },
        '&.cm-focused': { outline: 'none' },
      }),
    [fontSize],
  );

  const autocompleteExtension = useMemo(() => {
    if (!enabledAutoComplete) return [];

    const mapItems = (items: any, type: string) => {
      let result = items;
      if (!Array.isArray(items)) {
        result = Object.keys(items || {}).reduce<any[]>((all, name) => all.concat(items[name]), []);
      }
      return (result || []).map(({ name }: { name: string }) => ({ label: name, type }));
    };

    const options = [
      ...mapItems(databases, 'namespace'),
      ...mapItems(schemas, 'namespace'),
      ...mapItems(tables, 'class'),
      ...mapItems(columnsByTable, 'property'),
      ...mapItems(triggersByTable, 'keyword'),
      ...mapItems(indexesByTable, 'keyword'),
      ...mapItems(views, 'class'),
      ...mapItems(functions, 'function'),
      ...mapItems(procedures, 'function'),
    ];

    const dialect = CLIENT_DIALECT_MAP[client] ?? StandardSQL;

    return [
      autocompletion({
        override: [
          keywordCompletionSource(dialect, true),
          (context: CompletionContext) => {
            const word = context.matchBefore(/\w*/);
            if (!word || (word.from === word.to && !context.explicit)) return null;
            return { from: word.from, options };
          },
        ],
        activateOnTyping: enabledLiveAutoComplete,
      }),
    ];
  }, [
    enabledAutoComplete,
    enabledLiveAutoComplete,
    client,
    databases,
    schemas,
    tables,
    columnsByTable,
    triggersByTable,
    indexesByTable,
    views,
    functions,
    procedures,
  ]);

  const extensions = useMemo(
    () => [
      ...stableExtensions,
      fontSizeTheme,
      ...autocompleteExtension,
      ...(wrapEnabled ? [EditorView.lineWrapping] : []),
    ],
    [stableExtensions, fontSizeTheme, autocompleteExtension, wrapEnabled],
  );

  const onCreateEditor = useCallback(
    (view: EditorView) => {
      view.focus();
      menuHandler.setMenus({ [BROWSER_MENU_EDITOR_FORMAT]: formatQuery });
    },
    [menuHandler, formatQuery],
  );

  useEffect(
    () => () => {
      menuHandler.dispose();
    },
    [menuHandler],
  );

  useEffect(() => {
    if (isCurrentQuery) {
      editorRef.current?.view?.focus();
    }
  }, [isCurrentQuery]);

  const handleExecQueryClick = useCallback(() => {
    const view = editorRef.current?.view;
    const sel = view?.state.selection.main;
    const selectedText = sel && !sel.empty ? view!.state.sliceDoc(sel.from, sel.to) : '';
    onExecQueryClick(selectedText || query.query);
  }, [onExecQueryClick, query.query]);

  const onDiscQueryClick = useCallback(() => onSQLChange(''), [onSQLChange]);

  const handleCancelQueryClick = useCallback(() => onCancelQueryClick(), [onCancelQueryClick]);

  const onShowInfoClick = useCallback(() => setInfoModalVisible(true), []);

  const onQueryBoxResize = useCallback(() => {
    editorRef.current?.view?.requestMeasure();
  }, []);

  const onWrapContentsChecked = useCallback(() => setWrapEnabled(true), []);
  const onWrapContentsUnchecked = useCallback(() => setWrapEnabled(false), []);
  const onFocus = useCallback(() => {
    editorRef.current?.view?.focus();
  }, []);

  const infos = INFOS[client];

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0">
        <ResizableBox
          className="react-resizable react-resizable-se-resize rounded-md border border-slate-200 bg-white p-2"
          height={QUERY_EDITOR_HEIGHT}
          width={500}
          onResizeStop={onQueryBoxResize}
        >
          <div className="flex h-full flex-col">
            <div ref={queryRef} tabIndex={-1} onFocus={onFocus} />
            <div id={editorName} className="min-h-0 flex-1">
              <CodeMirror
                ref={editorRef}
                value={query.query}
                theme={githubLight}
                extensions={extensions}
                height="100%"
                width="100%"
                style={{ height: '100%' }}
                basicSetup={{ autocompletion: false }}
                onChange={(value) => onSQLChangeRef.current(value)}
                onCreateEditor={onCreateEditor}
              />
            </div>
            <div className="flex justify-end">
              <div className="pr-2">
                <CheckBox
                  name="wrapQueryContents"
                  label="Wrap Contents"
                  checked={wrapEnabled}
                  onChecked={onWrapContentsChecked}
                  onUnchecked={onWrapContentsUnchecked}
                />
              </div>
            </div>
          </div>
        </ResizableBox>
        <div className="flex items-center justify-between py-1">
          <div>
            {infos && (
              <Button
                variant="outline"
                size="sm"
                title="Query Information"
                onClick={onShowInfoClick}
              >
                <Info className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center">
            <Button
              variant="positive"
              size="sm"
              className="w-28 pr-5 [-webkit-mask-image:radial-gradient(circle_18px_at_right_center,transparent_99%,#000_100%)] [mask-image:radial-gradient(circle_18px_at_right_center,transparent_99%,#000_100%)]"
              disabled={query.isExecuting}
              onClick={handleExecQueryClick}
            >
              {query.isExecuting && <Loader2 className="h-4 w-4 animate-spin" />}
              Execute
            </Button>
            <div className="relative z-10 -mx-[18px] flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-xs text-slate-400">
              or
            </div>
            {query.isExecuting && allowCancel ? (
              <Button
                variant="destructive"
                size="sm"
                className="w-24 pl-5 [-webkit-mask-image:radial-gradient(circle_18px_at_left_center,transparent_99%,#000_100%)] [mask-image:radial-gradient(circle_18px_at_left_center,transparent_99%,#000_100%)]"
                disabled={query.isCanceling}
                onClick={handleCancelQueryClick}
              >
                {query.isCanceling && <Loader2 className="h-4 w-4 animate-spin" />}
                Cancel
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-24 pl-5 [-webkit-mask-image:radial-gradient(circle_18px_at_left_center,transparent_99%,#000_100%)] [mask-image:radial-gradient(circle_18px_at_left_center,transparent_99%,#000_100%)]"
                onClick={onDiscQueryClick}
              >
                Discard
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <QueryResults
          onSaveToFileClick={onSaveToFileClick}
          onCopyToClipboardClick={onCopyToClipboardClick}
          copied={query.copied}
          saved={query.saved}
          query={query.queryHistory[query.queryHistory.length - 1]}
          results={query.results}
          isExecuting={query.isExecuting}
          error={query.error}
          executionStartTime={query.executionStartTime}
          executionTime={query.executionTime}
        />
      </div>
      {infoModalVisible && (
        <ServerDBClientInfoModal
          infos={infos}
          client={client}
          onCloseClick={() => setInfoModalVisible(false)}
        />
      )}
    </div>
  );
};

Query.displayName = 'Query';
export default Query;
