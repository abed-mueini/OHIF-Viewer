import React, { type ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable, useDataTable } from '../../DataTable';
import type { DataTableProps } from '../../DataTable/DataTable';
import { Button } from '../../Button';
import { DatePickerWithRange } from '../../DateRange';
import { InputMultiSelect } from '../../InputMultiSelect';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '../../Sheet';
import { Icons } from '../../Icons';
import type { StudyDateRangeFilter, StudyRow } from '../types/types';
import { tokenizeModalities } from '../utils/tokenizeModalities';
import { useWorkflows, type Workflow } from './WorkflowsProvider';
import { COLUMN_IDS } from '../columns/defaultColumns';

/**
 * Replaces the built-in double-click action (launch the default workflow,
 * falling back to the first applicable one). The row is selected before this
 * is called. `workflows` are the workflows applicable to the study, in menu
 * order; `defaultWorkflow` is the user's default when it applies to the study.
 */
export type OnStudyDoubleClick = (
  study: StudyRow,
  context: { defaultWorkflow?: Workflow; workflows: Workflow[] }
) => void;

export type TableProps = Omit<DataTableProps<StudyRow>, 'children' | 'getRowId'> & {
  title?: ReactNode;
  showColumnVisibility?: boolean;
  tableClassName?: string;
  toolbarLeftComponent?: ReactNode;
  toolbarRightActionsComponent?: ReactNode;
  toolbarRightComponent?: ReactNode;
  isLoading?: boolean;
  loadingComponent?: ReactNode;
  onStudyDoubleClick?: OnStudyDoubleClick;
};

export function Table({
  columns,
  data,
  title,
  initialVisibility = {},
  sorting,
  pagination,
  filters,
  onSortingChange,
  onPaginationChange,
  onFiltersChange,
  enforceSingleSelection = true,
  showColumnVisibility = true,
  tableClassName,
  onSelectionChange,
  toolbarLeftComponent,
  toolbarRightActionsComponent,
  toolbarRightComponent,
  isLoading,
  loadingComponent,
  manualFiltering,
  onStudyDoubleClick,
}: TableProps) {
  return (
    <DataTable<StudyRow>
      data={data}
      columns={columns}
      getRowId={row => row.studyInstanceUid}
      initialVisibility={initialVisibility}
      sorting={sorting}
      pagination={pagination}
      filters={filters}
      onSortingChange={onSortingChange}
      onPaginationChange={onPaginationChange}
      onFiltersChange={onFiltersChange}
      manualFiltering={manualFiltering}
      enforceSingleSelection={enforceSingleSelection}
      onSelectionChange={onSelectionChange}
    >
      <TableContent
        title={title}
        showColumnVisibility={showColumnVisibility}
        tableClassName={tableClassName}
        toolbarLeftComponent={toolbarLeftComponent}
        toolbarRightActionsComponent={toolbarRightActionsComponent}
        toolbarRightComponent={toolbarRightComponent}
        isLoading={isLoading}
        loadingComponent={loadingComponent}
        onStudyDoubleClick={onStudyDoubleClick}
      />
    </DataTable>
  );
}

