import * as React from 'react';
import { format, isValid } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import {
  formatCalendarInput,
  parseCalendarInput,
  parseDicomDate,
  toDicomDate,
} from '../../utils/calendarDate';
import { Calendar } from '../Calendar';
import * as Popover from '../Popover';

export type DatePickerWithRangeProps = {
  id: string;
  /** YYYYMMDD (19921022) */
  startDate: string;
  /** YYYYMMDD (19921022) */
  endDate: string;
  /** Callback that received { startDate: string(YYYYMMDD), endDate: string(YYYYMMDD)} */
  onChange: (value: { startDate: string; endDate: string }) => void;
};

export function DatePickerWithRange({
  className,
  id,
  startDate,
  endDate,
  onChange,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & DatePickerWithRangeProps) {
  const { t, i18n } = useTranslation('DatePicker');
  const language = i18n.language;
  const isRtl = i18n.dir(language) === 'rtl';
  const formatDicomForDisplay = React.useCallback(
    (value: string) => {
      if (!value) {
        return '';
      }
      const parsed = parseDicomDate(value);
      return isValid(parsed) ? formatCalendarInput(parsed, language) : '';
    },
    [language]
  );
  const [start, setStart] = React.useState<string>(() => formatDicomForDisplay(startDate));
  const [end, setEnd] = React.useState<string>(() => formatDicomForDisplay(endDate));
  const [openEnd, setOpenEnd] = React.useState(false);

  const handleStartSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const formattedDate = formatCalendarInput(selectedDate, language);
      setStart(formattedDate);
      setOpenEnd(true);
      onChange({
        startDate: format(selectedDate, 'yyyyMMdd'),
        endDate: toDicomDate(end, language),
      });
    }
  };

  const handleEndSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const formattedDate = formatCalendarInput(selectedDate, language);
      setEnd(formattedDate);
      setOpenEnd(false);
      onChange({
        startDate: toDicomDate(start, language),
        endDate: format(selectedDate, 'yyyyMMdd'),
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    const value = e.target.value;
    const date = parseCalendarInput(value, language);
    if (type === 'start') {
      setStart(value);
      if (isValid(date)) {
        handleStartSelect(date);
      }
    } else {
      setEnd(value);
      if (isValid(date)) {
        handleEndSelect(date);
      }
    }
  };

  React.useEffect(() => {
    setStart(formatDicomForDisplay(startDate));
    setEnd(formatDicomForDisplay(endDate));
  }, [startDate, endDate, formatDicomForDisplay]);

  const parsedStart = start ? parseCalendarInput(start, language) : undefined;
  const parsedEnd = end ? parseCalendarInput(end, language) : undefined;
  const selectedStart = parsedStart && isValid(parsedStart) ? parsedStart : undefined;
  const selectedEnd = parsedEnd && isValid(parsedEnd) ? parsedEnd : undefined;

  return (
    <div className={cn('flex gap-2', className)}>
      <Popover.Popover>
        <Popover.PopoverTrigger asChild>
          <div className="relative w-full">
            {!start && (
              <CalendarIcon
                className="text-primary absolute top-1/2 h-4 w-4 -translate-y-1/2 transform"
                style={{ insetInlineEnd: '0.5rem' }}
              />
            )}
            <input
              id={`${id}-start`}
              dir={start ? 'ltr' : i18n.dir(language)}
              type="text"
              placeholder={t('Start', 'Start')}
              autoComplete="off"
              value={start}
              onChange={e => handleInputChange(e, 'start')}
              style={{
                paddingInlineStart: '0.375rem',
                paddingInlineEnd: '1.5rem',
                textAlign: isRtl ? 'right' : 'left',
              }}
              className={cn(
                'border-input focus:border-ring hover:text-foreground placeholder:text-muted-foreground bg-background hover:bg-background h-7 w-full justify-start rounded border py-1 text-start text-base font-normal'
              )}
              data-cy="input-date-range-start"
            />
          </div>
        </Popover.PopoverTrigger>
        <Popover.PopoverContent
          className="w-auto overflow-hidden p-0"
          align="start"
        >
          <Calendar
            autoFocus
            mode="single"
            captionLayout="dropdown"
            defaultMonth={selectedStart ?? new Date()}
            selected={selectedStart}
            onSelect={handleStartSelect}
            startMonth={new Date(1900, 0)}
            endMonth={new Date(new Date().getFullYear() + 1, 11)}
            numberOfMonths={1}
          />
        </Popover.PopoverContent>
      </Popover.Popover>

      <Popover.Popover
        open={openEnd}
        onOpenChange={setOpenEnd}
      >
        <Popover.PopoverTrigger asChild>
          <div className="relative w-full">
            {!end && (
              <CalendarIcon
                className="text-primary absolute top-1/2 h-4 w-4 -translate-y-1/2 transform"
                style={{ insetInlineEnd: '0.5rem' }}
              />
            )}
            <input
              id={`${id}-end`}
              dir={end ? 'ltr' : i18n.dir(language)}
              type="text"
              placeholder={t('End', 'End')}
              autoComplete="off"
              value={end}
              onChange={e => handleInputChange(e, 'end')}
              style={{
                paddingInlineStart: '0.375rem',
                paddingInlineEnd: '1.5rem',
                textAlign: isRtl ? 'right' : 'left',
              }}
              className={cn(
                'border-input focus:border-ring hover:text-foreground placeholder:text-muted-foreground bg-background hover:bg-background h-7 w-full justify-start rounded border py-1 text-start text-base font-normal'
              )}
              data-cy="input-date-range-end"
            />
          </div>
        </Popover.PopoverTrigger>
        <Popover.PopoverContent
          className="w-auto overflow-hidden p-0"
          align="start"
        >
          <Calendar
            autoFocus
            mode="single"
            captionLayout="dropdown"
            defaultMonth={selectedEnd ?? selectedStart ?? new Date()}
            selected={selectedEnd}
            onSelect={handleEndSelect}
            startMonth={new Date(1900, 0)}
            endMonth={new Date(new Date().getFullYear() + 1, 11)}
            numberOfMonths={1}
          />
        </Popover.PopoverContent>
      </Popover.Popover>
    </div>
  );
}
