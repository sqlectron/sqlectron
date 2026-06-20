#!/usr/bin/env node
const electron = require('electron');
const fs = require('fs');
const { join } = require('path');

const main = join(__dirname, '../out/browser/main.js');
const watch = [join(__dirname, '../out/browser')];

const pathCore = join(__dirname, '../../sqlectron-db-core/lib');
try {
  fs.accessSync(pathCore, fs.F_OK);
  watch.push(pathCore);
} catch {
  console.log('Not watching changes on sqlectron-db-core');
}

require('spawn-auto-restart')({
  debug: true,
  proc: {
    command: electron,
    args: [main, '--dev'],
  },
  watch,
});
