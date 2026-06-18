import type { Task } from '../types';

interface CalendarGridProps {
  year: number;
  month: number; // 0-indexed
  tasks: Task[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

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

export function CalendarGrid({
  year,
  month,
  tasks,
  selectedDate,
  onSelectDate,
}: CalendarGridProps) {
  const today = new Date().toISOString().split('T')[0];

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

  return (
    <div className="calendar-grid">
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
              className={[
                'calendar-day',
                !inMonth ? 'other-month' : '',
                isToday   ? 'today'    : '',
                isSel     ? 'selected' : '',
                progressLevel > 0 ? `calendar-day--progress-${progressLevel}` : '',
              ].filter(Boolean).join(' ')}
              onClick={() => inMonth && onSelectDate(date)}
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
  );
}
