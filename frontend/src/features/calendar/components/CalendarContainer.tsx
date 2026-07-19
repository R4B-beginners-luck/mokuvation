/**
 * Calendar Container Component
 * Fetches calendar data from API and orchestrates calendar UI
 */

import { Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCalendarData } from '../hooks/useCalendarData';
import { CalendarGrid } from './CalendarGrid';
import { DayGoalList } from './DayGoalList';
import type { Task } from '../types';
import type { Task as CreatedTask } from '../../tasks';
import { Skeleton } from '../../../components/ui/Skeleton';
import { crdtAddTask, crdtDeleteTask } from '../../../services/crdtStore';
import { db, type LocalTask } from '../../../services/db';

const MONTH_JP = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

export function CalendarContainer() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { goals, tasks, loading, error } = useCalendarData();
  const [calendarTasks, setCalendarTasks] = useState<Task[]>([]);

  useEffect(() => {
    setCalendarTasks(tasks);
  }, [tasks]);

  const handleTaskAdded = (newTask: CreatedTask) => {
    const mappedTask: Task = {
      ...newTask,
      deleted_at: null,
    };
    setCalendarTasks((prev) => [mappedTask, ...prev]);

    // App.tsx の handleAddTask と同じく、CRDTドキュメントにも反映する。
    // Calendar の TaskAddModal は useTaskMutations 経由で既に db.tasks に
    // 正しい形（snake_case, 全フィールド埋め済み）で保存済みのはずなので、
    // それを正として使う（newTaskの形が将来変わってもズレないように）。
    void (async () => {
      const id = String(newTask.id);
      const existing = await db.tasks.get(id);
      const localTask: LocalTask = existing ?? {
        id,
        user_id:      String((newTask as any).user_id ?? ''),
        goal_id:      newTask.goal_id ?? null,
        title:        newTask.title,
        description:  newTask.description ?? null,
        scheduled_at: newTask.scheduled_at ?? null,
        is_completed: Boolean(newTask.is_completed),
        completed_at: newTask.completed_at ?? null,
        created_at:   newTask.created_at ?? new Date().toISOString(),
        updated_at:   newTask.updated_at ?? new Date().toISOString(),
      };
      crdtAddTask(localTask);
    })();
  };

  const handleTaskDeleted = (taskId: string) => {
    // TopPage側(App.tsx handleDeleteTask)と同じく、削除をCRDTドキュメントにも反映する。
    // これが無いと画面上は消えるが他端末との同期対象にならず、
    // 同期後に削除したはずのタスクが復活してしまう。
    crdtDeleteTask(taskId);
    setCalendarTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const handleTaskUpdated = (updated: CreatedTask) => {
    const mappedTask: Task = {
      ...updated,
      deleted_at: null,
    };
    setCalendarTasks((prev) => prev.map((t) => (t.id === mappedTask.id ? { ...t, ...mappedTask } : t)));
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate((prev) => (prev === date ? null : date));
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', width: '100%' }}>
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} height="56px" radius="4px" />
            ))}
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
      <div className="calendar-page__header">
        <h1 className="calendar-page__title">
          <Calendar size={20} strokeWidth={1.75} aria-hidden />
          カレンダー
        </h1>
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

      <div className="calendar-page__content">
        <div className="calendar-page__grid-col">
          <CalendarGrid
            year={year}
            month={month}
            tasks={calendarTasks}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
          />

          <div
            style={{
              display: 'flex',
              gap: 'var(--sp-4)',
              marginTop: 'var(--sp-3)',
              paddingLeft: 'var(--sp-2)',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                color: '#fff',
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
                color: '#fff',
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
        </div>

        <DayGoalList
          date={selectedDate}
          tasks={calendarTasks}
          goals={goals}
          onTaskAdded={handleTaskAdded}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
          onClose={() => setSelectedDate(null)}
        />
      </div>
    </div>
  );
}