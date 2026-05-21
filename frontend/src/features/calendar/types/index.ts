/**
 * Backend-derived type definitions for Calendar feature
 * These correspond to the goals and tasks tables in the database
 */

export interface Goal {
  id: string;
  user_id: string;
  parent_goal_id: string | null;
  title: string;
  description: string | null;
  period_type: 'short' | 'middle' | 'long';
  due_at: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Task {
  id: string;
  user_id: string;
  goal_id: string | null;
  title: string;
  description: string | null;
  scheduled_at: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CalendarData {
  goals: Goal[];
  tasks: Task[];
}
