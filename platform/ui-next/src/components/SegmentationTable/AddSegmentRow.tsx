import React from 'react';
import { Button, Icons } from '@ohif/ui-next';
import { useSegmentationTableContext, useSegmentationExpanded } from './contexts';
import { useTranslation } from 'react-i18next';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { cn } from '../../lib/utils';

export const AddSegmentRow: React.FC<{ children?: React.ReactNode }> = ({ children = null }) => {
  const { t } = useTranslation('SegmentationPanel');
  const { isTouch } = useResponsiveLayout();
  const {
    activeRepresentation,
    disableEditing,
    activeSegmentationId,
    onSegmentAdd,
    onToggleSegmentationRepresentationVisibility,
    data,
    showAddSegment,
    segmentationRepresentationTypes,
  } = useSegmentationTableContext('AddSegmentRow');

  // Try to get from expanded context first, then fall back to active segmentation
  let segmentationId = activeSegmentationId;
  let representation = activeRepresentation;

  try {
    const expandedContext = useSegmentationExpanded('AddSegmentRow');
    if (expandedContext.isActive) {
      segmentationId = expandedContext.segmentation.segmentationId;
      representation = expandedContext.representation;
    }
  } catch (e) {
    // Use the default values from table context
  }

  // If no segmentations, don't render
  if (!data?.length) {
    return null;
  }

  // Check if all segments are visible
  const allSegmentsVisible = Object.values(representation?.segments || {}).every(
    segment => segment?.visible !== false
  );

  const Icon = allSegmentsVisible ? (
    <Icons.Hide className="h-6 w-6" />
  ) : (
    <Icons.Show className="h-6 w-6" />
  );

  const allowAddSegment = showAddSegment && !disableEditing;

  const dataCyTypeSuffix = segmentationRepresentationTypes
    ? `-${segmentationRepresentationTypes[0]}`
    : '';

  return (
    <div
      className={cn(
        'my-px flex w-full items-center justify-between rounded [padding-inline-start:0.125rem] [padding-inline-end:1.75rem]',
        isTouch ? 'min-h-11' : 'h-7'
      )}
    >
      <div className="mt-1 flex-1">
        {allowAddSegment ? (
          <Button
            size="sm"
            variant="ghost"
            className={cn('[padding-inline-start:0.125rem]', isTouch && 'min-h-11')}
            dataCY="add-segment"
            onClick={() => onSegmentAdd(segmentationId)}
          >
            <Icons.Add />
            {t('Add Segment')}
          </Button>
        ) : null}
      </div>
      <Button
        size="icon"
        variant="ghost"
        className={cn(isTouch && 'h-11 w-11')}
        aria-label={allSegmentsVisible ? t('Hide') : t('Show')}
        data-cy={`all-segments-visibility-toggle${dataCyTypeSuffix}`}
        onClick={() =>
          onToggleSegmentationRepresentationVisibility(segmentationId, representation?.type)
        }
      >
        {Icon}
      </Button>
      {children}
    </div>
  );
};
