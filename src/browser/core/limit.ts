import {
  setSelectLimit as internalSet,
  clearSelectLimit as internalClear,
} from 'sqlectron-db-core';

import * as config from './config';

export async function setSelectLimit(): Promise<void> {
  const { limitQueryDefaultSelectTop } = await config.get();
  if (limitQueryDefaultSelectTop !== null && limitQueryDefaultSelectTop !== undefined) {
    internalSet(limitQueryDefaultSelectTop);
  }
}

export function clearSelectLimit(): void {
  internalClear();
}
