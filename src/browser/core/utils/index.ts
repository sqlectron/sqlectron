import fs from 'fs';
import { homedir } from 'os';
import path from 'path';
import envPaths from 'env-paths';

let configPath = '';

export function getConfigPath(): string {
  if (configPath) {
    return configPath;
  }

  const configName = 'sqlectron.json';
  const oldConfigPath = path.join(homedir(), `.${configName}`);

  if (process.env.SQLECTRON_HOME) {
    configPath = path.join(process.env.SQLECTRON_HOME, configName);
  } else if (fileExistsSync(oldConfigPath)) {
    configPath = oldConfigPath;
  } else {
    const newConfigDir = envPaths('Sqlectron', { suffix: '' }).config;
    configPath = path.join(newConfigDir, configName);
  }

  return configPath;
}

export function fileExists(filename: string): Promise<boolean> {
  return new Promise((resolve) => {
    fs.stat(filename, (err, stats) => {
      if (err) return resolve(false);
      resolve(stats.isFile());
    });
  });
}

export function fileExistsSync(filename: string): boolean {
  try {
    return fs.statSync(filename).isFile();
  } catch {
    return false;
  }
}

export function writeFile(filename: string, data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export function writeJSONFile<T>(filename: string, data: T): Promise<void> {
  return writeFile(filename, JSON.stringify(data, null, 2));
}

export function writeJSONFileSync<T>(filename: string, data: T): void {
  return fs.writeFileSync(filename, JSON.stringify(data, null, 2));
}

export function readFile(filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, { encoding: 'utf-8' }, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

export async function readJSONFile<T>(filename: string): Promise<T> {
  const filePath = resolveHomePathToAbsolute(filename);
  const data = await readFile(path.resolve(filePath));
  return JSON.parse(data);
}

export function readJSONFileSync<T>(filename: string): T {
  const filePath = resolveHomePathToAbsolute(filename);
  const data = fs.readFileSync(path.resolve(filePath), { encoding: 'utf-8' });
  return JSON.parse(data);
}

export function createParentDirectory(filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdir(filename, { recursive: true }, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

export function createParentDirectorySync(filename: string): void {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
}

export function resolveHomePathToAbsolute(filename: string): string {
  if (!/^~\//.test(filename)) {
    return filename;
  }

  return path.join(homedir(), filename.substring(2));
}
