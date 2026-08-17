import classnames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { Icons } from '../Icons';
import { TooltipTrigger, TooltipContent, Tooltip } from '../Tooltip';
import { Separator } from '../Separator';
import { useTranslation } from 'react-i18next';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';

/**
 * SidePanel component properties.
 * Note that the component monitors changes to the various widths and border sizes and will resize dynamically
 * @property {boolean} isExpanded - boolean indicating if the side panel is expanded/open or collapsed
 * @property {number} expandedWidth - the width of this side panel when expanded not including any borders or margins
 * @property {number} collapsedWidth - the width of this side panel when collapsed not including any borders or margins
 * @property {number} expandedInsideBorderSize - the width of the space between the expanded side panel content and viewport grid
 * @property {number} collapsedInsideBorderSize - the width of the space between the collapsed side panel content and the viewport grid
 * @property {number} collapsedOutsideBorderSize - the width of the space between the collapsed side panel content and the edge of the browser window
 */
type SidePanelProps = {
  side: 'left' | 'right';
  className: string;
  activeTabIndex: number;
  onOpen: () => void;
  onClose: () => void;
  onActiveTabIndexChange: () => void;
  isExpanded: boolean;
  expandedWidth: number;
  collapsedWidth: number;
  expandedInsideBorderSize: number;
  collapsedInsideBorderSize: number;
  collapsedOutsideBorderSize: number;
  tabs: any;
};

type StyleMap = {
  open: {
    left: {
      marginLeft: string; // the space between the expanded/open left side panel and the browser window left edge
      marginRight: string; // the space between the expanded/open left side panel and the viewport grid
    };
    right: {
      marginLeft: string; // the space between the expanded/open right side panel and the viewport grid
      marginRight: string; // the space between the expanded/open right side panel and the browser window right edge
    };
  };
  closed: {
    left: {
      marginLeft: string; // the space between the collapsed/closed left panel and the browser window left edge
      marginRight: string; // the space between the collapsed/closed left panel and the viewport grid
      alignItems: 'flex-end'; // the flexbox layout align-items property
    };
    right: {
      marginLeft: string; // the space between the collapsed/closed right panel and the viewport grid
      marginRight: string; // the space between the collapsed/closed right panel and the browser window right edge
      alignItems: 'flex-start'; // the flexbox layout align-items property
    };
  };
};
const closeIconWidth = 30;
const gridHorizontalPadding = 10;
const tabSpacerWidth = 2;

const baseClasses =
  'bg-background border-background justify-start box-content relative z-10 flex min-h-0 flex-col overflow-hidden';

const openStateIconName = {
  left: 'SidePanelCloseLeft',
  right: 'SidePanelCloseRight',
};

const getTabWidth = (numTabs: number, isTouch: boolean) => {
  const width = numTabs < 3 ? 68 : 40;
  return isTouch ? Math.max(width, 44) : width;
};

const getGridWidth = (numTabs: number, gridAvailableWidth: number, isTouch: boolean) => {
  const spacersWidth = (numTabs - 1) * tabSpacerWidth;
  const tabsWidth = getTabWidth(numTabs, isTouch) * numTabs;

  if (gridAvailableWidth > tabsWidth + spacersWidth) {
    return tabsWidth + spacersWidth;
  }

  return gridAvailableWidth;
};

const getNumGridColumns = (numTabs: number, gridWidth: number, isTouch: boolean) => {
  if (numTabs === 1) {
    return 1;
  }

  // Start by calculating the number of tabs assuming each tab was accompanied by a spacer.
  const tabWidth = getTabWidth(numTabs, isTouch);
  const numTabsWithOneSpacerEach = Math.floor(gridWidth / (tabWidth + tabSpacerWidth));

  // But there is always one less spacer than tabs, so now check if an extra tab with one less spacer fits.
  if (
    (numTabsWithOneSpacerEach + 1) * tabWidth + numTabsWithOneSpacerEach * tabSpacerWidth <=
    gridWidth
  ) {
    return numTabsWithOneSpacerEach + 1;
  }

  return numTabsWithOneSpacerEach;
};