function TableContent({
  title,
  showColumnVisibility,
  tableClassName,
  toolbarLeftComponent,
  toolbarRightActionsComponent,
  toolbarRightComponent,
  isLoading,
  loadingComponent,
  onStudyDoubleClick,
}: {
  title?: ReactNode;
  showColumnVisibility?: boolean;
  tableClassName?: string;
  toolbarLeftComponent?: ReactNode;
  toolbarRightActionsComponent?: ReactNode;
  toolbarRightComponent?: ReactNode;
  isLoading?: boolean;
  loadingComponent?: ReactNode;
  onStudyDoubleClick?: TableProps['onStudyDoubleClick'];
}) {
  const { t } = useTranslation('StudyList');
  const { table } = useDataTable<StudyRow>();
  // Mobile filter sheet state (US-RSP-103): below the md breakpoint the
  // in-table filter row is replaced by a "Filters" trigger opening a sheet.
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const modalityOptions = useMemo(() => {
    const rows = (table.options?.data as StudyRow[]) ?? [];
    // Build a flat list of modality tokens across all rows.
    // tokenizeModalities uppercases and splits on whitespace/slash/comma to produce unique modality codes for filtering.
    const tokens = rows.flatMap(r => tokenizeModalities(String(r.modalities ?? '')));
    return Array.from(new Set(tokens)).sort();
  }, [table.options?.data]);
  // Access workflow provider for default workflow + launch
  const { getDefaultWorkflowForStudy, getWorkflowsForStudy } = useWorkflows();

  const activeFilterCount = table.getState().columnFilters.filter(f => {
    if (Array.isArray(f.value)) {
      return f.value.length > 0;
    }
    if (f.value && typeof f.value === 'object') {
      return Object.keys(f.value as object).length > 0;
    }
    return f.value !== undefined && f.value !== '';
  }).length;

  const renderFilterCell = ({
    columnId,
    value,
    setValue,
  }: {
    columnId: string;
    value: unknown;
    setValue: (v: unknown) => void;
  }) => {
    if (columnId === COLUMN_IDS.ACTIONS) {
      return (
        <div className="text-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.setColumnFilters([])}
            aria-label={t('Reset filters')}
          >
            {t('Reset')}
          </Button>
        </div>
      );
    }
    if (columnId === COLUMN_IDS.STUDY_DATE_TIME) {
      const dateRange = value && typeof value === 'object' ? (value as StudyDateRangeFilter) : {};
      const startDate = dateRange.startDate ?? '';
      const endDate = dateRange.endDate ?? '';

      return (
        <DatePickerWithRange
          id={COLUMN_IDS.STUDY_DATE_TIME}
          startDate={startDate}
          endDate={endDate}
          onChange={next => {
            const normalized = {
              ...(next.startDate ? { startDate: next.startDate } : {}),
              ...(next.endDate ? { endDate: next.endDate } : {}),
            };
            setValue(Object.keys(normalized).length > 0 ? normalized : undefined);
          }}
        />
      );
    }
    if (columnId === COLUMN_IDS.MODALITIES) {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <InputMultiSelect
          options={modalityOptions}
          value={selected}
          onChange={next => setValue(next)}
        >
          <InputMultiSelect.Field>
            <InputMultiSelect.Summary />
            <InputMultiSelect.Input
              ariaLabel={t('Filter Modalities')}
              placeholder=""
            />
          </InputMultiSelect.Field>
          <InputMultiSelect.Content
            fitToContent
            maxWidth={185}
          >
            <InputMultiSelect.Options />
          </InputMultiSelect.Content>
        </InputMultiSelect>
      );
    }
    // Return null/undefined to use default rendering for other columns
    return null;
  };

  // Which columns get a filter control in the mobile sheet: the visible,
  // filterable text/date/modality columns.
  const sheetFilterColumns = table
    .getVisibleLeafColumns()
    .filter(col => col.getCanFilter())
    .map(col => ({ col, id: col.id }));

  return (
    <div className="flex h-full flex-col">
      {(showColumnVisibility || title) && (
        <DataTable.Toolbar>
          <div className="min-w-0 justify-self-start overflow-hidden">{toolbarLeftComponent}</div>
          {title ? <DataTable.Title>{title}</DataTable.Title> : null}
          <div className="flex min-w-0 items-center justify-self-end">
            {/* Mobile filter trigger (US-RSP-103) — replaces the filter row
                below the md breakpoint. Kept next to the other actions so the
                primary toolbar ordering is untouched on desktop. */}
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 md:hidden"
              aria-label={t('Filters')}
              onClick={() => setIsFilterSheetOpen(true)}
            >
              <Icons.FilterSettings className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="bg-primary text-primary-foreground min-w-4 inline-flex h-4 items-center justify-center rounded-full px-1 text-[10px] leading-none">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            {toolbarRightActionsComponent}
            {toolbarRightActionsComponent && <div className="bg-input mx-2 h-4 w-px" />}
            {/* Pagination appears to the left of the "View" button */}
            <div className="worklist-toolbar-actions flex min-w-0 items-center">
              <DataTable.Pagination<StudyRow> />
              {showColumnVisibility && <DataTable.ViewOptions<StudyRow> />}
              {toolbarRightComponent}
            </div>
          </div>
        </DataTable.Toolbar>
      )}
      <DataTable.Table<StudyRow> tableClassName={tableClassName}>
        <DataTable.Header<StudyRow> />
        {/* The in-table filter row is hidden below md; the mobile sheet
            renders its own filter controls instead. */}
        <div className="worklist-filter-row max-md:hidden">
          <DataTable.FilterRow<StudyRow>
            excludeColumnIds={[COLUMN_IDS.INSTANCES]}
            renderFilterCell={renderFilterCell}
          />
        </div>
        <DataTable.Body<StudyRow>
          emptyMessage={t('No studies available')}
          isLoading={isLoading}
          loadingComponent={loadingComponent}
          rowProps={{
            className: 'group cursor-pointer',
            onClick: row => {
              const original = row.original as StudyRow;
              const canDoubleClickLaunch =
                Boolean(onStudyDoubleClick) || getWorkflowsForStudy(original).length > 0;
              // When a double click can launch, the second click must not read
              // as an unselect — clicking only ever selects. Otherwise toggle.
              if (canDoubleClickLaunch) {
                if (!row.getIsSelected()) {
                  row.toggleSelected(true);
                }
              } else {
                row.toggleSelected();
              }
            },
            onDoubleClick: row => {
              const original = row.original as StudyRow;
              const workflows = getWorkflowsForStudy(original);
              const defaultWorkflow = getDefaultWorkflowForStudy(original);
              // Ensure the row is selected before launching
              if (!row.getIsSelected()) {
                row.toggleSelected(true);
              }
              if (onStudyDoubleClick) {
                onStudyDoubleClick(original, { defaultWorkflow, workflows });
                return;
              }
              // Launch the default workflow, or fall back to the first
              // applicable one (the top entry of the row's workflow menu).
              const workflow = defaultWorkflow ?? workflows[0];
              workflow?.launchWithStudy(original);
            },
          }}
        />
      </DataTable.Table>

      {/* Mobile filter sheet (US-RSP-103) */}
      <Sheet
        open={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
      >
        <SheetContent
          side="inline-end"
          aria-label={t('Filters')}
          className="w-[min(100vw,22rem)]"
        >
          <SheetHeader>
            <SheetTitle>{t('Filters')}</SheetTitle>
          </SheetHeader>
          <SheetBody className="gap-4">
            {sheetFilterColumns.length === 0 && (
              <p className="text-muted-foreground text-sm">{t('No studies available')}</p>
            )}
            {sheetFilterColumns.map(({ col, id }) => {
              const meta = (col.columnDef.meta as { label?: string } | undefined) ?? undefined;
              const label = meta?.label ?? id;
              return (
                <div
                  key={id}
                  className="flex flex-col gap-1.5"
                >
                  <span className="text-muted-foreground text-sm">{t(label)}</span>
                  {renderFilterCell({
                    columnId: id,
                    value: table.getColumn(id)?.getFilterValue(),
                    setValue: v => table.getColumn(id)?.setFilterValue(v),
                  }) ?? (
                    <input
                      type="text"
                      className="border-input bg-background h-9 rounded border px-2 text-base"
                      value={String(table.getColumn(id)?.getFilterValue() ?? '')}
                      onChange={e => table.getColumn(id)?.setFilterValue(e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </SheetBody>
          <SheetFooter className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              onClick={() => table.setColumnFilters([])}
            >
              {t('ClearFilters')}
            </Button>
            <Button onClick={() => setIsFilterSheetOpen(false)}>{t('Apply')}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
