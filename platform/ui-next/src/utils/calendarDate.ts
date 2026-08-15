import { format as formatGregorian, isValid, parse as parseGregorian } from 'date-fns';
import { format as formatJalali, parse as parseJalali } from 'date-fns-jalali';

const DISPLAY_DATE_FORMAT = 'yyyy-MM-dd';
const PERSIAN_DISPLAY_DATE_FORMAT = 'yyyy/MM/dd';
const DICOM_DATE_FORMAT = 'yyyyMMdd';
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

function toPersianDigits(value: string): string {
  return value.replace(/\d/g, digit => PERSIAN_DIGITS[Number(digit)]);
}

function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, digit => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
}

export function usesPersianCalendar(language?: string): boolean {
  return language?.toLowerCase().split('-')[0] === 'fa';
}

export function localizeDigits(value: string, language?: string): string {
  return usesPersianCalendar(language) ? toPersianDigits(value) : value;
}

export function formatCalendarInput(date: Date, language?: string): string {
  if (usesPersianCalendar(language)) {
    return toPersianDigits(formatJalali(date, PERSIAN_DISPLAY_DATE_FORMAT));
  }

  return formatGregorian(date, DISPLAY_DATE_FORMAT);
}

export function parseCalendarInput(
  value: string,
  language?: string,
  referenceDate = new Date()
): Date {
  const normalizedValue = toLatinDigits(value).replace(/[/.]/g, '-');
  return usesPersianCalendar(language)
    ? parseJalali(normalizedValue, DISPLAY_DATE_FORMAT, referenceDate)
    : parseGregorian(normalizedValue, DISPLAY_DATE_FORMAT, referenceDate);
}

export function parseDicomDate(value: string, referenceDate = new Date()): Date {
  return parseGregorian(value, DICOM_DATE_FORMAT, referenceDate);
}

export function toDicomDate(value: string, language?: string): string {
  const parsed = parseCalendarInput(value, language);
  return isValid(parsed) ? formatGregorian(parsed, DICOM_DATE_FORMAT) : '';
}
