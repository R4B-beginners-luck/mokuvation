/**
 * Calendar Container Component
 * Fetches calendar data from API and orchestrates calendar UI
 */

import { useEffect, useState } from 'react';
import { useCalendarData } from '../hooks/useCalendarData';
import { CalendarGrid } from './CalendarGrid';
import { DayGoalList } from './DayGoalList';
import type { Task } from '../types';
import type { Task as CreatedTask } from '../../tasks';

const MONTH_JP = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

function getCalendarLoadingLabel(progress: number): string {
  if (progress < 30) return 'カレンダーデータを取得しています';
  if (progress < 60) return '目標とタスクを整理しています';
  if (progress < 90) return 'カレンダーを描画しています';
  return '表示の最終調整をしています';
}

export function CalendarContainer() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(
    now.toISOString().split('T')[0]
  );

  const { goals, tasks, loading, error } = useCalendarData();
  const [calendarTasks, setCalendarTasks] = useState<Task[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(16);

  useEffect(() => {
    setCalendarTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    if (!loading) return undefined;

    const timer = window.setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 94) return prev;
        const step = prev < 45 ? 10 : prev < 75 ? 6 : 3;
        return Math.min(prev + step, 94);
      });
    }, 120);

    return () => window.clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    if (loading) {
      setLoadingProgress(16);
      return;
    }

    setLoadingProgress(100);
  }, [loading]);

  const handleTaskAdded = (newTask: CreatedTask) => {
    const mappedTask: Task = {
      ...newTask,
      deleted_at: null,
    };
    setCalendarTasks((prev) => [mappedTask, ...prev]);
  };

  const handleTaskDeleted = (taskId: string) => {
    setCalendarTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
    setSelectedDate(null);
  };

  if (loading) {
    return (
      <div className="calendar-page">
        <div className="calendar-page__loading" role="status" aria-live="polite">
          <div className="calendar-page__loading-card">
            <div className="calendar-page__loading-header">
              <div className="calendar-page__loading-title">カレンダーを読み込み中です...</div>
              <div className="calendar-page__loading-percent">{loadingProgress}%</div>
            </div>
            <div className="calendar-page__loading-bar">
              <div
                className="calendar-page__loading-bar-fill"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <div className="calendar-page__loading-subtext">
              {getCalendarLoadingLabel(loadingProgress)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calendar-page">
        <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>
          エラーが発生しました: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-page">
      {/* Page header */}
      <div className="calendar-page__header">
        <h1 className="calendar-page__title">📅 振り返り</h1>
        <div className="calendar-nav">
          <button className="btn-icon" onClick={prevMonth} title="前の月">
            ‹
          </button>
          <span className="calendar-nav__label">
            {year}年 {MONTH_JP[month]}
          </span>
          <button className="btn-icon" onClick={nextMonth} title="次の月">
            ›
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div>
        {/* Legend */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--sp-4)',
            marginBottom: 'var(--sp-3)',
            paddingLeft: 'var(--sp-2)',
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: 'var(--text-muted)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--accent-gold)',
                display: 'inline-block',
              }}
            />
            全達成
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: 'var(--text-muted)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--accent-violet)',
                display: 'inline-block',
              }}
            />
            一部達成
          </span>
        </div>

        <CalendarGrid
          year={year}
          month={month}
          tasks={calendarTasks}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      {/* Day detail panel */}
      <DayGoalList
        date={selectedDate}
        tasks={calendarTasks}
        goals={goals}
        onTaskAdded={handleTaskAdded}
        onTaskDeleted={handleTaskDeleted}
      />
    </div>
  );
}
