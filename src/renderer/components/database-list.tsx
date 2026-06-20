import React, { FC, RefObject } from 'react';

import { DbTable } from '../../common/types/database';
import { Database } from '../reducers/databases';
import type { ActionType, ObjectType } from '../reducers/sqlscripts';

import DatabaseListItem from './database-list-item';

interface Props {
  client: string;
  databases: Database[];
  databaseRefs: Record<string, RefObject<HTMLDivElement>>;
  currentDB: string | null;
  isFetching: boolean;
  onSelectDatabase: (database: Database) => void;
  onExecuteDefaultQuery: (database: Database, table: DbTable) => void;
  onSelectTable: (database: Database, table: DbTable) => void;
  onGetSQLScript: (
    database: Database,
    item: { name: string; schema?: string },
    actionType: ActionType,
    objectType: ObjectType,
  ) => void;
  onRefreshDatabase: (database: Database) => void;
  onOpenTab: (database: Database) => void;
}

const DatabaseList: FC<Props> = ({
  client,
  databases,
  databaseRefs,
  currentDB,
  isFetching,
  onSelectDatabase,
  onExecuteDefaultQuery,
  onSelectTable,
  onGetSQLScript,
  onRefreshDatabase,
  onOpenTab,
}) => {
  if (isFetching) {
    return <div className="px-2 py-1 text-xs text-slate-400">Loading...</div>;
  }

  if (!databases.length) {
    return <div className="px-2 py-1 text-xs text-slate-400">No results found</div>;
  }

  return (
    <div className="flex flex-col">
      {databases.map((database) => (
        <DatabaseListItem
          databaseRef={databaseRefs[database.name]}
          key={database.name}
          currentDB={currentDB}
          client={client}
          database={database}
          onExecuteDefaultQuery={onExecuteDefaultQuery}
          onSelectTable={onSelectTable}
          onSelectDatabase={onSelectDatabase}
          onGetSQLScript={onGetSQLScript}
          onRefreshDatabase={onRefreshDatabase}
          onOpenTab={onOpenTab}
        />
      ))}
    </div>
  );
};

DatabaseList.displayName = 'DatabaseList';
export default DatabaseList;
