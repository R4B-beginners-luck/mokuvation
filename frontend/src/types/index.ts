// ─── Goal & Task types ────────────────────────────────────────────────────────────

export interface LongTermGoal {
  id: string;
  type: 'long';
  title: string;
  description: string;
  createdAt: string;
  /** YYYY-MM-DD */
  dueDate?: string;
  completed?: boolean;
  color_code?: string;
  /** IDs of other long-term goals that are related (bidirectional) */
  relatedLongTermGoalIds?: string[];
}

export interface MidTermGoal {
  id: string;
  type: 'mid';
  title: string;
  description: string;
  longTermGoalId: string;
  /** YYYY-MM-DD */
  dueDate?: string;
  completed?: boolean;
  color_code?: string;
  /** IDs of other mid-term goals that are related (bidirectional) */
  relatedMidTermGoalIds: string[];
}

export interface ShortTermGoal {
  id: string;
  type: 'short';
  title: string;
  description: string;
  completed: boolean;
  longTermGoalId: string;
  midTermGoalId?: string;
  /** YYYY-MM-DD */
  dueDate?: string;
  color_code?: string;
}

import type { ThemeColorIndex } from '../utils/theme';

export interface User {
  user_id: string;
  user_name: string;
  theme_color?: ThemeColorIndex;
}

export type Goal = LongTermGoal | MidTermGoal | ShortTermGoal;

export interface Task {
  id: string;
  title: string;
  description?: string;
  /** YYYY-MM-DD — the date this task is scheduled for */
  date: string;
  completed: boolean;
  /** Which goal this task is related to */
  goalId?: string;
  /** ISO datetime — used to keep Today list in creation order */
  createdAt?: string;
}

// ─── Navigation ─────────────────────────────────────────────────────────────

export type Page = 'login' | 'top' | 'calendar' | 'goals'|'settings';

// ─── Graph ───────────────────────────────────────────────────────────────────

export interface NodePosition {
  x: number;
  y: number;
}

export interface GraphNode {
  goal: Goal;
  pos: NodePosition;
}

export interface GraphEdge {
  from: string;
  to: string;
  /** dashed = mid <-> mid relationship */
  dashed?: boolean;
  color?: string;
}

export interface Label {
  id: string | number;
  name: string;
  color_code: string;
}