const getTabClassNames = (
  numColumns: number,
  numTabs: number,
  tabIndex: number,
  isActiveTab: boolean,
  isTabDisabled: boolean,
  isTouch: boolean
) =>
  classnames(
    'focus-visible:ring-ring mb-[2px] cursor-pointer bg-primary/10 text-foreground hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2',
    isTouch ? 'min-h-11 min-w-11' : 'h-[28px]',
    {
      'hover:text-primary': !isActiveTab && !isTabDisabled,
      'rounded-l': tabIndex % numColumns === 0,
      'rounded-r': (tabIndex + 1) % numColumns === 0 || tabIndex === numTabs - 1,
    }
  );

const getTabStyle = (numTabs: number, isTouch: boolean) => {
  return {
    width: `${getTabWidth(numTabs, isTouch)}px`,
  };
};

const getTabIconClassNames = (numTabs: number, isActiveTab: boolean) => {
  return classnames('h-full w-full flex items-center justify-center', {
    'bg-primary/20': isActiveTab,
    rounded: isActiveTab,
  });
};
const createStyleMap = (
  expandedWidth: number,
  expandedInsideBorderSize: number,
  collapsedWidth: number,
  collapsedInsideBorderSize: number,
  collapsedOutsideBorderSize: number
): StyleMap => {
  const collapsedHideWidth = expandedWidth - collapsedWidth - collapsedOutsideBorderSize;

  return {
    open: {
      left: { marginLeft: '0px', marginRight: `${expandedInsideBorderSize}px` },
      right: { marginLeft: `${expandedInsideBorderSize}px`, marginRight: '0px' },
    },
    closed: {
      left: {
        marginLeft: `-${collapsedHideWidth}px`,
        marginRight: `${collapsedInsideBorderSize}px`,
        alignItems: `flex-end`,
      },
      right: {
        marginLeft: `${collapsedInsideBorderSize}px`,
        marginRight: `-${collapsedHideWidth}px`,
        alignItems: `flex-start`,
      },
    },
  };
};

const getToolTipContent = (label: string, disabled: boolean) => {
  return (
    <>
      <div>{label}</div>
      {disabled && (
        <div className="text-foreground">{'Not available based on current context'}</div>
      )}
    </>
  );
};

const createBaseStyle = (expandedWidth: number) => {
  return {
    maxWidth: `${expandedWidth}px`,
    width: `${expandedWidth}px`,
    // To align the top of the side panel with the top of the viewport grid, use position relative and offset the
    // top by the same top offset as the viewport grid. Also adjust the height so that there is no overflow.
    position: 'relative',
    top: '0.2%',
    height: '99.8%',
  };
};

