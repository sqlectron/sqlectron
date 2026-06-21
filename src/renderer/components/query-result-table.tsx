import scrollbarSize from 'dom-helpers/scrollbarSize';
import { Copy, Save, Table as TableIcon } from 'lucide-react';
import React, { FC, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { AutoSizer, Grid, ScrollSync } from 'react-virtualized';

import { valueToString } from '../../common/utils/convert';
import { useAppSelector } from '../hooks/redux';

import PreviewModal from './preview-modal';
import QueryResultTableCell from './query-result-table-cell';
import './query-result-table.scss';

// TODO: remove this shim
function createCellRenderer(cellRenderer) {
  return function cellRendererWrapper({ key, style, ...rest }) {
    return (
      <div className="ReactVirtualized__Grid__cell" key={key} style={style}>
        {cellRenderer(rest)}
      </div>
    );
  };
}

let canvas: HTMLCanvasElement | null = null;
const getTextWidth = (text: string, font: string) => {
  const padding = 28;
  if (!canvas) {
    canvas = document.createElement('canvas');
  }
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not get canvas context');
  }
  context.font = font;
  return context.measureText(text).width + padding;
};

/**
 * Resolve the cell width based in the header name and the top 30 rows data.
 * It gives a better UX since the column adapts better to the table width.
 */
const resolveCellWidth = (fieldName: string, rows: any[], fontName?: string) => {
  const font = `14px '${fontName || 'Lato'}', 'Helvetica Neue', Arial, Helvetica, sans-serif`;
  const numRowsToFindAverage = rows.length > 30 ? 30 : rows.length;
  const maxWidth = 220;
  const headerWidth = getTextWidth(fieldName, `bold ${font}`);
  let averageRowsCellWidth = 0;
  if (rows.length) {
    averageRowsCellWidth =
      rows
        .slice(0, numRowsToFindAverage)
        .map((row) => {
          const value = valueToString(row[fieldName]);
          return getTextWidth(value, font);
        })
        .reduce((prev, curr) => prev + curr, 0) / numRowsToFindAverage;
  }

  if (headerWidth > averageRowsCellWidth) {
    return headerWidth > maxWidth ? maxWidth : headerWidth;
  }

  return averageRowsCellWidth > maxWidth ? maxWidth : averageRowsCellWidth;
};

const DraggableHandle = ({
  columnIndex,
  field,
  handleStop,
}: {
  columnIndex: number;
  field: any;
  handleStop: any;
}) => {
  const nodeRef = useRef(null);
  return (
    <Draggable
      axis="x"
      nodeRef={nodeRef}
      onStop={(e, data) => handleStop({ name: field.name, index: columnIndex }, e, data)}
      position={{ x: 0, y: 0 }}
    >
      <div className="draggable-handle" ref={nodeRef} />
    </Draggable>
  );
};

interface Props {
  onCopyToClipboardClick: (rows, type: string, delimiter?: string) => void;
  onSaveToFileClick: (rows, type: string, delimiter?: string) => void;
  copied: boolean | null;
  saved: boolean | null;
  fields: any[];
  rows: any[];
  rowCount: number | undefined;
  executionTime: number | null;
}

const GRID_HEADER_HEIGHT = 30;
const ROW_HEIGHT = 28;
const SCROLLBAR_HEIGHT = 15;

