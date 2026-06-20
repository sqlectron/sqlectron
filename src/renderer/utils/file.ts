import { DialogFilter } from './../../common/types/api';
import { sqlectron } from './../api';

export function showSaveDialog(filters: Array<DialogFilter>): Promise<string> {
  return sqlectron.browser.dialog.showSaveDialog(filters);
}

export function saveFile(filename: string, data: unknown, encoding?: string): Promise<void> {
  return sqlectron.browser.fs.saveFile(filename, data, encoding);
}

export function showOpenDialog(
  filters: Array<DialogFilter>,
  defaultPath?: string,
): Promise<string[]> {
  return sqlectron.browser.dialog.showOpenDialog(filters, defaultPath);
}

export function openFile(filename: string): Promise<string> {
  return sqlectron.browser.fs.openFile(filename);
}
