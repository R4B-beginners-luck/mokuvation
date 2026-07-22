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

function mapLocalGoal(g: Awaited<ReturnType<typeof db.goals.toArray>>[number]): Goal {
  return {
    id: g.id,
    user_id: g.user_id,
    parent_goal_id: g.parent_goal_id,
    title: g.title,
    description: g.description,
    period_type: g.period_type,
    due_at: g.due_at,
    is_completed: g.is_completed,
    created_at: g.created_at,
    updated_at: g.updated_at,
    deleted_at: null,
  };
}

function mapLocalTask(t: Awaited<ReturnType<typeof db.tasks.toArray>>[number]): Task {
  return {
    id: t.id,
    user_id: t.user_id,
    goal_id: t.goal_id,
    title: t.title,
    description: t.description,
    scheduled_at: t.scheduled_at,
    is_completed: t.is_completed,
    completed_at: t.completed_at,
    created_at: t.created_at,
    updated_at: t.updated_at,
    deleted_at: null,
  };
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
          const [dbGoals, dbTasks] = await Promise.all([
            db.goals.toArray(),
            db.tasks.toArray(),
          ]);
          setGoals(dbGoals.map(mapLocalGoal));
          setTasks(dbTasks.map(mapLocalTask));
          setError(null);
        }
      } catch (err) {
        try {
          const [dbGoals, dbTasks] = await Promise.all([
            db.goals.toArray(),
            db.tasks.toArray(),
          ]);
          setGoals(dbGoals.map(mapLocalGoal));
          setTasks(dbTasks.map(mapLocalTask));
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

    void loadData();
  }, []);

  return { goals, tasks, loading, error };
}
