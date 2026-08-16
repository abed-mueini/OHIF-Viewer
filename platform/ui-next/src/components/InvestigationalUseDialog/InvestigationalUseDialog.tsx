import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Icons } from '@ohif/ui-next';
import { Button } from '../Button';
import { useTranslation } from 'react-i18next';

export enum showDialogOption {
  NeverShowDialog = 'never',
  AlwaysShowDialog = 'always',
  ShowOnceAndConfigure = 'configure',
}

const InvestigationalUseDialog = ({
  dialogConfiguration = {
    option: showDialogOption.AlwaysShowDialog,
  },
}) => {
  const { option, days } = dialogConfiguration;
  const [isHidden, setIsHidden] = useState(true);
  const { t } = useTranslation('InvestigationalUseDialog');

  useEffect(() => {
    const dialogLocalState = localStorage.getItem('investigationalUseDialog');
    const dialogSessionState = sessionStorage.getItem('investigationalUseDialog');

    switch (option) {
      case showDialogOption.NeverShowDialog:
        setIsHidden(true);
        break;
      case showDialogOption.AlwaysShowDialog:
        setIsHidden(!!dialogSessionState);
        break;
      case showDialogOption.ShowOnceAndConfigure:
        if (dialogLocalState) {
          const { expiryDate } = JSON.parse(dialogLocalState);
          const isExpired = new Date() > new Date(expiryDate);
          setIsHidden(!isExpired);
        } else {
          setIsHidden(false);
        }
        break;
      default:
        setIsHidden(true);
    }
  }, [option, days]);

  const handleConfirmAndHide = () => {
    const expiryDate = new Date();

    switch (option) {
      case showDialogOption.ShowOnceAndConfigure:
        expiryDate.setDate(expiryDate.getDate() + days);
        localStorage.setItem('investigationalUseDialog', JSON.stringify({ expiryDate }));
        break;
      case showDialogOption.AlwaysShowDialog:
        sessionStorage.setItem('investigationalUseDialog', 'hidden');
        break;
    }
    setIsHidden(true);
  };

  if (isHidden) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 flex justify-center px-2 sm:inset-x-6 sm:px-0">
      <div className="bg-popover border-input/70 sm:max-h-none flex max-h-[60vh] w-full max-w-5xl flex-col gap-3 overflow-y-auto rounded-lg border px-4 py-3 shadow-xl sm:flex-row sm:items-center sm:justify-between sm:overflow-visible sm:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Icons.InvestigationalUse className="h-12 w-12 shrink-0 sm:h-16 sm:w-16" />
          <div className="min-w-0 flex-1">
            <div className="text-highlight text-base font-medium leading-6 sm:text-[19px]">
              {t('OHIF Viewer is for investigational use only')}
            </div>
            <div className="text-foreground mt-0.5 text-sm leading-5">
              <span
                className="text-primary cursor-pointer"
                onClick={() => window.open('https://ohif.org/', '_blank')}
              >
                {t('Learn more about OHIF Viewer')}
              </span>
            </div>
          </div>
        </div>
        <Button
          onClick={handleConfirmAndHide}
          dataCY="confirm-and-hide-button"
          className="w-full shrink-0 sm:w-auto"
        >
          {t('Confirm and hide')}
        </Button>
      </div>
    </div>
  );
};

InvestigationalUseDialog.propTypes = {
  dialogConfiguration: PropTypes.shape({
    option: PropTypes.oneOf(Object.values(showDialogOption)).isRequired,
    days: PropTypes.number,
  }),
};

export default InvestigationalUseDialog;
