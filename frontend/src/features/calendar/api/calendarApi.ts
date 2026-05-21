/**
 * Calendar API communication
 * Fetches goals and tasks from backend REST API
 */

import type { Goal, Task } from '../types';

const API_BASE = 'http://localhost:8000';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Fetch all goals for the authenticated user
 */
export async function fetchGoals(): Promise<Goal[]> {
  const response = await fetch(`${API_BASE}/api/goals`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch goals: ${response.statusText}`);
  }

  return response.json() as Promise<Goal[]>;
}

/**
 * Fetch all tasks for the authenticated user
 */
export async function fetchTasks(): Promise<Task[]> {
  const response = await fetch(`${API_BASE}/api/tasks`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tasks: ${response.statusText}`);
  }

  return response.json() as Promise<Task[]>;
}

/**
 * Fetch both goals and tasks in parallel
 */
export async function fetchCalendarData() {
  const [goals, tasks] = await Promise.all([fetchGoals(), fetchTasks()]);
  return { goals, tasks };
}
