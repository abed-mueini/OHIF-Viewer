import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../DropdownMenu';
import { Icons } from '../Icons';
import { useDataTable } from './context';

/**
 * Pagination
 * Renders "start-end of total" and ghost chevron buttons for prev/next.
 * Uses the TanStack table instance from DataTable context.
 */
export function Pagination<TData>() {
  const { t, i18n } = useTranslation('DataTable');
  const isRtl = i18n.dir(i18n.language) === 'rtl';
  const { table } = useDataTable<TData>();
  const { pageIndex, pageSize } = table.getState().pagination ?? { pageIndex: 0, pageSize: 50 };

  const total = table.getFilteredRowModel().rows.length;
  const start = total === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min(total, (pageIndex + 1) * pageSize);

  const canPrev = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();

  return (
    <div
      className="flex items-center gap-0.5"
      style={{ marginInlineEnd: '0.5rem' }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            dir={i18n.dir(i18n.language)}
            variant="ghost"
            size="sm"
            className="text-primary/80 px-2 text-sm leading-tight"
            aria-label={t('Rows per page')}
          >
            {/* Hide the range summary on very narrow viewports; the prev/next
                buttons remain, and the summary reappears from sm upwards. */}
            <span className="hidden sm:inline">
              {t('{{start}}-{{end}} of {{total}}', { start, end, total })}
            </span>
            <span
              className="sm:hidden"
              aria-hidden="true"
            >
              {t('{{total}}', { total })}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {[25, 50, 100].map(size => (
            <DropdownMenuItem
              key={size}
              onSelect={e => {
                e.preventDefault();
                table.setPageSize(size);
              }}
              className="flex items-center gap-[2px]"
            >
              <Icons.Checked className={`h-6 w-6 ${pageSize === size ? '' : 'invisible'}`} />
              {t('{{size}} per page', { size })}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('Previous page')}
        onClick={() => table.previousPage()}
        disabled={!canPrev}
        style={{ marginInlineStart: '0.25rem' }}
      >
        {isRtl ? (
          <Icons.ChevronRight className="h-3 w-3" />
        ) : (
          <Icons.ChevronLeft className="h-3 w-3" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('Next page')}
        onClick={() => table.nextPage()}
        disabled={!canNext}
      >
        {isRtl ? (
          <Icons.ChevronLeft className="h-3 w-3" />
        ) : (
          <Icons.ChevronRight className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}
