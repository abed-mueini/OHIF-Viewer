import React from 'react';
import { Button, Icons, useResponsiveLayout } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';
import { useTranslation } from 'react-i18next';

export function StudyMeasurementsActions({ items, StudyInstanceUID, measurementFilter, actions }) {
  const { commandsManager } = useSystem();
  const { t } = useTranslation('MeasurementTable');
  const { isTouch } = useResponsiveLayout();
  const disabled = !items?.length;

  if (disabled) {
    return null;
  }

  return (
    <div className="bg-background min-h-9 flex w-full items-center rounded [padding-inline-end:0.125rem]">
      <div className="flex flex-wrap gap-1">
        <Button
          size="sm"
          variant="ghost"
          className={isTouch ? 'min-h-11' : undefined}
          dataCY="download-measurements-csv"
          onClick={() => {
            commandsManager.runCommand('downloadCSVMeasurementsReport', {
              StudyInstanceUID,
              measurementFilter,
            });
          }}
        >
          <Icons.Download className="h-5 w-5" />
          <span className="pl-1">CSV</span>
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className={isTouch ? 'min-h-11' : undefined}
          dataCY="create-sr-report"
          onClick={e => {
            e.stopPropagation();
            if (actions?.createSR) {
              actions.createSR({ StudyInstanceUID, measurementFilter });
              return;
            }
            commandsManager.run('promptSaveReport', {
              StudyInstanceUID,
              measurementFilter,
            });
          }}
        >
          <Icons.Add />
          {t('Create SR')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={isTouch ? 'min-h-11' : undefined}
          dataCY="delete-measurements"
          onClick={e => {
            e.stopPropagation();
            if (actions?.onDelete) {
              actions.onDelete();
              return;
            }
            commandsManager.runCommand('clearMeasurements', {
              measurementFilter,
            });
          }}
        >
          <Icons.Delete />
          {t('Delete')}
        </Button>
      </div>
    </div>
  );
}

export default StudyMeasurementsActions;
