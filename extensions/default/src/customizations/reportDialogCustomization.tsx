import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  InputDialog,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ohif/ui-next';
import { useSystem } from '@ohif/core';

type DataSource = {
  value: string;
  label: string;
  placeHolder: string;
};

/** Radix Select item value for "Create new series" (state remains null). */
const NEW_SERIES_SELECT_VALUE = '__new_series_id__';

type SeriesOption = {
  optionKey: string;
  selectValue: string;
  value: string | null;
  seriesNumber: number;
  description: string | null;
  label: string;
};

type ReportDialogProps = {
  dataSources?: DataSource[];
  modality?: string;
  predecessorImageId?: string;
  minSeriesNumber?: number;
  hide: () => void;
  onSave: (data: {
    reportName: string;
    dataSource: string | null;
    series: string | null;
    priorSeriesNumber: number;
  }) => void;
  onCancel: () => void;
  enableDownload?: boolean;
};

function ReportDialog({
  dataSources,
  modality = 'SR',
  predecessorImageId,
  minSeriesNumber = 3000,
  hide,
  onSave,
  onCancel,
  enableDownload = false,
}: ReportDialogProps) {
  const { t } = useTranslation(['Common', 'Buttons']);
  const { servicesManager } = useSystem();
  const actionTakenRef = useRef(false);
  const reportNameInputRef = useRef<HTMLInputElement>(null);
  const [selectedDataSource, setSelectedDataSource] = useState<string | null>(
    dataSources?.[0]?.value ?? null
  );
  const { displaySetService } = servicesManager.services;

  const [selectedSeries, setSelectedSeries] = useState<string | null>(predecessorImageId || null);
  const [reportName, setReportName] = useState('');
  const [reportNameError, setReportNameError] = useState('');

  const seriesOptions = useMemo((): SeriesOption[] => {
    const displaySetsMap = displaySetService.getDisplaySetCache();
    const displaySets = Array.from(displaySetsMap.values());
    const options = displaySets
      .filter(ds => ds.Modality === modality)
      .map(ds => {
        const value = ds.predecessorImageId || ds.SeriesInstanceUID;
        const selectValue = value || ds.displaySetInstanceUID;
        return {
          optionKey: `series-${ds.displaySetInstanceUID}`,
          selectValue,
          value: value || null,
          seriesNumber: isFinite(ds.SeriesNumber) ? ds.SeriesNumber : minSeriesNumber,
          description: ds.SeriesDescription,
          label: `${ds.SeriesDescription} ${ds.SeriesDate}/${ds.SeriesTime} ${ds.SeriesNumber}`,
        };
      })
      .filter(option => option.selectValue && option.selectValue !== NEW_SERIES_SELECT_VALUE);

    return [
      {
        optionKey: NEW_SERIES_SELECT_VALUE,
        selectValue: NEW_SERIES_SELECT_VALUE,
        value: null,
        description: null,
        seriesNumber: minSeriesNumber,
        label: t('Create new series'),
      },
      ...options,
    ];
  }, [displaySetService, modality, minSeriesNumber, t]);

  const handleSeriesChange = useCallback(
    (selectValue: string) => {
      const option = seriesOptions.find(o => o.selectValue === selectValue);
      setSelectedSeries(
        selectValue === NEW_SERIES_SELECT_VALUE ? null : (option?.value ?? selectValue)
      );
    },
    [seriesOptions]
  );

  useEffect(() => {
    const seriesOption = seriesOptions.find(s => s.value === selectedSeries);
    const newReportName =
      selectedSeries && seriesOption?.description ? seriesOption.description : '';
    setReportName(newReportName);
    setReportNameError('');
  }, [selectedSeries, seriesOptions]);

  const handleSave = useCallback(
    (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      if (!reportName.trim()) {
        setReportNameError(t('Report name is required'));
        reportNameInputRef.current?.focus();
        return;
      }

      actionTakenRef.current = true;
      onSave({
        reportName: reportName.trim(),
        dataSource: selectedDataSource,
        priorSeriesNumber: Math.max(...seriesOptions.map(it => it.seriesNumber)),
        series: selectedSeries,
      });
      hide();
    },
    [selectedDataSource, selectedSeries, reportName, hide, onSave, seriesOptions, t]
  );

  const handleCancel = useCallback(() => {
    actionTakenRef.current = true;
    onCancel();
    hide();
  }, [onCancel, hide]);

  const handleDownload = useCallback(() => {
    actionTakenRef.current = true;
    onSave({
      reportName,
      dataSource: 'download',
      priorSeriesNumber: Math.max(...seriesOptions.map(it => it.seriesNumber)),
      series: selectedSeries,
    });
    hide();
  }, [selectedDataSource, selectedSeries, reportName, hide, onSave]);

  // Handles the close dialog button/external close as a cancel
  useEffect(() => {
    return () => {
      if (!actionTakenRef.current) {
        onCancel();
      }
    };
  }, [onCancel]);

  const showDataSourceSelect = (dataSources?.length ?? 0) > 1;
  const showDownloadButton = enableDownload;
  const selectedSeriesSelectValue =
    selectedSeries == null
      ? NEW_SERIES_SELECT_VALUE
      : (seriesOptions.find(o => o.value === selectedSeries)?.selectValue ?? selectedSeries);

  return (
    <form
      className="text-foreground flex max-h-[calc(100dvh-7rem)] w-full min-w-0 max-w-md flex-col"
      data-cy="report-dialog-form"
      noValidate
      onSubmit={handleSave}
    >
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain [padding-inline-end:0.25rem]"
        data-cy="report-dialog-body"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {showDataSourceSelect && (
            <div className="min-w-0">
              <Label
                className="mb-1 block text-base"
                htmlFor="report-data-source"
              >
                {t('Data source')}
              </Label>
              <Select
                value={selectedDataSource}
                onValueChange={setSelectedDataSource}
              >
                <SelectTrigger
                  id="report-data-source"
                  data-cy="report-data-source"
                  className="w-full"
                >
                  <SelectValue placeholder={t('Select a data source')} />
                </SelectTrigger>
                <SelectContent>
                  {dataSources?.map(source => (
                    <SelectItem
                      key={source.value}
                      value={source.value}
                    >
                      <bdi dir="auto">{source.label}</bdi>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="min-w-0">
            <Label
              className="mb-1 block text-base"
              htmlFor="report-series"
            >
              {t('Series')}
            </Label>
            <Select
              value={selectedSeriesSelectValue}
              onValueChange={handleSeriesChange}
            >
              <SelectTrigger
                id="report-series"
                data-cy="report-series"
                className="w-full"
              >
                <SelectValue placeholder={t('Select a series')} />
              </SelectTrigger>
              <SelectContent>
                {seriesOptions.map(series => (
                  <SelectItem
                    key={series.optionKey}
                    value={series.selectValue}
                  >
                    <bdi dir="auto">{series.label}</bdi>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <InputDialog
            value={reportName}
            onChange={value => {
              setReportName(value);
              if (reportNameError) {
                setReportNameError('');
              }
            }}
            className="min-w-0"
          >
            <InputDialog.Field className="mb-0 gap-1">
              <InputDialog.Label htmlFor="report-name">{t('Report name')}</InputDialog.Label>
              <InputDialog.Input
                ref={reportNameInputRef}
                id="report-name"
                placeholder={t('Report name')}
                disabled={!!selectedSeries}
                aria-invalid={!!reportNameError}
                aria-describedby={reportNameError ? 'report-name-error' : undefined}
              />
              {reportNameError && (
                <div
                  id="report-name-error"
                  role="alert"
                  data-cy="report-name-error"
                  className="text-destructive text-sm"
                >
                  {reportNameError}
                </div>
              )}
            </InputDialog.Field>
          </InputDialog>
        </div>
      </div>

      <div
        className="bg-card sticky bottom-0 z-10 mt-4 grid flex-shrink-0 grid-cols-2 gap-2 border-t pt-3 [padding-bottom:max(0.25rem,env(safe-area-inset-bottom))] sm:flex sm:justify-end"
        data-cy="report-dialog-footer"
      >
        {showDownloadButton && (
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            dataCY="report-download"
            onClick={handleDownload}
          >
            {t('Download', { ns: 'Buttons' })}
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          className="min-h-11"
          dataCY="report-cancel"
          onClick={handleCancel}
        >
          {t('Cancel')}
        </Button>
        <Button
          type="submit"
          className="min-h-11"
          dataCY="report-save"
        >
          {t('Save')}
        </Button>
      </div>
    </form>
  );
}

export { ReportDialog };
export default {
  'ohif.createReportDialog': ReportDialog,
};
