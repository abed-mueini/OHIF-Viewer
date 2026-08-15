import * as React from 'react';

export function Toolbar({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center py-4">
      {children}
    </div>
  );
}
