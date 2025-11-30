import React, { FC, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import debounce from 'lodash/debounce';
import { format } from 'sql-formatter';
import AceEditor, { ICommand } from 'react-ace';
import ace from 'ace-builds';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/ext-searchbox';
import { ResizableBox } from 'react-resizable';
import CheckBox from './checkbox';
import QueryResults from './query-results';
import ServerDBClientInfoModal from './server-db-client-info-modal';
import { BROWSER_MENU_EDITOR_FORMAT } from '../../common/event';
import MenuHandler from '../utils/menu';
import { Query } from '../reducers/queries';
import { useAppSelector } from '../hooks/redux';

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('./react-resizable.css');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('./override-ace.css');

const QUERY_EDITOR_HEIGTH = 200;
const langTools = ace.require('ace/ext/language_tools');

const INFOS = {
  mysql: [
    'MySQL treats commented query as a non select query.' +
      'So you may see "affected rows" for a commented query.',
    'Usually executing a single query per tab will give better results.',
  ],
  sqlserver: [
    'MSSQL treats multiple non select queries as a single query result.' +
      'So you affected rows will show the amount over all queries executed in the same tab.',
    'Usually executing a single query per tab will give better results.',
  ],
};

const EVENT_KEYS = {
  onSelectionChange: 'changeSelection',
};

interface Props {
  widthOffset: number;
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
  widthOffset,
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
  } = useAppSelector((state) => ({
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
  }));

  const menuHandler = useMemo(() => new MenuHandler(), []);

  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [wrapEnabled, setWrapEnabled] = useState(false);
  const editorRef = useRef<AceEditor>(null);

  const handleSelectionChange = useCallback(() => {
    if (editorRef.current) {
      const elem = editorRef.current;
      debounce(() => onSelectionChange(query.query, elem.editor.getCopyText()), 100);
    }
  }, [onSelectionChange, query.query, editorRef]);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    const editor = editorRef.current.editor;

    // @ts-ignore
    editor.on(EVENT_KEYS.onSelectionChange, handleSelectionChange);

    // init with the auto complete disabled
    editor.completers = [];
    // @ts-ignore
    editor.setOption('enableBasicAutocompletion', false);

    editor.focus();

    menuHandler.setMenus({
      [BROWSER_MENU_EDITOR_FORMAT]: () => editor.execCommand('format'),
    });
  }, [editorRef, handleSelectionChange, menuHandler]);

  useEffect(() => {
    if (!enabledAutoComplete || !editorRef.current) {
      return;
    }

    const mapCompletionTypes = (items, type: string) => {
      let result = items;
      if (!Array.isArray(items)) {
        result = Object.keys(items || {}).reduce((all, name) => all.concat(items[name]), []);
      }

      return (result || []).map(({ name }) => ({ name, type }));
    };

    const completions = [
      ...mapCompletionTypes(databases, 'database'),
      ...mapCompletionTypes(schemas, 'schema'),
      ...mapCompletionTypes(tables, 'table'),
      ...mapCompletionTypes(columnsByTable, 'column'),
      ...mapCompletionTypes(triggersByTable, 'trigger'),
      ...mapCompletionTypes(indexesByTable, 'index'),
      ...mapCompletionTypes(views, 'view'),
      ...mapCompletionTypes(functions, 'function'),
      ...mapCompletionTypes(procedures, 'procedure'),
    ].map(({ name, type }) => ({
      name,
      value: name,
      score: 1,
      meta: type,
    }));

    const customCompleter = {
      getCompletions(editor, session, pos, prefix, callback) {
        callback(null, completions);
      },
    };

    // force load only the current available completers
    // discarding any previous existing completers
    editorRef.current.editor.completers = [
      langTools.snippetCompleter,
      langTools.textCompleter,
      langTools.keyWordCompleter,
      customCompleter,
    ];

    // @ts-ignore
    editorRef.current.editor.setOption('enableBasicAutocompletion', true);

    // @ts-ignore
    editorRef.current.editor.setOption('enableLiveAutocompletion', enabledLiveAutoComplete);
  }, [
    columnsByTable,
    databases,
    enabledAutoComplete,
    enabledLiveAutoComplete,
    functions,
    indexesByTable,
    procedures,
    schemas,
    tables,
    triggersByTable,
    views,
  ]);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }
    const elem = editorRef.current;
    return () => {
      elem.editor.removeListener(EVENT_KEYS.onSelectionChange, handleSelectionChange);
    };
  }, [editorRef, handleSelectionChange]);

  useEffect(() => {
    return () => {
      menuHandler.dispose();
    };
  }, [menuHandler]);

  useEffect(() => {
    if (query.isExecuting && query.isDefaultSelect) {
      window.scrollTo(0, 0);
    }
  }, [query]);

  useEffect(() => {
    if (isCurrentQuery) {
      editorRef.current?.editor.focus();
    }
  }, [isCurrentQuery]);

  const handleExecQueryClick = useCallback(() => {
    const sqlQuery = editorRef.current?.editor.getCopyText() || query.query;
    onExecQueryClick(sqlQuery);
  }, [onExecQueryClick, query.query, editorRef]);

  const onDiscQueryClick = useCallback(() => {
    onSQLChange('');
  }, [onSQLChange]);

  const handleCancelQueryClick = useCallback(() => {
    onCancelQueryClick();
  }, [onCancelQueryClick]);

  const onShowInfoClick = useCallback(() => {
    setInfoModalVisible(true);
  }, []);

  const onQueryBoxResize = useCallback(() => {
    editorRef.current?.editor.resize();
  }, [editorRef]);

  const onWrapContentsChecked = useCallback(() => {
    setWrapEnabled(true);
  }, []);

  const onWrapContentsUnchecked = useCallback(() => {
    setWrapEnabled(false);
  }, []);

  const onFocus = useCallback(() => {
    editorRef.current?.editor.focus();
  }, []);

  const commands = useMemo(() => {
    return [
      {
        name: 'increaseFontSize',
        bindKey: 'Ctrl-=|Ctrl-+',
        exec(editor) {
          const size = parseInt(editor.getFontSize(), 10) || 12;
          // @ts-ignore
          editor.setFontSize(size + 1);
        },
      },
      {
        name: 'decreaseFontSize',
        bindKey: 'Ctrl+-|Ctrl-_',
        exec(editor) {
          const size = parseInt(editor.getFontSize(), 10) || 12;
          // @ts-ignore
          editor.setFontSize(Math.max(size - 1 || 1));
        },
      },
      {
        name: 'resetFontSize',
        bindKey: 'Ctrl+0|Ctrl-Numpad0',
        exec(editor) {
          // @ts-ignore
          editor.setFontSize(12);
        },
      },
      {
        name: 'selectCurrentLine',
        bindKey: { win: 'Ctrl-L', mac: 'Command-L' },
        exec(editor) {
          const { row } = editor.selection.getCursor();
          const endColumn = editor.session.getLine(row).length;
          editor.selection.setSelectionRange({
            start: { column: 0, row },
            end: { column: endColumn, row },
          });
        },
      },
      {
        name: 'format',
        bindKey: { win: 'Ctrl-I', mac: 'Command-I' },
        exec: (editor) => {
          if (query.query) {
            editor.setValue(
              format(query.query, {
                // @ts-ignore
                language: ['cassandra', 'sqlite'].includes(client)
                  ? 'sql'
                  : client === 'sqlserver'
                  ? 'tsql'
                  : client,
              }),
            );
          }
        },
      },
    ] as ICommand[];
  }, [client, query.query]);

  const infos = INFOS[client];

  return (
    <div>
      <div>
        <ResizableBox
          className="react-resizable react-resizable-se-resize ui segment"
          height={QUERY_EDITOR_HEIGTH}
          width={500}
          onResizeStop={onQueryBoxResize}>
          <>
            <div ref={queryRef} tabIndex={-1} onFocus={onFocus}></div>
            <AceEditor
              mode="sql"
              theme="github"
              name={editorName}
              height="calc(100% - 15px)"
              width="100%"
              ref={editorRef}
              value={query.query}
              wrapEnabled={wrapEnabled}
              showPrintMargin={false}
              commands={commands}
              editorProps={{ $blockScrolling: Infinity }}
              onChange={debounce(onSQLChange, 50)}
              enableBasicAutocompletion
              enableLiveAutocompletion
            />
            <div className="ui secondary menu" style={{ marginTop: 0 }}>
              <div className="right menu">
                <CheckBox
                  name="wrapQueryContents"
                  label="Wrap Contents"
                  checked={wrapEnabled}
                  onChecked={onWrapContentsChecked}
                  onUnchecked={onWrapContentsUnchecked}
                />
              </div>
            </div>
          </>
        </ResizableBox>
        <div className="ui secondary menu" style={{ marginTop: 0 }}>
          {infos && (
            <div className="item">
              <span>
                <button
                  className="ui icon button small"
                  title="Query Information"
                  onClick={onShowInfoClick}>
                  <i className="icon info" />
                </button>
              </span>
            </div>
          )}
          <div className="right menu">
            <div className="item">
              <div className="ui buttons">
                <button
                  className={`ui positive button ${query.isExecuting ? 'loading' : ''}`}
                  onClick={handleExecQueryClick}>
                  Execute
                </button>
                <div className="or" />
                {query.isExecuting && allowCancel ? (
                  <button
                    className={`ui negative button ${query.isCanceling ? 'loading' : ''}`}
                    onClick={handleCancelQueryClick}>
                    Cancel
                  </button>
                ) : (
                  <button className="ui button" onClick={onDiscQueryClick}>
                    Discard
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <QueryResults
        widthOffset={widthOffset}
        heightOffset={QUERY_EDITOR_HEIGTH}
        onSaveToFileClick={onSaveToFileClick}
        onCopyToClipboardClick={onCopyToClipboardClick}
        copied={query.copied}
        saved={query.saved}
        query={query.queryHistory[query.queryHistory.length - 1]}
        results={query.results}
        isExecuting={query.isExecuting}
        error={query.error}
      />
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
