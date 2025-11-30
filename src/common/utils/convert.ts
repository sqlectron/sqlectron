export function rowsValuesToString(rows: any[]): any[] {
  return rows.map((row) => rowValuesToString(row));
}

export function rowValuesToString(row: object | any[]): unknown {
  if (Array.isArray(row)) {
    return rowsValuesToString(row);
  }

  const parsedRow = {};

  Object.keys(row).forEach((col) => {
    parsedRow[col] = valueToString(row[col]);
  });

  return parsedRow;
}

export function valueToString(value: unknown): string {
  if (value === null) {
    return 'NULL';
  }

  if (typeof value === 'boolean') {
    return value.toString();
  }

  if (!value) {
    return String(value);
  }

  if (value instanceof Date && value.toISOString) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    if (isArrayBuffer(value)) {
      return arrayBufferToString(value);
    }

    return JSON.stringify(value);
  }

  return String(value);
}

function arrayBufferToString(buf: ArrayBuffer): string {
  // @ts-ignore
  if (buf.length === 1) {
    // Probably is a bit column
    return String(buf[0]);
  }
  // @ts-ignore
  return buf.toString('utf-8');
}

// reference:
// http://stackoverflow.com/a/21799845/1050818
function isArrayBuffer(value: any): value is ArrayBuffer {
  return value && value.buffer instanceof ArrayBuffer && value.byteLength !== undefined;
}
