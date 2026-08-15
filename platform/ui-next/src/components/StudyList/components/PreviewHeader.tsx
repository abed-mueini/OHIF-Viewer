import * as React from 'react';

export function PreviewHeader({ children }: { children?: React.ReactNode }) {
  return (
    <div className="z-10 mt-5 flex items-center justify-end gap-1 [margin-inline-end:1.25rem]">
      {children}
    </div>
  );
}
