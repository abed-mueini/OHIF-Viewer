import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

import {
  InvestigationalUseDialog,
  useResponsiveLayout,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Icons,
} from '@ohif/ui-next';
import { HangingProtocolService, CommandsManager } from '@ohif/core';
import { useTranslation } from 'react-i18next';
import { useAppConfig } from '@state';
import ViewerHeader from './ViewerHeader';
import SidePanelWithServices from '../Components/SidePanelWithServices';
import { Onboarding, ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@ohif/ui-next';
import useResizablePanels from './ResizablePanelsHook';

const resizableHandleClassName = 'mt-[1px] bg-background';

function ViewerLayout({
  // From Extension Module Params
  extensionManager,
  servicesManager,
  hotkeysManager,
  commandsManager,
  // From Modes
  viewports,
  ViewportGridComp,
  leftPanelClosed = false,
  rightPanelClosed = false,
  leftPanelResizable = false,
  rightPanelResizable = false,
  leftPanelInitialExpandedWidth,
  rightPanelInitialExpandedWidth,
  leftPanelMinimumExpandedWidth,
  rightPanelMinimumExpandedWidth,
}: withAppTypes): React.FunctionComponent {
  const [appConfig] = useAppConfig();

  const { panelService, hangingProtocolService, customizationService } = servicesManager.services;
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(appConfig.showLoadingIndicator);

  const hasPanels = useCallback(
    (side): boolean => !!panelService.getPanels(side).length,
    [panelService]
  );

  const [hasRightPanels, setHasRightPanels] = useState(hasPanels('right'));
  const [hasLeftPanels, setHasLeftPanels] = useState(hasPanels('left'));
  const [leftPanelClosedState, setLeftPanelClosed] = useState(leftPanelClosed);
  const [rightPanelClosedState, setRightPanelClosed] = useState(rightPanelClosed);

  // US-RSP-203: below lg the side panels render as overlay Sheets instead of
  // squeezing (and breaking) the resizable panel group. Panels keep their
  // state because the same SidePanelWithServices instance is rendered — only
  // the container changes.
  const { matches, isServerRender } = useResponsiveLayout();
  const { i18n } = useTranslation();
  const isRtl = i18n.dir(i18n.language) === 'rtl';
  // The Viewer needs a wider canvas than the WorkList. Keep 1024px in the
  // tablet contract and switch to resizable side panels from xl (1280px).
  const isViewerDesktop = isServerRender || matches.xl;
  const [mobilePanelOpen, setMobilePanelOpen] = useState<'left' | 'right' | null>(null);
  // While the viewport is unmeasured, keep the desktop layout to avoid a
  // flash; once measured, mobile collapses panels into their overlay form.
  useEffect(() => {
    if (!isViewerDesktop) {
      setLeftPanelClosed(true);
      setRightPanelClosed(true);
    } else {
      setMobilePanelOpen(null);
    }
  }, [isViewerDesktop]);

  useEffect(() => {
    if (!mobilePanelOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobilePanelOpen(null);
      }
    };

    window.addEventListener('keydown', handleEscape, true);
    return () => window.removeEventListener('keydown', handleEscape, true);
  }, [mobilePanelOpen]);

  const [
    leftPanelProps,
    rightPanelProps,
    resizablePanelGroupProps,
    resizableLeftPanelProps,
    resizableViewportGridPanelProps,
    resizableRightPanelProps,
    onHandleDragging,
  ] = useResizablePanels(
    leftPanelClosed,
    setLeftPanelClosed,
    rightPanelClosed,
    setRightPanelClosed,
    hasLeftPanels,
    hasRightPanels,
    leftPanelInitialExpandedWidth,
    rightPanelInitialExpandedWidth,
    leftPanelMinimumExpandedWidth,
    rightPanelMinimumExpandedWidth
  );

  const handleMouseEnter = () => {
    (document.activeElement as HTMLElement)?.blur();
  };

  const LoadingIndicatorProgress = customizationService.getCustomization(
    'ui.loadingIndicatorProgress'
  );

  /**
   * Set body classes (tailwindcss) that don't allow vertical
   * or horizontal overflow (no scrolling). Also guarantee window
   * is sized to our viewport.
   */
  useEffect(() => {
    document.body.classList.add('bg-background');
    document.body.classList.add('overflow-hidden');

    return () => {
      document.body.classList.remove('bg-background');
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

  const getComponent = id => {
    const entry = extensionManager.getModuleEntry(id);

    if (!entry || !entry.component) {
      throw new Error(
        `${id} is not valid for an extension module or no component found from extension ${id}. Please verify your configuration or ensure that the extension is properly registered. It's also possible that your mode is utilizing a module from an extension that hasn't been included in its dependencies (add the extension to the "extensionDependencies" array in your mode's index.js file). Check the reference string to the extension in your Mode configuration`
      );
    }

    return { entry };
  };

  useEffect(() => {
    const { unsubscribe } = hangingProtocolService.subscribe(
      HangingProtocolService.EVENTS.PROTOCOL_CHANGED,

      // Todo: right now to set the loading indicator to false, we need to wait for the
      // hangingProtocolService to finish applying the viewport matching to each viewport,
      // however, this might not be the only approach to set the loading indicator to false. we need to explore this further.
      () => {
        setShowLoadingIndicator(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [hangingProtocolService]);

  const getViewportComponentData = viewportComponent => {
    const { entry } = getComponent(viewportComponent.namespace);

    return {
      component: entry.component,
      isReferenceViewable: entry.isReferenceViewable,
      displaySetsToDisplay: viewportComponent.displaySetsToDisplay,
    };
  };

  useEffect(() => {
    const { unsubscribe } = panelService.subscribe(
      panelService.EVENTS.PANELS_CHANGED,
      ({ options }) => {
        setHasLeftPanels(hasPanels('left'));
        setHasRightPanels(hasPanels('right'));
        if (options?.leftPanelClosed !== undefined) {
          setLeftPanelClosed(options.leftPanelClosed);
        }
        if (options?.rightPanelClosed !== undefined) {
          setRightPanelClosed(options.rightPanelClosed);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [panelService, hasPanels]);

  const viewportComponents = viewports.map(getViewportComponentData);

  // Mobile/tablet side panel overlays (US-RSP-203). The Sheet mounts the same
  // SidePanelWithServices the desktop layout uses (forced open, full height),
  // so panel content and state survive opening/closing.
  const renderMobilePanel = (side: 'left' | 'right') => (
    <Sheet
      open={mobilePanelOpen === side}
      onOpenChange={open => setMobilePanelOpen(open ? side : null)}
    >
      <SheetContent
        side={side === 'left' ? 'inline-start' : 'inline-end'}
        className="w-[min(100vw,22rem)] p-0"
        onEscapeKeyDown={event => {
          // Nested menus consume Escape first; only the unhandled key should
          // dismiss the surrounding mobile/tablet Sheet.
          if (event.defaultPrevented) {
            return;
          }
          event.preventDefault();
          setMobilePanelOpen(null);
        }}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{side === 'left' ? 'Study panels' : 'Tool panels'}</SheetTitle>
        </SheetHeader>
        <div className="flex h-full min-h-0 flex-col">
          <SidePanelWithServices
            {...(side === 'left' ? leftPanelProps : rightPanelProps)}
            side={side}
            isExpanded={true}
            servicesManager={servicesManager}
            onOpen={() => {}}
            // The Sheet owns its dismissal. Keep the panel mounted when its
            // internal tab state changes so segmentation actions cannot close
            // the entire mobile/tablet overlay.
            onClose={() => {}}
          />
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden">
      <ViewerHeader
        hotkeysManager={hotkeysManager}
        extensionManager={extensionManager}
        servicesManager={servicesManager}
        appConfig={appConfig}
      />
      <div className="bg-background relative flex min-h-0 w-full flex-1 flex-row flex-nowrap items-stretch overflow-hidden">
        <React.Fragment>
          {showLoadingIndicator && (
            <LoadingIndicatorProgress className="bg-background h-full w-full" />
          )}
          {/* Below lg (US-RSP-203): the desktop resizable panel group is
              replaced by the full-width viewport grid; side panels become
              overlay Sheets toggled by the buttons rendered in place of the
              collapsed desktop tabs. */}
          {!isViewerDesktop ? (
            <div className="relative flex h-full w-full flex-row overflow-hidden">
              {hasLeftPanels ? (
                <button
                  type="button"
                  data-cy="mobile-left-panel-open"
                  aria-label="Open study panels"
                  className="bg-popover text-primary hover:bg-primary/10 start-1 min-h-11 min-w-11 absolute top-2 z-10 flex cursor-pointer items-center justify-center rounded-md border shadow-sm"
                  onClick={() => setMobilePanelOpen('left')}
                >
                  <Icons.NavigationPanelReveal className={isRtl ? '' : 'rotate-180'} />
                </button>
              ) : null}
              <div
                className="bg-background relative flex h-full min-w-0 flex-1 items-center justify-center overflow-hidden"
                onMouseEnter={handleMouseEnter}
              >
                <ViewportGridComp
                  servicesManager={servicesManager}
                  viewportComponents={viewportComponents}
                  commandsManager={commandsManager}
                />
              </div>
              {hasRightPanels ? (
                <button
                  type="button"
                  data-cy="mobile-right-panel-open"
                  aria-label="Open tool panels"
                  className="bg-popover text-primary hover:bg-primary/10 end-1 min-h-11 min-w-11 absolute top-2 z-10 flex cursor-pointer items-center justify-center rounded-md border shadow-sm"
                  onClick={() => setMobilePanelOpen('right')}
                >
                  <Icons.NavigationPanelReveal className={isRtl ? 'rotate-180' : ''} />
                </button>
              ) : null}
              {hasLeftPanels ? renderMobilePanel('left') : null}
              {hasRightPanels ? renderMobilePanel('right') : null}
            </div>
          ) : (
            <ResizablePanelGroup {...resizablePanelGroupProps}>
              {/* LEFT SIDEPANELS */}
              {hasLeftPanels ? (
                <>
                  <ResizablePanel {...resizableLeftPanelProps}>
                    <SidePanelWithServices
                      side="left"
                      isExpanded={!leftPanelClosedState}
                      servicesManager={servicesManager}
                      {...leftPanelProps}
                    />
                  </ResizablePanel>
                  <ResizableHandle
                    onDragging={onHandleDragging}
                    disabled={!leftPanelResizable}
                    className={resizableHandleClassName}
                  />
                </>
              ) : null}
              {/* TOOLBAR + GRID */}
              <ResizablePanel {...resizableViewportGridPanelProps}>
                <div className="flex h-full flex-1 flex-col">
                  <div
                    className="bg-background relative flex h-full flex-1 items-center justify-center overflow-hidden"
                    onMouseEnter={handleMouseEnter}
                  >
                    <ViewportGridComp
                      servicesManager={servicesManager}
                      viewportComponents={viewportComponents}
                      commandsManager={commandsManager}
                    />
                  </div>
                </div>
              </ResizablePanel>
              {hasRightPanels ? (
                <>
                  <ResizableHandle
                    onDragging={onHandleDragging}
                    disabled={!rightPanelResizable}
                    className={resizableHandleClassName}
                  />
                  <ResizablePanel {...resizableRightPanelProps}>
                    <SidePanelWithServices
                      side="right"
                      isExpanded={!rightPanelClosedState}
                      servicesManager={servicesManager}
                      {...rightPanelProps}
                    />
                  </ResizablePanel>
                </>
              ) : null}
            </ResizablePanelGroup>
          )}
        </React.Fragment>
      </div>
      <Onboarding tours={customizationService.getCustomization('ohif.tours')} />
      <InvestigationalUseDialog dialogConfiguration={appConfig?.investigationalUseDialog} />
    </div>
  );
}

ViewerLayout.propTypes = {
  // From extension module params
  extensionManager: PropTypes.shape({
    getModuleEntry: PropTypes.func.isRequired,
  }).isRequired,
  commandsManager: PropTypes.instanceOf(CommandsManager),
  servicesManager: PropTypes.object.isRequired,
  // From modes
  leftPanels: PropTypes.array,
  rightPanels: PropTypes.array,
  leftPanelClosed: PropTypes.bool.isRequired,
  rightPanelClosed: PropTypes.bool.isRequired,
  /** Responsible for rendering our grid of viewports; provided by consuming application */
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
  viewports: PropTypes.array,
};

export default ViewerLayout;
