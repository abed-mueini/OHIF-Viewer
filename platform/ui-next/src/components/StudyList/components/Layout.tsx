import * as React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../../Resizable';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { Sheet, SheetContent } from '../../Sheet';
import { Table as StudyListTable, type TableProps as StudyListTableProps } from './Table';
import { WorkflowsProvider, type Mode } from './WorkflowsProvider';

type LayoutContextValue = {
  isPreviewOpen: boolean;
  openPreview: () => void;
  closePreview: () => void;
  defaultPreviewSizePercent: number;
  minPreviewSizePercent: number;
};

const LayoutContext = React.createContext<LayoutContextValue | undefined>(undefined);

export function useLayout() {
  const ctx = React.useContext(LayoutContext);
  if (!ctx) {
    throw new Error('useLayout must be used within <StudyList>');
  }
  return ctx;
}

export type LayoutProps = {
  isPreviewOpen: boolean;
  onIsPreviewOpenChange: (open: boolean) => void;
  defaultPreviewSizePercent: number;
  minPreviewSizePercent?: number;
  className?: string;
  children?: React.ReactNode;
  /** Array of loaded modes from appConfig */
  loadedModes?: Mode[];
  /** Optional data path prefix for routes (e.g., '/dicomweb') */
  dataPath?: string;
  /** Function to preserve query parameters when launching workflows */
  preserveQueryParameters: (query: URLSearchParams) => void;
};

function LayoutRoot({
  isPreviewOpen,
  onIsPreviewOpenChange,
  defaultPreviewSizePercent,
  minPreviewSizePercent = 15,
  className,
  loadedModes = [],
  preserveQueryParameters,
  dataPath,
  children,
}: LayoutProps) {
  let tableChild: React.ReactNode = null;
  let previewChild: React.ReactNode = null;

  React.Children.forEach(children, child => {
    if (React.isValidElement(child)) {
      const childType = child.type;

      if (childType === Table) {
        if (tableChild) {
          throw new Error('StudyList can only contain one Table component.');
        }
        tableChild = child;
      } else if (childType === Preview) {
        if (previewChild) {
          throw new Error('StudyList can only contain one Preview component.');
        }
        previewChild = child;
      } else {
        throw new Error('StudyList can only contain Table and Preview components.');
      }
    }
  });

  if (!tableChild) {
    throw new Error('StudyList must contain a Table component.');
  }

  const openPreview = React.useCallback(() => onIsPreviewOpenChange(true), [onIsPreviewOpenChange]);
  const closePreview = React.useCallback(
    () => onIsPreviewOpenChange(false),
    [onIsPreviewOpenChange]
  );

  // Keep the module-level ref used by the mobile preview Sheet in sync with
  // the current open/close callbacks (they can change identity on re-render).
  layoutActionsRef.current = { openPreview, closePreview };

  const value = React.useMemo<LayoutContextValue>(
    () => ({
      isPreviewOpen,
      openPreview,
      closePreview,
      defaultPreviewSizePercent,
      minPreviewSizePercent,
    }),
    [isPreviewOpen, openPreview, closePreview, defaultPreviewSizePercent, minPreviewSizePercent]
  );

  return (
    <WorkflowsProvider
      loadedModes={loadedModes}
      preserveQueryParameters={preserveQueryParameters}
      dataPath={dataPath}
    >
      <LayoutContext.Provider value={value}>
        <ResizablePanelGroup
          direction="horizontal"
          className={className ?? 'h-full w-full'}
        >
          {tableChild}
          {previewChild}
        </ResizablePanelGroup>
      </LayoutContext.Provider>
    </WorkflowsProvider>
  );
}

type TableProps = StudyListTableProps & {
  children?: React.ReactNode; // If provided, overrides table rendering (for custom content)
};

function Table({
  columns,
  data,
  title,
  initialVisibility,
  enforceSingleSelection,
  showColumnVisibility,
  tableClassName,
  onSelectionChange,
  onSortingChange,
  onPaginationChange,
  onFiltersChange,
  manualFiltering,
  sorting,
  pagination,
  filters,
  toolbarLeftComponent,
  toolbarRightComponent,
  toolbarRightActionsComponent,
  isLoading,
  loadingComponent,
  onStudyDoubleClick,
  children,
}: TableProps) {
  const { defaultPreviewSizePercent, isPreviewOpen } = useLayout();
  // US-RSP-104: below desktop the preview renders as an overlay Sheet, so the
  // table panel always takes the full width regardless of preview state.
  const { isDesktop } = useResponsiveLayout();

  // If children are provided, use them (for custom content)
  // Otherwise, render the StudyList.Table with the provided props
  const content = children ? (
    children
  ) : (
    <div className="flex h-full min-h-0 w-full flex-col px-3 pb-3 pt-0">
      <div className="min-h-0 flex-1">
        <div className="h-full rounded-md px-2 pb-2 pt-0">
          <StudyListTable
            columns={columns}
            data={data}
            title={title}
            initialVisibility={initialVisibility}
            enforceSingleSelection={enforceSingleSelection}
            showColumnVisibility={showColumnVisibility}
            tableClassName={tableClassName}
            onSelectionChange={onSelectionChange}
            toolbarLeftComponent={toolbarLeftComponent}
            toolbarRightComponent={toolbarRightComponent}
            toolbarRightActionsComponent={toolbarRightActionsComponent}
            onSortingChange={onSortingChange}
            onPaginationChange={onPaginationChange}
            onFiltersChange={onFiltersChange}
            manualFiltering={manualFiltering}
            sorting={sorting}
            pagination={pagination}
            filters={filters}
            isLoading={isLoading}
            loadingComponent={loadingComponent}
            onStudyDoubleClick={onStudyDoubleClick}
          />
        </div>
      </div>
    </div>
  );

  return (
    <ResizablePanel
      defaultSize={isPreviewOpen && isDesktop ? 100 - defaultPreviewSizePercent : 100}
    >
      {content}
    </ResizablePanel>
  );
}

function Preview({
  minSizePercent,
  children,
}: {
  minSizePercent?: number;
  children?: React.ReactNode;
}) {
  const { isPreviewOpen, defaultPreviewSizePercent, minPreviewSizePercent } = useLayout();
  // US-RSP-104: on phones/tablets the preview overlays the table as a
  // logical-side sheet instead of squeezing the resizable panel group.
  const { isDesktop } = useResponsiveLayout();

  if (!isDesktop) {
    return (
      <Sheet
        open={isPreviewOpen}
        onOpenChange={open => {
          const { openPreview, closePreview } = layoutActionsRef.current;
          open ? openPreview() : closePreview();
        }}
      >
        <SheetContent
          side="inline-end"
          className="w-[min(100vw,26rem)]"
        >
          {children}
        </SheetContent>
      </Sheet>
    );
  }

  if (!isPreviewOpen) {
    return null;
  }
  return (
    <>
      <ResizableHandle />
      <ResizablePanel
        defaultSize={defaultPreviewSizePercent}
        minSize={minSizePercent ?? minPreviewSizePercent}
      >
        {children}
      </ResizablePanel>
    </>
  );
}

// Preview is rendered inside LayoutRoot's tree; expose a stable ref so the
// mobile Sheet's onOpenChange can call the current open/close callbacks.
const layoutActionsRef: { current: { openPreview: () => void; closePreview: () => void } } = {
  current: { openPreview: () => {}, closePreview: () => {} },
};

LayoutRoot.displayName = 'Layout';

// Export for backward compatibility (will be removed from StudyList namespace)
export const Layout = Object.assign(LayoutRoot, {
  Table,
  Preview,
});
