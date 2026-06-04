/**
 * Custom hook for fetching and managing calendar data
 */

import { useEffect, useState } from 'react';
import { fetchCalendarData } from '../api/calendarApi';
import type { Goal, Task } from '../types';

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
        const { goals: fetchedGoals, tasks: fetchedTasks } = await fetchCalendarData();
        setGoals(fetchedGoals);
        setTasks(fetchedTasks);
        setError(null);
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Failed to load calendar data');
        setError(errorObj);
        console.error('Calendar data fetch error:', errorObj);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { goals, tasks, loading, error };
}
