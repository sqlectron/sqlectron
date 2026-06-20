import React, { FC } from 'react';

import Loader from './loader';
import Message from './message';
import QueryResult from './query-result';

interface Props {
  widthOffset: number;
  heightOffset: number;
  onCopyToClipboardClick: (rows, type: string, delimiter?: string) => void;
  onSaveToFileClick: (rows, type: string, delimiter?: string) => void;
  copied: boolean | null;
  saved: boolean | null;
  query: string | undefined;
  results:
    | {
        command: string;
        fields: any[];
        rows: any[];
        rowCount: number | undefined;
        affectedRows: number | undefined;
      }[]
    | null;
  isExecuting: boolean;
  error: Error | null;
}

const QueryResults: FC<Props> = ({
  widthOffset,
  heightOffset,
  onCopyToClipboardClick,
  onSaveToFileClick,
  copied,
  saved,
  results,
  isExecuting,
  error,
}) => {
  if (error) {
    if (error.message) {
      const errorBody = Object.keys(error)
        .filter((key) => error[key] && key !== 'message')
        .map((key) => `${key}: ${error[key]}`)
        .join('\n');

      return <Message preformatted type="negative" title={error.message} message={errorBody} />;
    }
    return <pre>{JSON.stringify(error, null, 2)}</pre>;
  }

  if (isExecuting) {
    return (
      <div className="relative min-h-[250px]">
        <Loader message="Loading" type="active" inverted />
      </div>
    );
  }

  if (!results) {
    return null;
  }

  const totalQueries = results.length;
  return (
    <div id="query-result">
      {results.map((result, idx) => (
        <QueryResult
          {...result}
          totalQueries={totalQueries}
          queryIndex={idx}
          isMultipleResults={results.length > 1}
          key={idx}
          widthOffset={widthOffset}
          heightOffset={heightOffset}
          copied={copied}
          saved={saved}
          onSaveToFileClick={onSaveToFileClick}
          onCopyToClipboardClick={onCopyToClipboardClick}
        />
      ))}
    </div>
  );
};

QueryResults.displayName = 'QueryResult';
export default QueryResults;
