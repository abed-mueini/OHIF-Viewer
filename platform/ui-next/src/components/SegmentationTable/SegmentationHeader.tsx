import React from 'react';
import { Button } from '../Button';
import { Icons } from '../Icons/Icons';
import { DropdownMenu, DropdownMenuTrigger } from '../DropdownMenu';
import { Tooltip, TooltipTrigger, TooltipContent } from '../Tooltip/Tooltip';
import { useSegmentationExpanded, useSegmentationTableContext } from './contexts';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';

// Then use it in your component:
export const SegmentationHeader: React.FC<{
  children?: React.ReactNode;
}> = ({ children }) => {
  // Always call both hooks unconditionally at the top level
  const expandedContext = useSegmentationExpanded('SegmentationHeader');
  const tableContext = useSegmentationTableContext('SegmentationHeader');
  const { t } = useTranslation('SegmentationPanel');
  const { isTouch } = useResponsiveLayout();

  // Determine which segmentation to use
  const segmentation = expandedContext?.segmentation || tableContext.activeSegmentation;

  if (!segmentation) {
    return null;
  }

  return (
    <div
      className={cn(
        'text-foreground flex w-full min-w-0 items-center justify-between',
        isTouch ? 'min-h-11' : 'h-8'
      )}
    >
      <div className="flex min-w-0 items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn('[margin-inline-start:0.25rem]', isTouch && 'h-11 w-11')}
              aria-label={t('Actions')}
              onClick={e => e.stopPropagation()}
            >
              <Icons.More />
            </Button>
          </DropdownMenuTrigger>
          {children}
        </DropdownMenu>
        <div className="min-w-0 truncate [padding-inline-start:0.375rem]">
          <bdi dir="auto">{segmentation.label}</bdi>
        </div>
      </div>
      <div className="flex items-center [margin-inline-end:0.25rem]">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(isTouch && 'h-11 w-11')}
              aria-label={t('Info')}
            >
              <Icons.Info className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{segmentation.cachedStats?.info}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
