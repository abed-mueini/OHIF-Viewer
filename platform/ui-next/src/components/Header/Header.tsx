import React, { ReactNode } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Icons,
  Button,
  ToolButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '../';
import { IconPresentationProvider } from '@ohif/ui-next';

import NavBar from '../NavBar';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';

// Todo: we should move this component to composition and remove props base

interface HeaderProps {
  children?: ReactNode;
  menuOptions: Array<{
    title: string;
    icon?: string;
    onClick: () => void;
  }>;
  isReturnEnabled?: boolean;
  onClickReturnButton?: () => void;
  isSticky?: boolean;
  WhiteLabeling?: {
    createLogoComponentFn?: (React: any, props: any) => ReactNode;
  };
  PatientInfo?: ReactNode;
  Secondary?: ReactNode;
  UndoRedo?: ReactNode;
}

function Header({
  children,
  menuOptions,
  isReturnEnabled = true,
  onClickReturnButton,
  isSticky = false,
  WhiteLabeling,
  PatientInfo,
  UndoRedo,
  Secondary,
  ...props
}: HeaderProps): ReactNode {
  const { t, i18n } = useTranslation('Header');
  const isRtl = i18n.dir(i18n.language) === 'rtl';
  const { matches, isServerRender } = useResponsiveLayout();
  const showInlineSecondary = isServerRender || matches.xl;
  const onClickReturn = () => {
    if (isReturnEnabled && onClickReturnButton) {
      onClickReturnButton();
    }
  };

  return (
    <IconPresentationProvider
      size="large"
      IconContainer={ToolButton}
    >
      <NavBar
        isSticky={isSticky}
        {...props}
      >
        {/* Responsive header (US-RSP-201): on <lg widths the absolutely
            positioned columns collapse onto a wrapping flex row so logo,
            patient info and settings never overlap. Absolute positioning is
            restored from lg upwards. */}
        <div className="relative flex min-h-[48px] flex-wrap items-center gap-x-2 gap-y-1 lg:flex-nowrap lg:items-center">
          <div
            className={classNames(
              'flex min-w-0 items-center lg:absolute lg:top-1/2 lg:-translate-y-1/2 lg:items-center',
              isRtl ? 'lg:right-0' : 'lg:left-0'
            )}
          >
            <button
              type="button"
              className={classNames(
                'min-h-11 min-w-11 focus-visible:ring-ring inline-flex items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2',
                isReturnEnabled && 'cursor-pointer'
              )}
              style={{ marginInlineEnd: '0.75rem' }}
              onClick={onClickReturn}
              data-cy="return-to-work-list"
              aria-label={t('Study list')}
              disabled={!isReturnEnabled}
            >
              {isReturnEnabled && (
                <Icons.ArrowLeft className={`text-primary h-7 w-7 ${isRtl ? 'rotate-180' : ''}`} />
              )}
              <div className="hidden shrink-0 sm:block">
                {WhiteLabeling?.createLogoComponentFn?.(React, props) || (
                  <Icons.OHIFLogo className="text-foreground" />
                )}
              </div>
            </button>
          </div>
          {Secondary && (
            <div
              className={classNames(
                showInlineSecondary
                  ? 'hidden min-w-0 xl:absolute xl:top-1/2 xl:block xl:h-8 xl:-translate-y-1/2'
                  : 'min-w-11 flex items-center',
                isRtl ? 'xl:right-[250px]' : 'xl:left-[250px]'
              )}
            >
              {showInlineSecondary ? (
                Secondary
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-primary hover:bg-muted min-h-11 min-w-11"
                      dataCY="viewer-secondary-tools"
                      aria-label={t('Options')}
                    >
                      <Icons.More />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="bottom"
                    align={isRtl ? 'end' : 'start'}
                    className="w-auto max-w-[calc(100vw-1.5rem)] p-2"
                  >
                    <div className="flex max-h-[60dvh] flex-wrap gap-1 overflow-y-auto">
                      {Secondary}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          )}
          <div className="order-last flex w-full min-w-0 items-center justify-center lg:absolute lg:left-1/2 lg:top-1/2 lg:order-none lg:w-auto lg:-translate-x-1/2 lg:-translate-y-1/2 lg:transform">
            <div className="flex min-w-0 max-w-full items-center justify-center gap-2">
              {children}
            </div>
          </div>
          <div
            className={classNames(
              'flex min-w-0 select-none items-center lg:absolute lg:top-1/2 lg:-translate-y-1/2 lg:items-center',
              isRtl ? 'lg:left-0' : 'lg:right-0'
            )}
          >
            {UndoRedo}
            <div className="border-muted mx-1.5 hidden h-[25px] border-r lg:block"></div>
            {PatientInfo}
            <div className="border-muted mx-1.5 hidden h-[25px] border-r lg:block"></div>
            <div className="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary hover:bg-muted min-h-11 min-w-11 mt-2"
                    dataCY="header-options"
                    aria-label={t('Options')}
                  >
                    <Icons.GearSettings />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {menuOptions.map((option, index) => {
                    const IconComponent = option.icon
                      ? Icons[option.icon as keyof typeof Icons]
                      : null;
                    return (
                      <DropdownMenuItem
                        key={index}
                        onSelect={option.onClick}
                        className="flex items-center gap-2 py-2"
                      >
                        {IconComponent && (
                          <span className="flex h-4 w-4 items-center justify-center">
                            <Icons.ByName name={option.icon} />
                          </span>
                        )}
                        <span className="flex-1">{option.title}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </NavBar>
    </IconPresentationProvider>
  );
}

export default Header;
