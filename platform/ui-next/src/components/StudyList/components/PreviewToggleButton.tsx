import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../Button';
import { Icons } from '../../Icons';
import { useLayout } from './Layout';

type PreviewToggleButtonProps = React.HTMLAttributes<HTMLButtonElement> & {
  'aria-label'?: string;
  shouldShow: boolean;
  onClick: () => void;
  defaultAriaLabel: string;
  isRtl: boolean;
};

function PreviewToggleButton({
  className,
  'aria-label': ariaLabel,
  shouldShow,
  onClick,
  defaultAriaLabel,
  isRtl,
}: PreviewToggleButtonProps) {
  if (!shouldShow) {
    return null;
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={ariaLabel ?? defaultAriaLabel}
      onClick={onClick}
      className={className}
    >
      <Icons.PanelRight
        aria-hidden="true"
        className={`text-primary h-4 w-4 ${isRtl ? 'rotate-180' : ''}`}
      />
    </Button>
  );
}

export function OpenPreviewButton({
  className,
  'aria-label': ariaLabel,
}: React.HTMLAttributes<HTMLButtonElement> & { 'aria-label'?: string }) {
  const { t, i18n } = useTranslation('StudyList');
  const { isPreviewOpen, openPreview } = useLayout();
  return (
    <PreviewToggleButton
      className={className}
      aria-label={ariaLabel}
      shouldShow={!isPreviewOpen}
      onClick={openPreview}
      defaultAriaLabel={t('Open preview')}
      isRtl={i18n.dir(i18n.language) === 'rtl'}
    />
  );
}

export function ClosePreviewButton({
  className,
  'aria-label': ariaLabel,
}: React.HTMLAttributes<HTMLButtonElement> & { 'aria-label'?: string }) {
  const { t, i18n } = useTranslation('StudyList');
  const { isPreviewOpen, closePreview } = useLayout();
  return (
    <PreviewToggleButton
      className={className}
      aria-label={ariaLabel}
      shouldShow={isPreviewOpen}
      onClick={closePreview}
      defaultAriaLabel={t('Close preview')}
      isRtl={i18n.dir(i18n.language) === 'rtl'}
    />
  );
}
