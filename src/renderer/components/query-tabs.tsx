import React, { FC, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { TabPanel, Tabs } from 'react-tabs';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

import Query from './query';
import TabList from './tab-list';
import { Button } from './ui/button';

import * as QueryActions from '../actions/queries';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import QueryTab from './query-tab';
import { DB_CLIENTS } from '../api';

interface Props {
  sideBarWidth: number;
  queryRefs: Record<number, RefObject<HTMLDivElement>>;
}

const QueryTabs: FC<Props> = ({ sideBarWidth, queryRefs }) => {
  const dispatch = useAppDispatch();
  const { connections, queries } = useAppSelector((state) => state);

  const [tabNavPosition, setTabNavPosition] = useState(0);

  const tabListRef = useRef<HTMLUListElement | null>(null);

  const currentQuery = queries.currentQueryId ? queries.queriesById[queries.currentQueryId] : null;

  const handleExecuteQuery = useCallback(
    (sqlQuery: string) => {
      if (!currentQuery) {
        return;
      }

      dispatch(QueryActions.executeQueryIfNeeded(sqlQuery, currentQuery.id));
    },
    [dispatch, currentQuery],
  );

  const handleCancelQuery = useCallback(() => {
    if (!currentQuery) {
      return;
    }

    dispatch(QueryActions.cancelQuery(currentQuery.id));
  }, [currentQuery, dispatch]);

  const copyToClipboard = useCallback(
    (rows, type: string, delimiter?: string) => {
      dispatch(QueryActions.copyToClipboard(rows, type, delimiter));
    },
    [dispatch],
  );

  const saveToFile = useCallback(
    (rows, type: string, delimiter?: string) => {
      dispatch(QueryActions.saveToFile(rows, type, delimiter));
    },
    [dispatch],
  );

  const onSQLChange = useCallback(
    (sqlQuery: string) => {
      dispatch(QueryActions.updateQueryIfNeeded(sqlQuery));
    },
    [dispatch],
  );

  const onQuerySelectionChange = useCallback(
    (sqlQuery: string, selectedQuery: string) => {
      dispatch(QueryActions.updateQueryIfNeeded(sqlQuery, selectedQuery));
    },
    [dispatch],
  );

  const handleSelectTab = useCallback(
    (index: number) => {
      const queryId = queries.queryIds[index];
      dispatch(QueryActions.selectQuery(queryId));
    },
    [dispatch, queries],
  );

  const newTab = useCallback(() => {
    if (currentQuery) {
      dispatch(QueryActions.newQuery(currentQuery.database));
    }
  }, [dispatch, currentQuery]);

  const [tabListTotalWidth, setTabListTotalWidth] = useState(0);
  const [tabListTotalWidthChildren, setTabListTotalWidthChildren] = useState(0);

  useEffect(() => {
    if (!tabListRef.current) {
      return;
    }
    setTabListTotalWidth(tabListRef.current.offsetWidth);
  }, [tabListRef]);

  useEffect(() => {
    if (!tabListRef.current || !queries.queryIds.length) {
      return;
    }
    let acc = 0;
    for (const child of Array.from(tabListRef.current.children) as HTMLElement[]) {
      acc += child.offsetWidth;
    }
    setTabListTotalWidthChildren(acc);
  }, [tabListRef, queries.queryIds]);

  const isOnMaxPosition = tabListTotalWidthChildren - Math.abs(tabNavPosition) <= tabListTotalWidth;
  const selectedIndex = queries.currentQueryId
    ? queries.queryIds.indexOf(queries.currentQueryId)
    : 0;
  const isTabsFitOnScreen = tabListTotalWidthChildren >= tabListTotalWidth;

  const tabs = queries.queryIds.map((queryId) => (
    <QueryTab
      key={queryId}
      queryId={queryId}
      tabNavPosition={tabNavPosition}
      setTabNavPosition={setTabNavPosition}
    />
  ));

  if (connections.server === null) {
    return null;
  }

  const server = connections.server;
  const client = DB_CLIENTS.find((dbClient) => dbClient.key === server.client);
  if (!client) {
    throw new Error('Unknown client');
  }

  const { disabledFeatures } = client;

  const allowCancel = !disabledFeatures || !disabledFeatures.includes('cancelQuery');

  const panels = queries.queryIds.map((queryId) => {
    const query = queries.queriesById[queryId];

    return (
      <TabPanel key={queryId} className="react-tabs__tab-panel">
        <Query
          editorName={`querybox${queryId}`}
          client={server.client}
          allowCancel={allowCancel}
          query={query}
          queryRef={queryRefs[queryId]}
          widthOffset={sideBarWidth}
          onExecQueryClick={handleExecuteQuery}
          onCancelQueryClick={handleCancelQuery}
          onCopyToClipboardClick={copyToClipboard}
          onSaveToFileClick={saveToFile}
          onSQLChange={onSQLChange}
          onSelectionChange={onQuerySelectionChange}
        />
      </TabPanel>
    );
  });

  return (
    <Tabs
      className="react-tabs"
      onSelect={handleSelectTab}
      selectedIndex={selectedIndex}
      forceRenderTabPanel>
      <div className="flex items-center border-b border-slate-200">
        {isTabsFitOnScreen && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 shrink-0 rounded-none border-y-0 border-l-0 px-2"
            disabled={tabNavPosition === 0}
            onClick={() => {
              const position = tabNavPosition + 100;
              setTabNavPosition(position > 0 ? 0 : position);
            }}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="relative flex-1 overflow-hidden">
          <TabList
            ref={tabListRef}
            className="react-tabs__tab-list flex"
            style={{ left: `${tabNavPosition}px`, transition: 'left 0.2s linear' }}>
            {tabs}
          </TabList>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 shrink-0 rounded-none border-y-0 border-r-0 px-2"
          onClick={() => newTab()}>
          <Plus className="h-4 w-4" />
        </Button>
        {isTabsFitOnScreen && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 shrink-0 rounded-none border-y-0 border-r-0 px-2"
            disabled={tabListTotalWidthChildren < tabListTotalWidth || isOnMaxPosition}
            onClick={() => {
              setTabNavPosition(tabNavPosition - 100);
            }}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
      {panels}
    </Tabs>
  );
};

QueryTabs.displayName = 'QueryTabs';

export default QueryTabs;
