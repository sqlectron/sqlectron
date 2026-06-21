import { groupBy } from 'lodash';
import React, { FC, ReactElement } from 'react';

import Message from './message';
import QueryResultTable from './query-result-table';

interface Props {
  fields: any[];
  rows: any[];
  rowCount: number | undefined;
  affectedRows: number | undefined;
  queryIndex: number;
  totalQueries: number;
  command: string;
  onCopyToClipboardClick: (rows, type: string, delimiter?: string) => void;
  onSaveToFileClick: (rows, type: string, delimiter?: string) => void;
  copied: boolean | null;
  saved: boolean | null;
  executionTime: number | null;
}

const QueryResult: FC<Props> = ({
  fields,
  rows,
  rowCount,
  affectedRows,
  queryIndex,
  totalQueries,
  command,
  onCopyToClipboardClick,
  onSaveToFileClick,
  copied,
  saved,
  executionTime,
}) => {
  const isSelect = command === 'SELECT';
  const isExplain = command === 'EXPLAIN';
  const isUnknown = command === 'UNKNOWN';
  const msgTime = executionTime != null ? ` Took ${(executionTime / 1000).toFixed(3)}s.` : '';
  if (!isSelect && !isExplain && !isUnknown) {
    const msgAffectedRows = affectedRows ? `Affected rows: ${affectedRows}.` : '';
    return (
      <Message
        key={`msgAffectedRows-${queryIndex}`}
        message={`Query executed successfully. ${msgAffectedRows}${msgTime}`}
        type="success"
      />
    );
  }

  if (isExplain) {
    const title = fields[0].name;
    return (
      <Message
        key={`explain-${queryIndex}`}
        preformatted
        title={title}
        message={rows.map((row) => row[title]).join('\n')}
      />
    );
  }

  if (fields.length === 0) {
    return (
      <Message
        key={`genericResult-${queryIndex}`}
        message={`Query executed successfully.${msgTime}`}
        type="success"
      />
    );
  }

  let msgDuplicatedColumns: null | ReactElement = null;
  const groupFields = groupBy(fields, (field) => field.name);
  const duplicatedColumns = Object.keys(groupFields).filter(
    (field) => groupFields[field].length > 1,
  );
  if (duplicatedColumns.length) {
    msgDuplicatedColumns = (
      <Message
        key={`msgDuplicatedColumns-${queryIndex}`}
        type="info"
        message={
          `Duplicated columns: ${duplicatedColumns.join(', ')}. ` +
          'It may cause the result in the second column overwriting the first one. ' +
          'Use an alias to avoid it.'
        }
      />
    );
  }

  const tableResult = (
    <QueryResultTable
      key={queryIndex}
      copied={copied}
      saved={saved}
      fields={fields}
      rows={rows}
      rowCount={rowCount}
      onSaveToFileClick={onSaveToFileClick}
      onCopyToClipboardClick={onCopyToClipboardClick}
      executionTime={executionTime}
    />
  );

  if (totalQueries === 1) {
    return (
      <div key={queryIndex} className="flex h-full flex-col">
        {msgDuplicatedColumns && <div className="shrink-0">{msgDuplicatedColumns}</div>}
        <div className="min-h-0 flex-1">{tableResult}</div>
      </div>
    );
  }

  return (
    <div key={queryIndex} className="relative mt-3 rounded-md border border-slate-200 p-4 pt-6">
      <div className="absolute -top-3 left-3 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold">
        Query {queryIndex + 1}
      </div>
      {msgDuplicatedColumns}
      {tableResult}
    </div>
  );
};

QueryResult.displayName = 'QueryResult';
export default QueryResult;
