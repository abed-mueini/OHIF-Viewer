import React from 'react';
import { Icons } from '../Icons';
import { useTranslation } from 'react-i18next';
import { useSegmentationTableContext } from './contexts';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { cn } from '../../lib/utils';

export const AddSegmentationRow: React.FC<{ children?: React.ReactNode }> = ({
  children = null,
}) => {
  const { t } = useTranslation('SegmentationPanel');
  const { isTouch } = useResponsiveLayout();

  const {
    onSegmentationAdd,
    data,
    disableEditing,
    mode,
    disabled,
    segmentationRepresentationTypes,
  } = useSegmentationTableContext('AddSegmentationRow');

  // Check if we have at least one segmentation of the representation type for the panel this component is contained in.
  const hasRepresentationType =
    (!segmentationRepresentationTypes && data.length > 0) ||
    data.some(info => segmentationRepresentationTypes?.includes(info.representation?.type));

  if (hasRepresentationType && mode === 'collapsed') {
    return null;
  }

  if (disableEditing) {
    return null;
  }

  return (
    <button
      type="button"
      data-cy="addSegmentation"
      className={cn(
        'focus-visible:ring-ring group w-full rounded-[4px] text-start focus-visible:outline-none focus-visible:ring-2',
        isTouch && 'min-h-11',
        disabled && 'cursor-not-allowed opacity-70'
      )}
      disabled={disabled}
      onClick={() =>
        onSegmentationAdd({
          segmentationId: '',
          segmentationRepresentationType: segmentationRepresentationTypes?.[0],
        })
      }
    >
      {children}
      <div className="text-primary group-hover:bg-popover flex min-h-[inherit] items-center rounded-[4px] [padding-inline-start:0.25rem] group-hover:cursor-pointer">
        <div className="grid h-[28px] w-[28px] place-items-center">
          {disabled ? <Icons.Info /> : <Icons.Add />}
        </div>
        <span className="text-[13px]">
          {t(disabled ? 'Segmentation not supported' : 'Add segmentation')}
        </span>
      </div>
    </button>
  );
};
