import * as React from 'react';
import { useTranslation } from 'react-i18next';
import type { Column } from '@tanstack/react-table';
import { Button } from '../Button';
import { Icons } from '../Icons';
import type { ColumnMeta } from './types';

export function ColumnHeader<TData, TValue>({ column }: { column: Column<TData, TValue> }) {
  const { t: tStudyList } = useTranslation('StudyList');
  const { t: tDataTable } = useTranslation('DataTable');
  const meta = (column.columnDef.meta as ColumnMeta | undefined) ?? undefined;
  const label = meta?.label ?? column.id;
  const translatedLabel = tStudyList(label, { defaultValue: label });

  // Use headerContent if provided, otherwise use label
  const content = meta?.headerContent ?? translatedLabel;
  const align = meta?.align ?? 'left';
  const canSort = column.getCanSort();
  const sorted = column.getIsSorted() as false | 'asc' | 'desc';
  const justify =
    align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';

  const SortIcon =
    sorted === 'asc'
      ? Icons.SortingNewAscending
      : sorted === 'desc'
        ? Icons.SortingNewDescending
        : Icons.SortingNew;

  return (
    <div className={`flex w-full items-center gap-1 ${justify}`}>
      {typeof content === 'string' ? <span>{content}</span> : content}
      {canSort && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(sorted === 'asc')}
          aria-label={tDataTable('Sort {{label}}', { label: translatedLabel })}
          className="px-1"
        >
          <SortIcon
            className="h-4 w-2.5"
            aria-hidden="true"
          />
        </Button>
      )}
    </div>
  );
}
