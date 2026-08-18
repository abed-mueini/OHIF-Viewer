import * as React from 'react';
import { ScrollArea } from '../../ScrollArea';
import { PreviewContent } from './PreviewContent';
import { PreviewHeader } from './PreviewHeader';

type PreviewContainerProps = {
  children: React.ReactNode;
};

function PreviewContainerRoot({ children }: PreviewContainerProps) {
  let header: React.ReactNode = null;
  let content: React.ReactNode = null;

  React.Children.forEach(children, child => {
    if (React.isValidElement(child)) {
      const childType = child.type;

      if (childType === PreviewHeader) {
        header = child;
      } else if (childType === PreviewContent) {
        if (content) {
          throw new Error('PreviewContainer can only contain one PreviewContent.');
        }
        content = child;
      } else {
        throw new Error('PreviewContainer can only contain PreviewHeader and PreviewContent.');
      }
    }
  });

  if (!content) {
    throw new Error('PreviewContainer must contain PreviewContent.');
  }

  return (
    <div className="worklist-preview bg-background relative flex h-full w-full flex-col">
      {header}
      <div className="direction-y flex min-h-0 flex-1 pb-3 pt-[15px] [padding-inline-end:0.75rem]">
        {content}
      </div>
    </div>
  );
}

PreviewContainerRoot.displayName = 'PreviewContainer';

export const PreviewContainer = PreviewContainerRoot;