const QueryResultTable: FC<Props> = ({
  onCopyToClipboardClick,
  onSaveToFileClick,
  copied,
  saved,
  fields,
  rows,
  rowCount,
  executionTime,
}) => {
  const config = useAppSelector((state) => state.config);
  const [containerWidth, setContainerWidth] = useState(0);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [showSaved, setShowSaved] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [valuePreview, setValuePreview] = useState<any>(null);
  const [headerGrid, setHeaderGrid] = useState<any>(null);
  const [rowsGrid, setRowsGrid] = useState<any>(null);

  useEffect(() => {
    if (copied) setShowCopied(true);
  }, [copied]);

  useEffect(() => {
    if (showCopied) setTimeout(() => setShowCopied(false), 1000);
  }, [showCopied]);

  useEffect(() => {
    if (saved) setShowSaved(true);
  }, [saved]);

  useEffect(() => {
    if (showSaved) setTimeout(() => setShowSaved(false), 1000);
  }, [showSaved]);

  const autoColumnWidths = useMemo(() => {
    if (!containerWidth || !fields.length) return [] as number[];
    let total = 0;
    return fields.map((name, index) => {
      const w = resolveCellWidth(name, rows, config.data?.customFont);
      total += w;
      if (index + 1 === fields.length && total < containerWidth) {
        total -= w;
        return containerWidth - total;
      }
      return w;
    });
  }, [containerWidth, fields, rows, config.data?.customFont]);

  const getColumnWidth = useCallback(
    ({ index }: { index: number }) => {
      const field = fields[index];
      if (field && columnWidths[field.name] !== undefined) return columnWidths[field.name];
      return autoColumnWidths[index] ?? 50;
    },
    [fields, columnWidths, autoColumnWidths],
  );

  const handleStop = useCallback(
    (data: { name: string; index: number }, e: DraggableEvent, move: DraggableData) => {
      const originalWidth = getColumnWidth(data);
      setColumnWidths((prev) => ({ ...prev, [data.name]: Math.max(originalWidth + move.x, 10) }));
      headerGrid?.measureAllCells();
      headerGrid?.recomputeGridSize();
      headerGrid?.forceUpdate();
      rowsGrid?.measureAllCells();
      rowsGrid?.recomputeGridSize();
      rowsGrid?.forceUpdate();
    },
    [getColumnWidth, headerGrid, rowsGrid],
  );

  const onClosePreviewClick = useCallback(() => {
    setShowPreview(false);
    setValuePreview(null);
  }, []);

  const onOpenPreviewClick = useCallback((value) => {
    setValuePreview(value);
    setShowPreview(true);
  }, []);

  const renderHeaderTopBar = useCallback(() => {
    const csvDelimiter = config.data?.csvDelimiter || ',';
    const badgeClass =
      'flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs';
    const linkClass = 'cursor-pointer hover:underline';

    let copyPanel: ReactElement | null = null;
    let savePanel: ReactElement | null = null;
    if (rowCount) {
      copyPanel = (
        <div className={badgeClass} title="Copy as">
          <Copy className="h-3 w-3" />
          {showCopied ? (
            <span>Copied</span>
          ) : (
            <>
              <a
                className={linkClass}
                onClick={() => onCopyToClipboardClick(rows, 'CSV', csvDelimiter)}
              >
                CSV
              </a>
              <a className={linkClass} onClick={() => onCopyToClipboardClick(rows, 'JSON')}>
                JSON
              </a>
            </>
          )}
        </div>
      );

      savePanel = (
        <div className={badgeClass} title="Save as">
          <Save className="h-3 w-3" />
          {showSaved ? (
            <span>Saved</span>
          ) : (
            <>
              <a className={linkClass} onClick={() => onSaveToFileClick(rows, 'CSV', csvDelimiter)}>
                CSV
              </a>
              <a className={linkClass} onClick={() => onSaveToFileClick(rows, 'JSON')}>
                JSON
              </a>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="flex shrink-0 items-center justify-between gap-2 bg-black/5 p-1">
        <div className="flex items-center gap-2">
          <div className={badgeClass}>
            <TableIcon className="h-3 w-3" />
            Rows
            <span className="font-semibold">{rowCount}</span>
          </div>
          {executionTime != null && (
            <div className={badgeClass}>
              <span className="font-semibold">{(executionTime / 1000).toFixed(3)}s</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {savePanel}
          {copyPanel}
        </div>
      </div>
    );
  }, [
    config.data?.csvDelimiter,
    showCopied,
    showSaved,
    rowCount,
    onCopyToClipboardClick,
    rows,
    onSaveToFileClick,
    executionTime,
  ]);

  const renderHeaderCell = useCallback(
    (params) => {
      const field = fields[params.columnIndex];
      return (
        <div className="item">
          <span>{field.name}</span>
          {fields.length - 1 !== params.columnIndex ? (
            <DraggableHandle
              columnIndex={params.columnIndex}
              field={field}
              handleStop={handleStop}
            />
          ) : null}
        </div>
      );
    },
    [fields, handleStop],
  );

  const renderCell = useCallback(
    (params) => {
      const field = fields[params.columnIndex];
      return (
        <QueryResultTableCell
          rowIndex={params.rowIndex}
          data={rows}
          col={field.name}
          onOpenPreviewClick={onOpenPreviewClick}
        />
      );
    },
    [fields, onOpenPreviewClick, rows],
  );

  const fixedHeightRows = (rowCount || 1) * ROW_HEIGHT + SCROLLBAR_HEIGHT;
  const defaultHeight = fixedHeightRows + GRID_HEADER_HEIGHT;

  return (
    <div className="grid-query-wrapper flex h-full flex-col">
      {showPreview && <PreviewModal value={valuePreview} onCloseClick={onClosePreviewClick} />}
      {renderHeaderTopBar()}
      <div className="min-h-0 flex-1">
        <AutoSizer
          defaultHeight={defaultHeight}
          onResize={({ width }) => {
            setContainerWidth(width);
            headerGrid?.recomputeGridSize();
            rowsGrid?.recomputeGridSize();
          }}
        >
          {({ width, height }) => {
            if (!width) return null;
            const bodyHeight = Math.min(height - GRID_HEADER_HEIGHT, fixedHeightRows);
            return (
              <ScrollSync>
                {({ onScroll, scrollLeft }) => (
                  <div>
                    {fields.length > 0 && (
                      <Grid
                        ref={(ref) => setHeaderGrid(ref)}
                        columnWidth={getColumnWidth}
                        columnCount={fields.length}
                        height={GRID_HEADER_HEIGHT}
                        cellRenderer={createCellRenderer(renderHeaderCell)}
                        className="grid-header-row"
                        rowHeight={GRID_HEADER_HEIGHT}
                        rowCount={1}
                        width={width - scrollbarSize()}
                        scrollLeft={scrollLeft}
                      />
                    )}
                    <Grid
                      className="grid-body"
                      ref={(ref) => setRowsGrid(ref)}
                      cellRenderer={createCellRenderer(renderCell)}
                      width={width}
                      height={bodyHeight}
                      rowHeight={ROW_HEIGHT}
                      onScroll={onScroll}
                      rowCount={rowCount || rows.length}
                      columnCount={fields.length}
                      columnWidth={getColumnWidth}
                      rows={rows}
                      rowsCount={rowCount}
                      noContentRenderer={() => (
                        <div style={{ textAlign: 'center', fontSize: '16px' }}>
                          No results found
                        </div>
                      )}
                    />
                  </div>
                )}
              </ScrollSync>
            );
          }}
        </AutoSizer>
      </div>
    </div>
  );
};

QueryResultTable.displayName = 'QueryResultTable';
export default QueryResultTable;
