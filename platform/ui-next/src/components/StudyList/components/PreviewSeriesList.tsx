import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../Table';
import { Icons } from '../../Icons';

type Series = {
  seriesInstanceUid?: string;
  SeriesInstanceUID?: string;
  modality?: string;
  Modality?: string;
  description?: string;
  SeriesDescription?: string;
  seriesNumber?: number | string;
  SeriesNumber?: number | string;
  numSeriesInstances?: number;
  numInstances?: number;
};

type PreviewSeriesListProps = {
  series: Series[];
  onSeriesClick?: (series: Series) => void;
};

export function PreviewSeriesList({ series, onSeriesClick }: PreviewSeriesListProps) {
  const { t } = useTranslation('StudyList');

  return (
    <div className="w-full px-2">
      <Table noScroll>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-base font-normal [padding-inline-start:0]">
              <span className="text-foreground">{t('Modality')}</span>
              <span className="text-muted-foreground"> / {t('Series')}</span>
            </TableHead>
            <TableHead className="text-foreground w-8 text-base font-normal [padding-inline-end:0] [text-align:end]">
              <Icons.Series
                className="h-4 w-4 [margin-inline-start:auto]"
                aria-hidden="true"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {series.map((s, idx) => {
            const seriesUID = s.seriesInstanceUid || s.SeriesInstanceUID || String(idx);
            const modality = String(s.modality || s.Modality || '').toUpperCase();
            const description = s.description || s.SeriesDescription || '';
            const numInstances = s.numSeriesInstances ?? s.numInstances ?? 0;

            return (
              <TableRow
                key={seriesUID}
                className="hover:text-muted-foreground cursor-default hover:bg-transparent"
              >
                <TableCell className="text-base [padding-inline-start:0]">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-normal">{modality}</span>
                    <span className="font-normal">{description}</span>
                  </div>
                </TableCell>
                <TableCell className="w-8 text-base [padding-inline-end:0] [text-align:end]">
                  {numInstances}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