const SidePanel = ({
  side,
  className,
  activeTabIndex: activeTabIndexProp,
  isExpanded,
  tabs,
  onOpen,
  onClose,
  onActiveTabIndexChange,
  expandedWidth = 280,
  collapsedWidth = 25,
  expandedInsideBorderSize = 4,
  collapsedInsideBorderSize = 8,
  collapsedOutsideBorderSize = 4,
}: SidePanelProps) => {
  const { i18n } = useTranslation();
  const { isTouch } = useResponsiveLayout();
  // `side` is logical (panel registration). Physical slide margins and icons
  // must mirror in RTL or the collapsed tab ends up underneath the viewport.
  const visualSide =
    i18n.dir(i18n.language) === 'rtl' ? (side === 'left' ? 'right' : 'left') : side;
  const [panelOpen, setPanelOpen] = useState(isExpanded);
  const panelOpenRef = React.useRef(panelOpen);
  const [activeTabIndex, setActiveTabIndex] = useState(activeTabIndexProp ?? 0);

  const [styleMap, setStyleMap] = useState(
    createStyleMap(
      expandedWidth,
      expandedInsideBorderSize,
      collapsedWidth,
      collapsedInsideBorderSize,
      collapsedOutsideBorderSize
    )
  );

  const [baseStyle, setBaseStyle] = useState(createBaseStyle(expandedWidth));

  const [gridAvailableWidth, setGridAvailableWidth] = useState(
    expandedWidth - closeIconWidth - gridHorizontalPadding
  );

  const [gridWidth, setGridWidth] = useState(
    getGridWidth(tabs.length, gridAvailableWidth, isTouch)
  );
  const openStatus = panelOpen ? 'open' : 'closed';
  const style = Object.assign({}, styleMap[openStatus][visualSide], baseStyle);

  const updatePanelOpen = useCallback(
    (isOpen: boolean) => {
      if (isOpen === panelOpenRef.current) {
        return;
      }

      panelOpenRef.current = isOpen;
      setPanelOpen(isOpen);
      if (isOpen && onOpen) {
        onOpen();
      } else if (onClose && !isOpen) {
        onClose();
      }
    },
    [onOpen, onClose]
  );

  const updateActiveTabIndex = useCallback(
    (activeTabIndex: number, forceOpen: boolean = false) => {
      if (forceOpen) {
        updatePanelOpen(true);
      }

      setActiveTabIndex(activeTabIndex);

      if (onActiveTabIndexChange) {
        onActiveTabIndexChange({ activeTabIndex });
      }
    },
    [onActiveTabIndexChange, updatePanelOpen]
  );

  useEffect(() => {
    panelOpenRef.current = isExpanded;
    setPanelOpen(isExpanded);
  }, [isExpanded]);

  useEffect(() => {
    setStyleMap(
      createStyleMap(
        expandedWidth,
        expandedInsideBorderSize,
        collapsedWidth,
        collapsedInsideBorderSize,
        collapsedOutsideBorderSize
      )
    );
    setBaseStyle(createBaseStyle(expandedWidth));

    const gridAvailableWidth = expandedWidth - closeIconWidth - gridHorizontalPadding;
    setGridAvailableWidth(gridAvailableWidth);
    setGridWidth(getGridWidth(tabs.length, gridAvailableWidth, isTouch));
  }, [
    collapsedInsideBorderSize,
    collapsedWidth,
    expandedWidth,
    expandedInsideBorderSize,
    tabs.length,
    collapsedOutsideBorderSize,
    isTouch,
  ]);

  useEffect(() => {
    updateActiveTabIndex(activeTabIndexProp ?? 0);
  }, [activeTabIndexProp, updateActiveTabIndex]);

  const getCloseStateComponent = () => {
    const _childComponents = Array.isArray(tabs) ? tabs : [tabs];
    return (
      <>
        <button
          type="button"
          className={classnames(
            'bg-popover focus-visible:ring-ring flex w-full cursor-pointer items-center rounded-md border-0 p-0 focus-visible:outline-none focus-visible:ring-2',
            isTouch ? 'min-h-11' : 'h-[28px]',
            visualSide === 'left' ? 'justify-end pr-2' : 'justify-start pl-2'
          )}
          onClick={() => {
            updatePanelOpen(!panelOpen);
          }}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              updatePanelOpen(!panelOpen);
            }
          }}
          data-cy={`side-panel-header-${side}`}
          aria-label={tabs[0]?.label}
          aria-expanded={false}
        >
          <Icons.NavigationPanelReveal
            className={classnames('text-primary', visualSide === 'left' && 'rotate-180 transform')}
          />
        </button>
        <div className={classnames('mt-3 flex flex-col space-y-3')}>
          {_childComponents.map((childComponent, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  id={`${childComponent.name}-btn`}
                  data-cy={`${childComponent.name}-btn`}
                  className={classnames(
                    'text-primary focus-visible:ring-ring hover:cursor-pointer focus-visible:outline-none focus-visible:ring-2',
                    isTouch && 'min-h-11 min-w-11 flex items-center justify-center'
                  )}
                  aria-label={childComponent.label}
                  disabled={childComponent.disabled}
                  onClick={() => {
                    return childComponent.disabled ? null : updateActiveTabIndex(index, true);
                  }}
                >
                  {React.createElement(Icons[childComponent.iconName] || Icons.MissingIcon, {
                    className: classnames({
                      'text-primary': true,
                      'ohif-disabled': childComponent.disabled,
                    }),
                    style: {
                      width: '22px',
                      height: '22px',
                    },
                  })}
                </button>
              </TooltipTrigger>
              <TooltipContent side={visualSide === 'left' ? 'right' : 'left'}>
                <div
                  className={classnames(
                    'flex items-center',
                    visualSide === 'left' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {getToolTipContent(childComponent.label, childComponent.disabled)}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </>
    );
  };

  const getCloseIcon = () => {
    return (
      <button
        type="button"
        className={classnames(
          'focus-visible:ring-ring absolute flex cursor-pointer items-center justify-center border-0 p-0 focus-visible:outline-none focus-visible:ring-2',
          isTouch ? 'min-h-11 min-w-11' : 'h-[28px]',
          visualSide === 'left' ? 'right-0' : 'left-0'
        )}
        style={{ width: `${closeIconWidth}px` }}
        onClick={() => {
          updatePanelOpen(!panelOpen);
        }}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            updatePanelOpen(!panelOpen);
          }
        }}
        data-cy={`side-panel-header-${side}`}
        aria-label={tabs[0]?.label}
        aria-expanded={true}
      >
        {React.createElement(Icons[openStateIconName[visualSide]] || Icons.MissingIcon, {
          className: 'text-primary',
        })}
      </button>
    );
  };

  const getTabGridComponent = () => {
    const numCols = getNumGridColumns(tabs.length, gridWidth, isTouch);

    return (
      <>
        {getCloseIcon()}
        <div className={classnames('flex grow justify-center')}>
          <div className={classnames('bg-muted text-primary flex flex-wrap')}>
            {tabs.map((tab, tabIndex) => {
              const { disabled } = tab;
              return (
                <React.Fragment key={tabIndex}>
                  {tabIndex % numCols !== 0 && (
                    <div
                      className={classnames('flex h-[28px] w-[2px] items-center', tabSpacerWidth)}
                    >
                      <div className="bg-muted h-[20px] w-full"></div>
                    </div>
                  )}
                  <Tooltip key={tabIndex}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className={getTabClassNames(
                          numCols,
                          tabs.length,
                          tabIndex,
                          tabIndex === activeTabIndex,
                          disabled,
                          isTouch
                        )}
                        style={getTabStyle(tabs.length, isTouch)}
                        aria-label={tab.label}
                        aria-pressed={tabIndex === activeTabIndex}
                        disabled={disabled}
                        onClick={() => {
                          return disabled ? null : updateActiveTabIndex(tabIndex);
                        }}
                        data-cy={`${tab.name}-btn`}
                      >
                        <div
                          className={getTabIconClassNames(tabs.length, tabIndex === activeTabIndex)}
                        >
                          {React.createElement(Icons[tab.iconName] || Icons.MissingIcon, {
                            className: classnames({
                              'text-primary': true,
                              'ohif-disabled': disabled,
                            }),
                            style: {
                              width: '22px',
                              height: '22px',
                            },
                          })}
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {getToolTipContent(tab.label, disabled)}
                    </TooltipContent>
                  </Tooltip>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </>
    );
  };

  const getOneTabComponent = () => {
    return (
      <div
        className={classnames(
          'text-primary focus-visible:ring-ring flex grow select-none items-center justify-center self-center text-[13px] focus-visible:outline-none focus-visible:ring-2'
        )}
      >
        {getCloseIcon()}
        <button
          type="button"
          className={classnames(
            'focus-visible:ring-ring min-w-0 flex-1 border-0 focus-visible:outline-none focus-visible:ring-2',
            isTouch && 'min-h-11'
          )}
          data-cy={`${tabs[0].name}-btn`}
          aria-label={tabs[0].label}
          aria-pressed={panelOpen}
          onClick={() => updatePanelOpen(!panelOpen)}
        >
          <span>{tabs[0].label}</span>
        </button>
      </div>
    );
  };

  const getOpenStateComponent = () => {
    return (
      <>
        <div className="bg-muted flex h-[40px] flex-shrink-0 select-none rounded-t p-2">
          {tabs.length === 1 ? getOneTabComponent() : getTabGridComponent()}
        </div>
        <Separator
          orientation="horizontal"
          className="bg-background"
          thickness="2px"
        />
      </>
    );
  };

  return (
    <div
      className={classnames(className, baseClasses)}
      style={style}
    >
      {panelOpen ? (
        <>
          {getOpenStateComponent()}
          {tabs.map((tab, tabIndex) => {
            if (tabIndex === activeTabIndex) {
              return (
                <div
                  key={tabIndex}
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
                  data-cy={`side-panel-content-${side}`}
                >
                  <tab.content />
                </div>
              );
            }
            return null;
          })}
        </>
      ) : (
        <React.Fragment>{getCloseStateComponent()}</React.Fragment>
      )}
    </div>
  );
};

export { SidePanel };
