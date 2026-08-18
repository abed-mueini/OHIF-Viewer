import * as React from 'react';
import { cn } from '../../lib/utils';

export function Toolbar({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // Mobile: single row, gap between clusters; the right cluster is
        // allowed to wrap onto its own line instead of overflowing.
        // lg+: restore the 3-column grid (logo | title | actions).
        'worklist-toolbar relative flex flex-wrap items-center justify-between gap-2 py-4',
        'lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:flex-nowrap lg:gap-0',
        className
      )}
    >
      {children}
    </div>
  );
}
