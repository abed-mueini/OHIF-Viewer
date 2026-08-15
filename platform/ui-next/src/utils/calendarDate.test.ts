import { format as formatGregorian } from 'date-fns';
import {
  formatCalendarInput,
  localizeDigits,
  parseCalendarInput,
  parseDicomDate,
  toDicomDate,
  usesPersianCalendar,
} from './calendarDate';

describe('calendarDate', () => {
  const gregorianDate = new Date(2026, 7, 15, 12);

  it('recognizes Persian language variants', () => {
    expect(usesPersianCalendar('fa')).toBe(true);
    expect(usesPersianCalendar('fa-IR')).toBe(true);
    expect(usesPersianCalendar('en-US')).toBe(false);
  });

  it('formats the same date for Gregorian and Jalali inputs', () => {
    expect(formatCalendarInput(gregorianDate, 'en-US')).toBe('2026-08-15');
    expect(formatCalendarInput(gregorianDate, 'fa')).toBe('۱۴۰۵/۰۵/۲۴');
  });

  it('parses a Jalali input to the corresponding Gregorian date', () => {
    const parsed = parseCalendarInput('۱۴۰۵/۰۵/۲۴', 'fa');
    expect(formatGregorian(parsed, 'yyyy-MM-dd')).toBe('2026-08-15');
  });

  it('accepts Persian dates with either slash or dash separators', () => {
    expect(formatGregorian(parseCalendarInput('۱۴۰۵-۰۵-۲۴', 'fa'), 'yyyy-MM-dd')).toBe(
      '2026-08-15'
    );
    expect(formatGregorian(parseCalendarInput('۱۴۰۵/۰۵/۲۴', 'fa'), 'yyyy-MM-dd')).toBe(
      '2026-08-15'
    );
  });

  it('localizes numeric display values without changing API values', () => {
    expect(localizeDigits('1405/05/24 09:42', 'fa')).toBe('۱۴۰۵/۰۵/۲۴ ۰۹:۴۲');
    expect(localizeDigits('2026-08-15', 'en-US')).toBe('2026-08-15');
  });

  it('keeps DICOM dates Gregorian at the API boundary', () => {
    expect(formatCalendarInput(parseDicomDate('20260815'), 'fa')).toBe('۱۴۰۵/۰۵/۲۴');
    expect(toDicomDate('۱۴۰۵/۰۵/۲۴', 'fa')).toBe('20260815');
    expect(toDicomDate('2026-08-15', 'en-US')).toBe('20260815');
  });

  it('returns an empty DICOM value for invalid input', () => {
    expect(toDicomDate('not-a-date', 'fa')).toBe('');
  });
});
