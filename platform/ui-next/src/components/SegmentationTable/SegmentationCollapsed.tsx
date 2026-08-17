import React from 'react';
import { PanelSection } from '../PanelSection';
import {
  useSegmentationTableContext,
  SegmentationExpandedProvider,
  useSegmentationExpanded,
} from './contexts';
import { SegmentationLabel } from './SegmentationLabel';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Icons,
  DropdownMenu,
  DropdownMenuTrigger,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '../../components';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { cn } from '../../lib/utils';

// Main header component
const SegmentationCollapsedHeader = ({ children }: { children: React.ReactNode }) => {
  const { isTouch } = useResponsiveLayout();
  return (
    <div
      className={cn(
        'bg-muted flex w-full min-w-0 items-center gap-1 rounded-t px-1.5',
        isTouch ? 'min-h-11' : 'h-10'
      )}
    >
      {children}
    </div>
  );
};

// Dropdown menu component - specifically for dropdown menu content
const SegmentationCollapsedDropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation('Common');
  const { isTouch } = useResponsiveLayout();
  const { segmentationRepresentationTypes } = useSegmentationTableContext(
    'SegmentationCollapsedDropdownMenu'
  );
  const dataCyTypeSuffix = segmentationRepresentationTypes?.[0]
    ? `-${segmentationRepresentationTypes[0]}`
    : '';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(isTouch && 'h-11 w-11')}
          aria-label={t('More')}
          data-cy={`segmentation-collapsed-more-btn${dataCyTypeSuffix}`}
        >
          <Icons.More className="h-6 w-6" />
        </Button>
      </DropdownMenuTrigger>
      {children}
    </DropdownMenu>
  );
};

// Selector component - for the segmentation selection dropdown
const SegmentationCollapsedSelector = () => {
  const { t } = useTranslation('SegmentationPanel');
  const { data, onSegmentationClick, segmentationRepresentationTypes } =
    useSegmentationTableContext('SegmentationCollapsedSelector');
  const { segmentation } = useSegmentationExpanded('SegmentationCollapsedSelector');

  if (!data?.length) {
    return null;
  }

  const segmentations = data
    // Only show segmentations of the representation type for this panel. Show all segmentations if no type is specified.
    .filter(
      seg =>
        !segmentationRepresentationTypes ||
        segmentationRepresentationTypes.includes(seg.representation?.type)
    )
    .map(seg => ({
      id: seg.segmentation.segmentationId,
      segmentation: seg.segmentation,
    }));

  const dataCyTypeSuffix = segmentationRepresentationTypes
    ? `-${segmentationRepresentationTypes[0]}`
    : '';

  return (
    <Select
      onValueChange={value => onSegmentationClick(value)}
      value={segmentation?.segmentationId}
    >
      <SelectTrigger
        className="min-w-0 flex-1 overflow-hidden"
        data-cy={`segmentation-select${dataCyTypeSuffix}`}
      >
        <SelectValue
          placeholder={t('Select a segmentation')}
          data-cy={`segmentation-select-value${dataCyTypeSuffix}`}
        >
          <SegmentationLabel segmentation={segmentation} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {segmentations.map(seg => (
          <SelectItem
            key={seg.id}
            value={seg.id}
          >
            <SegmentationLabel segmentation={seg.segmentation} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Info component - for displaying the info tooltip
const SegmentationCollapsedInfo = () => {
  const { t } = useTranslation('SegmentationPanel');
  const { isTouch } = useResponsiveLayout();
  const { data, activeSegmentationId } = useSegmentationTableContext('SegmentationCollapsedInfo');

  const activeSegmentationObj = data.find(
    seg => seg.segmentation.segmentationId === activeSegmentationId
  );

  const info = activeSegmentationObj?.segmentation.cachedStats?.info;

  return (
    <Tooltip delayDuration={100}>
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
      <TooltipContent
        side="bottom"
        align="end"
      >
        {info}
      </TooltipContent>
    </Tooltip>
  );
};

// Content component - for the main collapsed view content
const SegmentationCollapsedContent = ({ children }: { children: React.ReactNode }) => {
  return <div className="collapsed-content min-h-0">{children}</div>;
};

// Main compound component
const SegmentationCollapsedRoot: React.FC<{ children?: React.ReactNode }> = ({
  children = null,
}) => {
  const { mode, data, segmentationRepresentationTypes, selectedSegmentationIdForType } =
    useSegmentationTableContext('SegmentationCollapsed');

  // Find the segmentations for the representation type for this collapsed view.
  const segmentations = data.filter(
    segmentation =>
      !segmentationRepresentationTypes ||
      segmentationRepresentationTypes.includes(segmentation.representation?.type)
  );

  // Check if we should render.
  if (mode !== 'collapsed' || !data || data.length === 0 || segmentations.length === 0) {
    return null;
  }

  // Find the selected segmentation info for the representation type, or default to the first one.
  const selectedSegmentationInfo =
    segmentations.find(
      segmentation => segmentation.segmentation.segmentationId === selectedSegmentationIdForType
    ) ?? segmentations[0];

  return (
    <div className="space-y-0">
      <PanelSection className="mb-0">
        <SegmentationExpandedProvider
          segmentation={selectedSegmentationInfo.segmentation}
          representation={selectedSegmentationInfo.representation}
          isActive={true}
          onSegmentationClick={() => {}} // No-op since it's already the active one
        >
          {children}
        </SegmentationExpandedProvider>
      </PanelSection>
    </div>
  );
};

// Add the subcomponents to the main component
const SegmentationCollapsed = Object.assign(SegmentationCollapsedRoot, {
  Header: SegmentationCollapsedHeader,
  DropdownMenu: SegmentationCollapsedDropdownMenu,
  Selector: SegmentationCollapsedSelector,
  Info: SegmentationCollapsedInfo,
  Content: SegmentationCollapsedContent,
});

// Export the component
export { SegmentationCollapsed };
