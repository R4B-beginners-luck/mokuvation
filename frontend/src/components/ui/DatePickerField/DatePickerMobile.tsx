import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import {
  buildApiDate,
  buildYearRange,
  clampDayInMonth,
  getTodayApiDate,
  parseApiDate,
} from './dateUtils';

/** 1行の高さ。パディング・項目とも同じにして scrollTop と index の対応を一致させる */
const WHEEL_ITEM_HEIGHT = 40;
/** 上下パディングの行数（中央に最初/最後の項目を寄せるため） */
const WHEEL_PAD_ROWS = 2;
/** .date-picker-wheel-wrap の height と一致させる */
const WHEEL_VIEWPORT_HEIGHT = 200;

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i,
  label: `${i + 1}月`,
}));

function buildDays(year: number, monthIndex: number): number[] {
  const max = clampDayInMonth(year, monthIndex, 31);
  return Array.from({ length: max }, (_, i) => i + 1);
}

interface WheelColumnProps {
  items: { value: number; label: string }[];
  selectedValue: number;
  onChange: (value: number) => void;
}

function WheelColumn({ items, selectedValue, onChange }: WheelColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollEndTimer = useRef<number | null>(null);

  // 選択帯はビューポート中央。項目中心をそこに合わせる scrollTop を求める
  const scrollTopForIndex = (index: number, viewportHeight: number) =>
    (WHEEL_PAD_ROWS + index) * WHEEL_ITEM_HEIGHT
    + WHEEL_ITEM_HEIGHT / 2
    - viewportHeight / 2;

  const indexFromScrollTop = (scrollTop: number, viewportHeight: number) =>
    Math.round(
      (scrollTop + viewportHeight / 2 - WHEEL_PAD_ROWS * WHEEL_ITEM_HEIGHT - WHEEL_ITEM_HEIGHT / 2)
      / WHEEL_ITEM_HEIGHT,
    );

  const scrollToIndex = useCallback((index: number, smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(items.length - 1, index));
    const viewportHeight = el.clientHeight || WHEEL_VIEWPORT_HEIGHT;
    el.scrollTo({
      top: scrollTopForIndex(clamped, viewportHeight),
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, [items.length]);

  const scrollToValue = useCallback((value: number, smooth = false) => {
    const index = items.findIndex((item) => item.value === value);
    if (index < 0) return;
    scrollToIndex(index, smooth);
  }, [items, scrollToIndex]);

  useLayoutEffect(() => {
    scrollToValue(selectedValue);
  }, [scrollToValue, selectedValue]);

  const handleScroll = () => {
    if (scrollEndTimer.current !== null) {
      window.clearTimeout(scrollEndTimer.current);
    }
    scrollEndTimer.current = window.setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;
      const viewportHeight = el.clientHeight || WHEEL_VIEWPORT_HEIGHT;
      const index = indexFromScrollTop(el.scrollTop, viewportHeight);
      const clamped = Math.max(0, Math.min(items.length - 1, index));
      const next = items[clamped]?.value;
      if (next !== undefined && next !== selectedValue) {
        onChange(next);
      }
      scrollToIndex(clamped);
    }, 80);
  };

  useEffect(() => () => {
    if (scrollEndTimer.current !== null) {
      window.clearTimeout(scrollEndTimer.current);
    }
  }, []);

  return (
    <div ref={scrollRef} className="date-picker-wheel" onScroll={handleScroll}>
      {Array.from({ length: WHEEL_PAD_ROWS }).map((_, i) => (
        <div key={`pad-top-${i}`} className="date-picker-wheel__pad" aria-hidden />
      ))}
      {items.map((item) => (
        <div
          key={item.value}
          className={[
            'date-picker-wheel__item',
            item.value === selectedValue && 'date-picker-wheel__item--active',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {item.label}
        </div>
      ))}
      {Array.from({ length: WHEEL_PAD_ROWS }).map((_, i) => (
        <div key={`pad-bottom-${i}`} className="date-picker-wheel__pad" aria-hidden />
      ))}
    </div>
  );
}

interface DatePickerMobileProps {
  value: string;
  clearable: boolean;
  onConfirm: (value: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export function DatePickerMobile({ value, clearable, onConfirm, onClear, onClose }: DatePickerMobileProps) {
  const initial = parseApiDate(value) ?? parseApiDate(getTodayApiDate())!;
  const [year, setYear] = useState(initial.getFullYear());
  const [monthIndex, setMonthIndex] = useState(initial.getMonth());
  const [day, setDay] = useState(initial.getDate());

  const years = buildYearRange(new Date().getFullYear());
  const yearItems = years.map((y) => ({ value: y, label: `${y}年` }));
  const dayItems = buildDays(year, monthIndex).map((d) => ({ value: d, label: `${d}日` }));

  const handleMonthChange = (nextMonth: number) => {
    setMonthIndex(nextMonth);
    setDay((prev) => clampDayInMonth(year, nextMonth, prev));
  };

  const handleYearChange = (nextYear: number) => {
    setYear(nextYear);
    setDay((prev) => clampDayInMonth(nextYear, monthIndex, prev));
  };

  const handleConfirm = () => {
    onConfirm(buildApiDate(year, monthIndex, day));
    onClose();
  };

  return createPortal(
    <div
      className="date-picker-sheet-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="date-picker-sheet" role="dialog" aria-modal="true" aria-label="日付を選択">
        <div className="date-picker-sheet__header">
          <span className="date-picker-sheet__title">日付を選択</span>
          <button type="button" className="date-picker-sheet__close" onClick={onClose} aria-label="閉じる">
            <X size={16} strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        <div className="date-picker-wheel-wrap">
          <WheelColumn items={yearItems} selectedValue={year} onChange={handleYearChange} />
          <WheelColumn items={MONTHS} selectedValue={monthIndex} onChange={handleMonthChange} />
          <WheelColumn items={dayItems} selectedValue={day} onChange={setDay} />
        </div>

        <div className="date-picker-sheet__actions">
          {clearable && (
            <div className="date-picker-sheet__clear-row">
              <button
                type="button"
                className="date-picker-popover__clear"
                onClick={() => {
                  onClear();
                  onClose();
                }}
              >
                未設定に戻す
              </button>
            </div>
          )}
          <button type="button" className="btn-secondary" onClick={onClose}>キャンセル</button>
          <button type="button" className="btn-primary" onClick={handleConfirm}>決定</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
