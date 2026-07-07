import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDaysInMonth,
  isSameDay,
  isSameMonth,
  isToday,
  isValid,
  parse,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ja } from 'date-fns/locale';

/** API・フォーム state で使う日付文字列形式（既存の dueDate / scheduled_at と同一） */
export const API_DATE_FORMAT = 'yyyy-MM-dd';

export function parseApiDate(value: string): Date | null {
  if (!value) return null;
  const parsed = parse(value, API_DATE_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
}

export function formatApiDate(date: Date): string {
  return format(date, API_DATE_FORMAT);
}

export function getTodayApiDate(): string {
  return formatApiDate(new Date());
}

/** トリガーボタンに表示する読みやすい形式 */
export function formatDisplayDate(value: string): string {
  const parsed = parseApiDate(value);
  if (!parsed) return '';
  return format(parsed, 'yyyy年M月d日', { locale: ja });
}

export function formatMonthLabel(viewMonth: Date): string {
  return format(viewMonth, 'yyyy年M月', { locale: ja });
}

/** 月カレンダー用：前月・次月の端数を含む6週グリッド */
export function getCalendarDays(viewMonth: Date): Date[] {
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

export function clampDayInMonth(year: number, monthIndex: number, day: number): number {
  const maxDay = getDaysInMonth(new Date(year, monthIndex, 1));
  return Math.min(Math.max(1, day), maxDay);
}

export function buildApiDate(year: number, monthIndex: number, day: number): string {
  const clampedDay = clampDayInMonth(year, monthIndex, day);
  return formatApiDate(new Date(year, monthIndex, clampedDay));
}

export function shiftViewMonth(viewMonth: Date, delta: number): Date {
  return startOfMonth(addMonths(viewMonth, delta));
}

/** ピッカーで選べる年の範囲（現在年 -30 〜 +10） */
export function buildYearRange(centerYear: number = new Date().getFullYear()): number[] {
  const years: number[] = [];
  for (let y = centerYear - 30; y <= centerYear + 10; y += 1) {
    years.push(y);
  }
  return years;
}

export { isSameDay, isSameMonth, isToday };
