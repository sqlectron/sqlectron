import React, { FC, MouseEvent } from 'react';
import { ChevronRight, Database, Plug, Power, Server } from 'lucide-react';
import { sqlectron } from '../api';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

import LOGO_PATH from './logo-128px.png';

const BREADCRUMB_ICONS: Record<string, typeof Server> = {
  server: Server,
  database: Database,
};

function onSiteClick(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  sqlectron.browser.shell.openExternal('https://sqlectron.github.io');
}

function renderBreadcrumb(items: { icon: string; label: string }[]) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      {items.map(({ icon, label }, index) => {
        const Icon = BREADCRUMB_ICONS[icon];
        const isLast = index === items.length - 1;
        return (
          <span key={index + label} className="flex items-center gap-1.5">
            {Icon && <Icon className="h-4 w-4 text-slate-400" />}
            <span className={cn(isLast ? 'font-semibold text-slate-900' : 'text-slate-500')}>
              {label}
            </span>
            {!isLast && <ChevronRight className="h-4 w-4 text-slate-300" />}
          </span>
        );
      })}
    </div>
  );
}

interface Props {
  items: { icon: string; label: string }[];
  onCloseConnectionClick?: () => void;
  onReConnectionClick?: () => void;
}

const Header: FC<Props> = ({ items, onCloseConnectionClick, onReConnectionClick }) => {
  return (
    <div
      id="header"
      className="fixed inset-x-0 top-0 z-40 grid h-[50px] grid-cols-3 items-center border-b border-slate-200 bg-white px-3"
    >
      <a href="#" onClick={onSiteClick} className="justify-self-start">
        <img alt="logo" src={LOGO_PATH} className="w-[5.5em]" />
      </a>
      <div className="justify-self-center">{renderBreadcrumb(items)}</div>
      {onCloseConnectionClick && (
        <div className="flex items-center justify-end gap-1">
          <Button variant="outline" size="sm" title="Reconnect" onClick={onReConnectionClick}>
            <Plug className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            title="Close connection"
            onClick={onCloseConnectionClick}
          >
            <Power className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

Header.displayName = 'Header';

export default Header;
