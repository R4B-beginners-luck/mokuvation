/**
 * Custom hook for fetching and managing calendar data
 */

import { useEffect, useState } from 'react';
import { fetchCalendarData } from '../api/calendarApi';
import type { Goal, Task } from '../types';
import { db } from '../../../services/db';
import { isOnline } from '../../../services/syncService';

interface UseCalendarDataResult {
  goals: Goal[];
  tasks: Task[];
  loading: boolean;
  error: Error | null;
}

export function useCalendarData(): UseCalendarDataResult {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        if (isOnline()) {
          const { goals: fetchedGoals, tasks: fetchedTasks } = await fetchCalendarData();
          setGoals(fetchedGoals);
          setTasks(fetchedTasks);
          setError(null);
        } else {
          // オフライン：Dexieからフォールバック
          const [dbGoals, dbTasks] = await Promise.all([
            db.goals.toArray(),
            db.tasks.toArray(),
          ]);
          setGoals(dbGoals.map((g) => ({
            id:          g.id,
            title:       g.title,
            period_type: g.period_type as Goal['period_type'],
            is_completed: g.is_completed,
          } as Goal)));
          setTasks(dbTasks.map((t) => ({
            id:           t.id,
            title:        t.title,
            goal_id:      t.goal_id ?? undefined,
            scheduled_at: t.scheduled_at ?? undefined,
            is_completed: t.is_completed,
          } as Task)));
          setError(null);
        }
      } catch (err) {
        // オンラインで失敗した場合もDexieにフォールバック
        try {
          const [dbGoals, dbTasks] = await Promise.all([
            db.goals.toArray(),
            db.tasks.toArray(),
          ]);
          setGoals(dbGoals.map((g) => ({
            id:           g.id,
            title:        g.title,
            period_type:  g.period_type as Goal['period_type'],
            is_completed: g.is_completed,
          } as Goal)));
          setTasks(dbTasks.map((t) => ({
            id:           t.id,
            title:        t.title,
            goal_id:      t.goal_id ?? undefined,
            scheduled_at: t.scheduled_at ?? undefined,
            is_completed: t.is_completed,
          } as Task)));
          setError(null);
        } catch {
          const errorObj = err instanceof Error ? err : new Error('Failed to load calendar data');
          setError(errorObj);
          console.error('Calendar data fetch error:', errorObj);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { goals, tasks, loading, error };
}
