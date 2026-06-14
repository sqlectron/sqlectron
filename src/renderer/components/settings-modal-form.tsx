import React, { ChangeEvent, FC, MouseEvent, useCallback, useState } from 'react';
import { cloneDeep, set } from 'lodash';
import Select from 'react-select';
import { AlertTriangle, Bug, CircleX, Info } from 'lucide-react';

import { sqlectron } from '../api';
import { cn } from '../lib/utils';
import Checkbox from './checkbox';
import { mapObjectToConfig } from '../utils/config';
import type { BaseConfig, Config } from '../../common/types/config';
import { ConfigState } from '../reducers/config';
import { Button, buttonVariants } from './ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';

const logLevelOptions = [
  { value: 'debug', label: 'Debug', icon: Bug },
  { value: 'info', label: 'Info', icon: Info },
  { value: 'warn', label: 'Warn', icon: AlertTriangle },
  { value: 'error', label: 'Error', icon: CircleX },
];

const errorLogLevelOption = logLevelOptions.find((l) => l.value === 'error');

interface Props {
  onSaveClick: (config: BaseConfig) => void;
  onCancelClick: () => void;
  config: ConfigState;
  // TODO: hook up to render
  error: Error | null;
}

const renderLogLevelItem = ({ label, icon: Icon }) => {
  return (
    <span className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
};

const SettingsModalForm: FC<Props> = ({ onSaveClick, onCancelClick, config }) => {
  const [configState, setConfigState] = useState(cloneDeep(config.data as Config));

  const handleChange = useCallback(
    (
      event:
        | ChangeEvent<HTMLInputElement>
        | { persist?: null; target: { files?: null; name: string; value: boolean; type?: null } },
    ) => {
      if (event.persist) {
        event.persist();
      }
      const newState = cloneDeep(configState || {}) as Config;
      const { target } = event;
      const value = target.files ? target.files[0].path : target.value;
      const name = target.name.replace(/^file\./, '');
      const [name1, name2] = name.split('.');

      if (name1 && name2) {
        newState[name1] = { ...newState[name1] };
      }

      set(
        newState,
        name,
        typeof value === 'string' && typeof target.type === 'string'
          ? target.type === 'range'
            ? Number.parseFloat(value)
            : Number.parseInt(value, 10)
          : value,
      );
      setConfigState(newState);
    },
    [configState],
  );

  const handleLogLevelChange = useCallback(
    (level: { value: string }) => {
      setConfigState({ ...configState, log: { ...configState.log, level: level.value } });
    },
    [configState],
  );

  const handleSaveClick = useCallback(() => {
    onSaveClick(mapObjectToConfig(configState));
  }, [configState, onSaveClick]);

  const onDocClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    sqlectron.browser.shell.openExternal(
      'https://github.com/sqlectron/sqlectron-gui/blob/master/docs/app/configuration-file.md',
    );
  };

  const handleSetConfigState = useCallback(
    (newValues: Partial<Config>) => {
      setConfigState({ ...configState, ...newValues });
    },
    [configState],
  );

  const zoomFactor = configState.zoomFactor || 1;
  const zoomFactorLabel = `${Math.round(zoomFactor * 100)}%`;
  const log = configState.log || {};

  return (
    <Dialog open onOpenChange={(open) => !open && onCancelClick()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Zoom Factor: {zoomFactorLabel}</label>
              <input
                type="range"
                min="0.4"
                max="3"
                step="0.2"
                name="zoomFactor"
                value={zoomFactor}
                onChange={handleChange}
                className="mt-2 w-full"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Limit of Rows from Select Top Query</label>
              <Input
                type="number"
                name="limitQueryDefaultSelectTop"
                value={configState.limitQueryDefaultSelectTop || ''}
                onChange={handleChange}
              />
              <p className="text-xs text-slate-500">
                The limit used in the default select from the sidebar context menu.
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-md border border-slate-200 p-4">
            <div className="text-sm font-semibold">UI Preferences</div>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <Checkbox
                  name="enabledDarkTheme"
                  label="Dark Theme"
                  checked={configState.enabledDarkTheme}
                  onChecked={() => handleSetConfigState({ enabledDarkTheme: true })}
                  onUnchecked={() => handleSetConfigState({ enabledDarkTheme: false })}
                />
                <p className="text-xs text-slate-500">Enable/Disable dark theme.</p>
              </div>
              <div className="flex flex-col gap-1">
                <Checkbox
                  name="disabledOpenAnimation"
                  label="Disable Intro"
                  checked={configState.disabledOpenAnimation}
                  onChecked={() => handleSetConfigState({ disabledOpenAnimation: true })}
                  onUnchecked={() => handleSetConfigState({ disabledOpenAnimation: false })}
                />
                <p className="text-xs text-slate-500">
                  Enable/Disable the animation shown when the app opens.
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <Checkbox
                  name="connectionsAsList"
                  label="List Connections"
                  checked={configState.connectionsAsList}
                  onChecked={() => handleSetConfigState({ connectionsAsList: true })}
                  onUnchecked={() => handleSetConfigState({ connectionsAsList: false })}
                />
                <p className="text-xs text-slate-500">
                  Display saved connections as a list instead of cards.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Custom Font</label>
              <Input
                type="text"
                name="customFont"
                value={configState.customFont || 'Lato'}
                onChange={handleChange}
              />
              <p className="text-xs text-slate-500">
                Use a custom font for in-app text and display. Font must be installed to use.
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-md border border-slate-200 p-4">
            <div className="text-sm font-semibold">Auto Complete</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <Checkbox
                  name="enabledAutoComplete"
                  label="Auto Complete"
                  checked={configState.enabledAutoComplete}
                  onChecked={() => handleSetConfigState({ enabledAutoComplete: true })}
                  onUnchecked={() => handleSetConfigState({ enabledAutoComplete: false })}
                />
                <p className="text-xs text-slate-500">
                  Enable/Disable auto complete for the query box.
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <Checkbox
                  name="enabledLiveAutoComplete"
                  label="Live Auto Complete"
                  checked={configState.enabledLiveAutoComplete}
                  onChecked={() => handleSetConfigState({ enabledLiveAutoComplete: true })}
                  onUnchecked={() => handleSetConfigState({ enabledLiveAutoComplete: false })}
                />
                <p className="text-xs text-slate-500">
                  Enable/Disable live auto complete for the query box.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-md border border-slate-200 p-4">
            <div className="text-sm font-semibold">CSV Options</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Custom CSV Delimiter Character</label>
                <Input
                  type="text"
                  name="csvDelimiter"
                  value={configState.csvDelimiter || ','}
                  onChange={handleChange}
                />
                <p className="text-xs text-slate-500">
                  Characters entered here will override the comma/tab switch.
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <Checkbox
                  name="use"
                  label="Tab Delimited Values"
                  checked={configState.csvDelimiter === '  '}
                  onChecked={() => handleSetConfigState({ csvDelimiter: '  ' })}
                  onUnchecked={() => handleSetConfigState({ csvDelimiter: ',' })}
                />
                <p className="text-xs text-slate-500">Use tabs for exporting CSVs when checked.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-md border border-slate-200 p-4">
            <div className="text-sm font-semibold">Logging</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <Checkbox
                  name="log.console"
                  label="Console"
                  checked={log.console}
                  onChecked={() =>
                    handleChange({
                      target: { name: 'log.console', value: true },
                    })
                  }
                  onUnchecked={() =>
                    handleChange({
                      target: { name: 'log.console', value: false },
                    })
                  }
                />
                <p className="text-xs text-slate-500">Show logs in the dev tools panel.</p>
              </div>

              <div className="flex flex-col gap-1">
                <Checkbox
                  name="log.file"
                  label="File"
                  checked={log.file}
                  onChecked={() =>
                    handleChange({
                      target: { name: 'log.file', value: true },
                    })
                  }
                  onUnchecked={() =>
                    handleChange({
                      target: { name: 'log.file', value: false },
                    })
                  }
                />
                <p className="text-xs text-slate-500">Save logs into a file.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Path</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    name="log.path"
                    placeholder="~/.sqlectron.log"
                    value={log.path || ''}
                    onChange={handleChange}
                  />
                  <label
                    htmlFor="file.log.path"
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'sm' }),
                      'cursor-pointer',
                    )}
                  >
                    Browse
                    <input
                      type="file"
                      id="file.log.path"
                      name="file.log.path"
                      onChange={handleChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-slate-500">Log file path.</p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Level</label>
                <Select
                  name="log.level"
                  options={logLevelOptions}
                  defaultValue={errorLogLevelOption}
                  isClearable={false}
                  onChange={handleLogLevelChange}
                  formatOptionLabel={renderLogLevelItem}
                  value={logLevelOptions.find((l) => l.value === log.level)}
                />
                <p className="text-xs text-slate-500">Level logging: debug, info, warn, error.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Config Path</span>
              <span className="text-xs text-slate-500">{config.path}</span>
            </div>
            <div className="text-sm">
              Check out the full settings documentation at{' '}
              <a href="#" onClick={onDocClick} className="text-slate-900 underline">
                here
              </a>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancelClick}>
            Cancel
          </Button>
          <Button variant="positive" onClick={handleSaveClick}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

SettingsModalForm.displayName = 'SettingsModalForm';
export default SettingsModalForm;
