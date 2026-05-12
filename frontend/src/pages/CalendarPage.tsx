import { useState } from 'react';
import type { Task } from '../types';
import { longTermGoals, midTermGoals } from '../data/dummy';
import { CalendarGrid, DayGoalList } from '../features/calendar';

interface CalendarPageProps {
  tasks: Task[];
}

const MONTH_JP = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

export function CalendarPage({ tasks }: CalendarPageProps) {
  const now   = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(
    now.toISOString().split('T')[0]
  );

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else             { setMonth((m) => m - 1); }
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else              { setMonth((m) => m + 1); }
    setSelectedDate(null);
  };

  return (
    <div className="calendar-page">
      {/* Page header */}
      <div className="calendar-page__header">
        <h1 className="calendar-page__title">📅 振り返り</h1>
        <div className="calendar-nav">
          <button className="btn-icon" onClick={prevMonth} title="前の月">‹</button>
          <span className="calendar-nav__label">
            {year}年 {MONTH_JP[month]}
          </span>
          <button className="btn-icon" onClick={nextMonth} title="次の月">›</button>
        </div>
      </div>

      {/* Calendar grid */}
      <div>
        <CalendarGrid
          year={year}
          month={month}
          tasks={tasks}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {/* Legend */}
        <div style={{ display: 'flex', gap: 'var(--sp-4)', marginTop: 'var(--sp-3)', paddingLeft: 'var(--sp-2)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-gold)', display: 'inline-block' }} />
            全達成
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-violet)', display: 'inline-block' }} />
            一部達成
          </span>
        </div>
      </div>

      {/* Day detail panel */}
      <DayGoalList
        date={selectedDate}
        tasks={tasks}
        midTermGoals={midTermGoals}
        longTermGoals={longTermGoals}
      />
    </div>
  );
}
