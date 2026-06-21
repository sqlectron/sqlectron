import { AnyAction, combineReducers } from 'redux';
import { ThunkAction } from 'redux-thunk';

import columns, { ColumnState } from './columns';
import config, { ConfigState } from './config';
import connections, { ConnectionState } from './connections';
import databases, { DatabaseState } from './databases';
import indexes, { IndexState } from './indexes';
import queries, { QueryState } from './queries';
import routines, { RoutineState } from './routines';
import schemas, { SchemaState } from './schemas';
import servers, { ServerState } from './servers';
import sqlscripts, { ScriptState } from './sqlscripts';
import status from './status';
import tables, { TableState } from './tables';
import triggers, { TriggerState } from './triggers';
import views, { ViewState } from './views';

export type ThunkResult<R> = ThunkAction<R, ApplicationState, undefined, AnyAction>;

// The top-level state object
export interface ApplicationState {
  config: ConfigState;
  databases: DatabaseState;
  servers: ServerState;
  queries: QueryState;
  connections: ConnectionState;
  schemas: SchemaState;
  tables: TableState;
  status: string;
  views: ViewState;
  routines: RoutineState;
  columns: ColumnState;
  triggers: TriggerState;
  indexes: IndexState;
  sqlscripts: ScriptState;
}

const rootReducer = combineReducers({
  config,
  databases,
  servers,
  queries,
  connections,
  schemas,
  tables,
  status,
  views,
  routines,
  columns,
  triggers,
  indexes,
  sqlscripts,
});

export default rootReducer;
