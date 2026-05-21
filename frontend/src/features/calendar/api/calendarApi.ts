/**
 * Calendar API communication
 * Fetches goals and tasks from backend REST API
 */

import type { Goal, Task } from '../types';

const API_BASE = 'http://localhost:8000';

interface ApiResponse<T> {
  data: T;
}

/**
 * Fetch all goals for the authenticated user
 */
export async function fetchGoals(): Promise<Goal[]> {
  const response = await fetch(`${API_BASE}/api/goals`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch goals: ${response.statusText}`);
  }

  const result: ApiResponse<Goal[]> = await response.json();
  return result.data;
}

/**
 * Fetch all tasks for the authenticated user
 */
export async function fetchTasks(): Promise<Task[]> {
  const response = await fetch(`${API_BASE}/api/tasks`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tasks: ${response.statusText}`);
  }

  const result: ApiResponse<Task[]> = await response.json();
  return result.data;
}

/**
 * Fetch both goals and tasks in parallel
 */
export async function fetchCalendarData() {
  const [goals, tasks] = await Promise.all([fetchGoals(), fetchTasks()]);
  return { goals, tasks };
}
