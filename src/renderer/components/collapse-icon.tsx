import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { FC } from 'react';

interface CollapseIconProps {
  arrowDirection: 'down' | 'right';
  expandAction?: () => void;
}

const CollapseIcon: FC<CollapseIconProps> = ({ arrowDirection, expandAction }) => {
  const Icon = arrowDirection === 'down' ? ChevronDown : ChevronRight;
  return <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" onClick={expandAction} />;
};

export default CollapseIcon;
