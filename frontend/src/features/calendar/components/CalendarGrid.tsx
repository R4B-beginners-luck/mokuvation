import { useEffect, useRef, useState } from 'react';
import { getJstTodayStr } from '../../../components/ui/DatePickerField/dateUtils';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { useMonthSwipe } from '../hooks/useMonthSwipe';
import type { Task } from '../types';

interface CalendarGridProps {
  year: number;
  month: number; // 0-indexed
  tasks: Task[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  /** スマホ左右スワイプ用。未指定ならスワイプ無効（PCは渡さない想定） */
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  /** スマホ月切替のスライド方向（ボタン・スワイプ共通） */
  monthSlideDirection?: 'next' | 'prev' | null;
  onMonthSlideEnd?: () => void;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const SHEET_CLEARANCE_PX = 12;

function pad2(n: number) { return String(n).padStart(2, '0'); }

type ProgressLevel = 0 | 1 | 2 | 3 | 4 | 5;

function getProgressLevel(total: number, done: number): ProgressLevel {
  if (total === 0 || done === 0) return 0;
  const completionRate = done / total;
  if (completionRate === 1) return 5;  // 100% 完了
  if (completionRate >= 0.75) return 4; // 75%～99%
  if (completionRate >= 0.5) return 3;  // 50%～74%
  if (completionRate >= 0.25) return 2; // 25%～49%
  return 1; // 1%～24%
}

function extractDateFromScheduled(scheduledAt: string | null): string | null {
  if (!scheduledAt) return null;
  const normalized = scheduledAt.replace(' ', 'T');
  return normalized.split('T')[0] ?? null;
}

function readCssPx(value: string, fallback: number): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

/** 固定シートのレイアウト上端（アニメの transform に依存しない） */
function getDaySheetTopPx(): number {
  const sheet = document.querySelector('.day-detail--mobile, .calendar-page .day-detail');
  const rootStyle = getComputedStyle(document.documentElement);
  const bottomNav = readCssPx(rootStyle.getPropertyValue('--bottom-nav-height'), 56);

  if (sheet instanceof HTMLElement) {
    // offsetHeight / computed bottom は transform アニメの影響を受けない
    const height = sheet.offsetHeight;
    const bottom = readCssPx(getComputedStyle(sheet).bottom, bottomNav);
    return window.innerHeight - bottom - height;
  }

  const sheetHeight = window.innerHeight * 0.34;
  return window.innerHeight - bottomNav - sheetHeight;
}

/**
 * 選択週がシートに隠れないよう、カレンダーを上へ lift する量（px）を求める。
 * すでにシート上に収まっていれば 0（不要な移動をしない）。
 */
function calcMobileLiftPx(grid: HTMLElement, selectedCell: HTMLElement): number {
  const days = selectedCell.parentElement;
  if (!days) return 0;

  const cells = Array.from(days.children);
  const index = cells.indexOf(selectedCell);
  if (index < 0) return 0;

  const rowStart = Math.floor(index / 7) * 7;
  const rowCells = cells.slice(rowStart, rowStart + 7) as HTMLElement[];

  // 現在の transform を外してレイアウト位置を測る（再帰計算を防ぐ）
  const prevTransform = grid.style.transform;
  const prevTransition = grid.style.transition;
  grid.style.transition = 'none';
  grid.style.transform = 'none';
  void grid.offsetHeight;

  const weekRects = rowCells.map((el) => el.getBoundingClientRect());
  const weekBottom = Math.max(...weekRects.map((r) => r.bottom));
  const sheetTop = getDaySheetTopPx();

  grid.style.transform = prevTransform;
  grid.style.transition = prevTransition;

  return Math.max(0, weekBottom - (sheetTop - SHEET_CLEARANCE_PX));
}

export function CalendarGrid({
  year,
  month,
  tasks,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  monthSlideDirection = null,
  onMonthSlideEnd,
}: CalendarGridProps) {
  const today = getJstTodayStr();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const selectedCellRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [mobileLiftPx, setMobileLiftPx] = useState(0);
  const [slideAnimating, setSlideAnimating] = useState(false);
  const swipeEnabled = Boolean(isMobile && onPrevMonth && onNextMonth && !slideAnimating);

  const { handlers: swipeHandlers, shouldSuppressClick } = useMonthSwipe({
    enabled: swipeEnabled,
    onSwipeLeft: () => onNextMonth?.(),
    onSwipeRight: () => onPrevMonth?.(),
  });

  const slideClass =
    isMobile && monthSlideDirection === 'next'
      ? 'calendar-grid__month-pane--enter-next'
      : isMobile && monthSlideDirection === 'prev'
        ? 'calendar-grid__month-pane--enter-prev'
        : '';

  useEffect(() => {
    if (!isMobile || !monthSlideDirection) {
      setSlideAnimating(false);
      return;
    }
    setSlideAnimating(true);

    // prefers-reduced-motion や animation 未発火でも必ず解除する
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ms = reduced ? 0 : 260;
    const timer = window.setTimeout(() => {
      setSlideAnimating(false);
      onMonthSlideEnd?.();
    }, ms);
    return () => window.clearTimeout(timer);
  }, [isMobile, monthSlideDirection, year, month, onMonthSlideEnd]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const cells: { date: string; inMonth: boolean; day: number }[] = [];

  for (let i = 0; i < totalCells; i++) {
    if (i < firstDay) {
      const d = daysInPrevMonth - firstDay + i + 1;
      const prevMonth = month === 0 ? 12 : month;
      const prevYear  = month === 0 ? year - 1 : year;
      cells.push({ date: `${prevYear}-${pad2(prevMonth)}-${pad2(d)}`, inMonth: false, day: d });
    } else if (i < firstDay + daysInMonth) {
      const d = i - firstDay + 1;
      cells.push({ date: `${year}-${pad2(month + 1)}-${pad2(d)}`, inMonth: true, day: d });
    } else {
      const d = i - firstDay - daysInMonth + 1;
      const nextMonth = month === 11 ? 1 : month + 2;
      const nextYear  = month === 11 ? year + 1 : year;
      cells.push({ date: `${nextYear}-${pad2(nextMonth)}-${pad2(d)}`, inMonth: false, day: d });
    }
  }

  const statsByDate: Record<string, { total: number; done: number }> = {};
  tasks.forEach((task) => {
    const taskDate = extractDateFromScheduled(task.scheduled_at);
    if (!taskDate) return;
    if (!statsByDate[taskDate]) statsByDate[taskDate] = { total: 0, done: 0 };
    statsByDate[taskDate].total++;
    if (task.is_completed) statsByDate[taskDate].done++;
  });

  // PC: 詳細パネル表示中の横スクロール寄せ
  useEffect(() => {
    if (isMobile || !selectedDate || !selectedCellRef.current) return;
    selectedCellRef.current.scrollIntoView({
      behavior: 'smooth',
      inline: 'nearest',
      block: 'nearest',
    });
  }, [selectedDate, year, month, isMobile]);

  // スマホ: 詳細シート分を考慮して選択週を上へ lift（スクロールコンテナが無いため transform）
  useEffect(() => {
    if (!isMobile) {
      setMobileLiftPx(0);
      return;
    }
    if (!selectedDate) {
      setMobileLiftPx(0);
      return;
    }

    let cancelled = false;
    const applyLift = () => {
      if (cancelled) return;
      const grid = gridRef.current;
      const cell = selectedCellRef.current;
      if (!grid || !cell) return;
      setMobileLiftPx(calcMobileLiftPx(grid, cell));
    };

    // シート DOM 反映・レイアウト後に計測（二重 rAF）
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(applyLift);
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(id);
    };
  }, [selectedDate, year, month, isMobile, totalCells]);

  return (
    <div
      ref={gridRef}
      className={[
        'calendar-grid',
        swipeEnabled ? 'calendar-grid--swipeable' : '',
        isMobile ? 'calendar-grid--mobile-clip' : '',
      ].filter(Boolean).join(' ')}
      style={
        isMobile && mobileLiftPx > 0
          ? { transform: `translateY(-${mobileLiftPx}px)` }
          : isMobile
            ? { transform: 'translateY(0)' }
            : undefined
      }
      {...swipeHandlers}
    >
      <div
        key={`${year}-${month}`}
        className={['calendar-grid__month-pane', slideClass].filter(Boolean).join(' ')}
        onAnimationEnd={(e) => {
          if (e.target !== e.currentTarget) return;
          setSlideAnimating(false);
          onMonthSlideEnd?.();
        }}
      >
        <div className="calendar-grid__weekdays">
          {WEEKDAYS.map((d, index) => {
            const color = index === 0 ? '#ef4444' : index === 6 ? '#3b82f6' : '#fff';

            return (
              <div key={d} className="calendar-grid__weekday" style={{ color }}>{d}</div>
            );
          })}
        </div>
        <div className="calendar-grid__days">
          {cells.map(({ date, inMonth, day }) => {
            const stats   = statsByDate[date];
            const isToday = date === today;
            const isSel   = date === selectedDate;
            const dotCount = Math.min(stats?.total ?? 0, 3);
            const allDone  = stats ? stats.done === stats.total : false;

            const progressLevel = stats
              ? getProgressLevel(stats.total, stats.done)
              : 0;

            return (
              <div
                key={date}
                ref={isSel ? selectedCellRef : undefined}
                data-date={date}
                className={[
                  'calendar-day',
                  !inMonth ? 'other-month' : '',
                  isToday   ? 'today'    : '',
                  isSel     ? 'selected' : '',
                  progressLevel > 0 ? `calendar-day--progress-${progressLevel}` : '',
                ].filter(Boolean).join(' ')}
                onClick={() => {
                  if (shouldSuppressClick()) return;
                  if (inMonth) onSelectDate(date);
                }}
              >
                <div className="calendar-day__num">{day}</div>
                {stats && dotCount > 0 && (
                  <div className="calendar-day__dots">
                    {Array.from({ length: dotCount }).map((_, i) => (
                      <span
                        key={i}
                        className={`calendar-day__dot${allDone ? ' calendar-day__dot--completed' : ' calendar-day__dot--partial'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
