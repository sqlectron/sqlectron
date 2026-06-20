import scrollbarSize from 'dom-helpers/scrollbarSize';
import debounce from 'lodash/debounce';
import { Copy, Save, Table as TableIcon } from 'lucide-react';
import React, { FC, ReactElement, useCallback, useEffect, useState } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { Grid, ScrollSync } from 'react-virtualized';

import { valueToString } from '../../common/utils/convert';
import { useAppSelector } from '../hooks/redux';
import { usePrevious } from '../hooks/usePrevious';

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
  // additional spacing
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

interface Props {
  widthOffset: number;
  heightOffset: number;
  onCopyToClipboardClick: (rows, type: string, delimiter?: string) => void;
  onSaveToFileClick: (rows, type: string, delimiter?: string) => void;
  copied: boolean | null;
  saved: boolean | null;
  fields: any[];
  rows: any[];
  rowCount: number | undefined;
}

const QueryResultTable: FC<Props> = ({
  widthOffset,
  heightOffset,
  onCopyToClipboardClick,
  onSaveToFileClick,
  copied,
  saved,
  fields,
  rows,
  rowCount,
}) => {
  const config = useAppSelector((state) => state.config);
  const [tableWidth, setTableWidth] = useState<null | number>(null);
  const [tableHeight, setTableHeight] = useState(0);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [autoColumnWidths, setAutoColumnWidths] = useState<number[]>([]);
  const [resizeTimer, setResizeTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [valuePreview, setValuePreview] = useState<any>(null);

  const [headerGrid, setHeaderGrid] = useState<any>(null);
  const [rowsGrid, setRowsGrid] = useState<any>(null);

  const previousOffsetWidth = usePrevious(widthOffset);

  const resize = useCallback(() => {
    const newTableWidth = window.innerWidth - (widthOffset + 27);
    const newTableHeight = window.innerHeight - (heightOffset + 225);

    let totalColumnWidths = 0;

    const autoColumnWidths = fields.map((name, index) => {
      const cellWidth = resolveCellWidth(name, rows, config.data?.customFont);
      totalColumnWidths += cellWidth;

      const isLastColumn = index + 1 === fields.length;
      if (isLastColumn && totalColumnWidths < newTableWidth) {
        totalColumnWidths -= cellWidth;
        return newTableWidth - totalColumnWidths;
      }

      return cellWidth;
    });

    setAutoColumnWidths(autoColumnWidths);

    setTableWidth(newTableWidth);
    setTableHeight(newTableHeight);
  }, [config.data?.customFont, fields, heightOffset, rows, widthOffset]);

  const onResize = useCallback(
    () =>
      debounce(() => {
        if (resizeTimer) {
          clearTimeout(resizeTimer);
        }
        setResizeTimer(setTimeout(resize, 16));
      }),
    [resize, resizeTimer],
  );

  useEffect(() => {
    window.addEventListener('resize', onResize, false);
    resize();

    return () => {
      window.removeEventListener('resize', onResize, false);
    };
  }, [resize, onResize]);

  useEffect(() => {
    resize();
  }, [resize]);

  useEffect(() => {
    if (previousOffsetWidth !== widthOffset) {
      if (rowsGrid) {
        rowsGrid.recomputeGridSize();
      }
      if (headerGrid) {
        headerGrid.recomputeGridSize();
      }
    }
  }, [headerGrid, previousOffsetWidth, rowsGrid, widthOffset]);

  useEffect(() => {
    if (copied) {
      setShowCopied(true);
    }
  }, [copied]);

  useEffect(() => {
    if (showCopied) {
      setTimeout(() => setShowCopied(false), 1000);
    }
  }, [showCopied]);

  useEffect(() => {
    if (saved) {
      setShowSaved(true);
    }
  }, [saved]);

  useEffect(() => {
    if (showSaved) {
      setTimeout(() => setShowSaved(false), 1000);
    }
  }, [showSaved]);

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
      <div className="flex items-center justify-between gap-2 bg-black/5 p-1">
        <div className={badgeClass}>
          <TableIcon className="h-3 w-3" />
          Rows
          <span className="font-semibold">{rowCount}</span>
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
  ]);

  const getColumnWidth = useCallback(
    ({ index }) => {
      const field = fields[index];

      if (field && columnWidths && columnWidths[field.name] !== undefined) {
        return columnWidths[field.name];
      }
      if (autoColumnWidths && autoColumnWidths[index] !== undefined) {
        return autoColumnWidths[index];
      }
      return 50;
    },
    [fields, columnWidths, autoColumnWidths],
  );

  const handleStop = useCallback(
    (data: { name: string; index: number }, e: DraggableEvent, move: DraggableData) => {
      const originalWidth = getColumnWidth(data);

      // update dragged column width
      setColumnWidths((prev) => {
        prev[data.name] = Math.max(originalWidth + move.x, 10);
        return prev;
      });

      if (headerGrid) {
        headerGrid.measureAllCells();
        headerGrid.recomputeGridSize();
        headerGrid.forceUpdate();
      }

      if (rowsGrid) {
        rowsGrid.measureAllCells();
        rowsGrid.recomputeGridSize();
        rowsGrid.forceUpdate();
      }
    },
    [getColumnWidth, headerGrid, rowsGrid],
  );

  const renderHeaderCell = useCallback(
    (params) => {
      const field = fields[params.columnIndex];

      // We don't want the resizable handle on the last column for layout reasons
      let resizeDrag: ReactElement | null = null;
      if (fields.length - 1 !== params.columnIndex) {
        resizeDrag = (
          <Draggable
            axis="x"
            onStop={(e, data) =>
              handleStop({ name: field.name, index: params.columnIndex }, e, data)
            }
            position={{ x: 0, y: 0 }}
          >
            <div className="draggable-handle" />
          </Draggable>
        );
      }

      return (
        <div className="item">
          <span>{field.name}</span>
          {resizeDrag}
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

  if (!tableWidth) {
    return null;
  }

  const headerHeight = 62; // value of 2 headers together
  const scrollBarHeight = 15;
  const rowHeight = 28;
  const fixedHeightRows = (rowCount || 1) * rowHeight + scrollBarHeight;

  return (
    <div>
      {showPreview && <PreviewModal value={valuePreview} onCloseClick={onClosePreviewClick} />}

      <ScrollSync>
        {({ onScroll, scrollLeft }) => (
          <div className="grid-query-wrapper">
            {renderHeaderTopBar()}

            {/* header */}
            {fields.length && (
              <Grid
                ref={(ref) => setHeaderGrid(ref)}
                columnWidth={getColumnWidth}
                columnCount={fields.length}
                height={30}
                cellRenderer={createCellRenderer(renderHeaderCell)}
                className="grid-header-row"
                rowHeight={30}
                rowCount={1}
                width={tableWidth - scrollbarSize()}
                scrollLeft={scrollLeft}
              />
            )}

            {/* body */}
            <Grid
              className="grid-body"
              ref={(ref) => setRowsGrid(ref)}
              cellRenderer={createCellRenderer(renderCell)}
              width={tableWidth}
              height={Math.min(tableHeight - headerHeight, fixedHeightRows)}
              rowHeight={rowHeight}
              onScroll={onScroll}
              rowCount={rowCount || rows.length}
              columnCount={fields.length}
              columnWidth={getColumnWidth}
              rows={rows}
              rowsCount={rowCount}
              noContentRenderer={() => (
                <div style={{ textAlign: 'center', fontSize: '16px' }}>No results found</div>
              )}
            />
          </div>
        )}
      </ScrollSync>
    </div>
  );
};

QueryResultTable.displayName = 'QueryResultTable';
export default QueryResultTable;
