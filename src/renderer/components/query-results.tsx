import React, { FC, useEffect, useState } from 'react';

import Loader from './loader';
import Message from './message';
import QueryResult from './query-result';

interface Props {
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
  executionStartTime: number | null;
  executionTime: number | null;
}

const QueryResults: FC<Props> = ({
  onCopyToClipboardClick,
  onSaveToFileClick,
  copied,
  saved,
  results,
  isExecuting,
  error,
  executionStartTime,
  executionTime,
}) => {
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    if (!isExecuting || executionStartTime == null) {
      return;
    }
    const interval = setInterval(() => {
      setElapsed(Date.now() - executionStartTime);
    }, 100);
    return () => clearInterval(interval);
  }, [isExecuting, executionStartTime]);

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
        <Loader message={`Loading (${(elapsed / 1000).toFixed(1)}s)`} type="active" inverted />
      </div>
    );
  }

  if (!results) {
    return null;
  }

  const totalQueries = results.length;
  return (
    <div id="query-result" className={totalQueries === 1 ? 'h-full' : undefined}>
      {results.map((result, idx) => (
        <QueryResult
          {...result}
          totalQueries={totalQueries}
          queryIndex={idx}
          key={idx}
          copied={copied}
          saved={saved}
          onSaveToFileClick={onSaveToFileClick}
          onCopyToClipboardClick={onCopyToClipboardClick}
          executionTime={idx === 0 ? executionTime : null}
        />
      ))}
    </div>
  );
};

QueryResults.displayName = 'QueryResult';
export default QueryResults;
