import { debounce } from 'lodash';
import React, { FC, useCallback, useState } from 'react';
import { Tab } from 'react-tabs';
import { X } from 'lucide-react';

import * as QueryActions from '../actions/queries';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { cn } from '../lib/utils';
import { Input } from './ui/input';

interface Props {
  queryId: number;
  tabNavPosition: number;
  setTabNavPosition: (position: number) => void;
}

const QueryTab: FC<Props> = ({ queryId, tabNavPosition, setTabNavPosition }) => {
  const dispatch = useAppDispatch();
  const queries = useAppSelector((state) => state.queries);

  const [isRenaming, setIsRenaming] = useState(false);
  const [tabValue, setTabValue] = useState('');

  const removeQuery = useCallback(
    (queryId: number) => {
      dispatch(QueryActions.removeQuery(queryId));
    },
    [dispatch],
  );

  const isCurrentQuery = queryId === queries.currentQueryId;
  const buildContent = () => {
    if (isRenaming) {
      return (
        <Input
          autoFocus
          type="text"
          value={tabValue}
          onChange={(event) => setTabValue(event.target.value)}
          onBlur={() => {
            dispatch(QueryActions.renameQuery(tabValue));
            setIsRenaming(false);
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Escape' && event.key !== 'Enter') {
              return;
            }

            if (event.key === 'Enter') {
              dispatch(QueryActions.renameQuery(tabValue));
            }

            setIsRenaming(false);
          }}
          className="h-6 w-32 px-1.5 py-0 text-xs"
        />
      );
    }

    return (
      <>
        <span className="truncate">{queries.queriesById[queryId].name}</span>
        <button
          type="button"
          className={cn(
            'rounded p-0.5 text-slate-400 transition-opacity hover:bg-slate-200 hover:text-slate-700',
            isCurrentQuery ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
          onClick={debounce(() => {
            removeQuery(queryId);
            const position = tabNavPosition + 200;
            setTabNavPosition(position > 0 ? 0 : position);
          }, 200)}>
          <X className="h-3 w-3" />
        </button>
      </>
    );
  };

  return (
    <Tab
      key={queryId}
      onDoubleClick={() => {
        setIsRenaming(true);
        setTabValue(queries.queriesById[queryId].name);
      }}
      className={cn(
        'group flex shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-3 py-1.5 text-sm',
        isCurrentQuery
          ? 'border-slate-900 bg-white font-medium text-slate-900'
          : 'border-transparent text-slate-500 hover:bg-slate-100',
      )}>
      {buildContent()}
    </Tab>
  );
};

QueryTab.displayName = 'QueryTab';

// Required to set `tabsRole` on the component so its understood properly by react-tabs
// @ts-ignore
QueryTab.tabsRole = 'Tab';

export default QueryTab;
