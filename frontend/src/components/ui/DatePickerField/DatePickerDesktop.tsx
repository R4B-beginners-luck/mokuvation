import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { format, setYear } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  buildYearRange,
  formatApiDate,
  getCalendarDays,
  isSameDay,
  isSameMonth,
  isToday,
  parseApiDate,
  shiftViewMonth,
} from './dateUtils';

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

interface DatePickerDesktopProps {
  anchorRef: React.RefObject<HTMLElement>;
  value: string;
  clearable: boolean;
  onSelect: (value: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export function DatePickerDesktop({
  anchorRef,
  value,
  clearable,
  onSelect,
  onClear,
  onClose,
}: DatePickerDesktopProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const selectedDate = parseApiDate(value);
  const [viewMonth, setViewMonth] = useState(() => selectedDate ?? new Date());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const years = buildYearRange(viewMonth.getFullYear());

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    const popover = popoverRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const popoverHeight = popover?.offsetHeight ?? 320;
    const popoverWidth = 280;
    const gap = 6;

    let top = rect.bottom + gap;
    let left = rect.left;

    if (top + popoverHeight > window.innerHeight - 8) {
      top = Math.max(8, rect.top - popoverHeight - gap);
    }
    if (left + popoverWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - popoverWidth - 8);
    }

    setPosition({ top, left });
  }, [anchorRef]);

  useLayoutEffect(() => {
    updatePosition();
  }, [updatePosition, viewMonth, showYearPicker]);

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleResize = () => updatePosition();

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [anchorRef, onClose, updatePosition]);

  const handleYearSelect = (year: number) => {
    setViewMonth((current) => setYear(current, year));
    setShowYearPicker(false);
  };

  const days = getCalendarDays(viewMonth);

  return createPortal(
    <div
      ref={popoverRef}
      className="date-picker-popover"
      role="dialog"
      aria-modal="true"
      aria-label="日付を選択"
      style={{ top: position.top, left: position.left }}
    >
      <div className="date-picker-popover__header">
        <div className="date-picker-popover__title-row">
          <button
            type="button"
            className="date-picker-popover__year-btn"
            aria-expanded={showYearPicker}
            aria-label="年を選択"
            onClick={() => setShowYearPicker((open) => !open)}
          >
            {format(viewMonth, 'yyyy年', { locale: ja })}
          </button>
          <span className="date-picker-popover__month-part">
            {format(viewMonth, 'M月', { locale: ja })}
          </span>
        </div>
        {!showYearPicker && (
          <div className="date-picker-popover__nav">
            <button
              type="button"
              className="date-picker-popover__nav-btn"
              aria-label="前の月"
              onClick={() => setViewMonth((m) => shiftViewMonth(m, -1))}
            >
              <ChevronLeft size={16} strokeWidth={1.75} aria-hidden />
            </button>
            <button
              type="button"
              className="date-picker-popover__nav-btn"
              aria-label="次の月"
              onClick={() => setViewMonth((m) => shiftViewMonth(m, 1))}
            >
              <ChevronRight size={16} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        )}
      </div>

      {showYearPicker ? (
        <div className="date-picker-popover__year-grid" role="listbox" aria-label="年を選択">
          {years.map((year) => {
            const isCurrent = year === viewMonth.getFullYear();
            return (
              <button
                key={year}
                type="button"
                role="option"
                aria-selected={isCurrent}
                className={[
                  'date-picker-popover__year',
                  isCurrent && 'date-picker-popover__year--selected',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleYearSelect(year)}
              >
                {year}
              </button>
            );
          })}
        </div>
      ) : (
        <>
      <div className="date-picker-popover__weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="date-picker-popover__weekday">{label}</span>
        ))}
      </div>

      <div className="date-picker-popover__grid">
        {days.map((day) => {
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const isOutside = !isSameMonth(day, viewMonth);
          return (
            <button
              key={day.toISOString()}
              type="button"
              className={[
                'date-picker-popover__day',
                isOutside && 'date-picker-popover__day--outside',
                isToday(day) && 'date-picker-popover__day--today',
                isSelected && 'date-picker-popover__day--selected',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                onSelect(formatApiDate(day));
                onClose();
              }}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
        </>
      )}

      {clearable && !showYearPicker && (
        <div className="date-picker-popover__footer">
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
    </div>,
    document.body,
  );
}
