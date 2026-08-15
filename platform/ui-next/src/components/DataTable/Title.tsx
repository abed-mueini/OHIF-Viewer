import * as React from 'react';

export function Title({ children }: { children?: React.ReactNode }) {
  return (
    <div
      dir="auto"
      className="text-primary whitespace-nowrap text-[20px] font-medium"
    >
      {children}
    </div>
  );
}
