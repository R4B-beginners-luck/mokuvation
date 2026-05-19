// ─── Goal & Task types ────────────────────────────────────────────────────────────

export interface LongTermGoal {
  id: string;
  type: 'long';
  title: string;
  description: string;
  createdAt: string;
  /** Backendで受け取るカラーコード（例: #64B5F6） */
  colorCode?: string;
  /** IDs of other long-term goals that are related (bidirectional) */
  relatedLongTermGoalIds?: string[];
}

export interface MidTermGoal {
  id: string;
  type: 'mid';
  title: string;
  description: string;
  longTermGoalId: string;
  /** Backendで受け取るカラーコード（例: #64B5F6） */
  colorCode?: string;
  /** YYYY-MM-DD */
  dueDate?: string;
  /** IDs of other mid-term goals that are related (bidirectional) */
  relatedMidTermGoalIds: string[];
  /** Labels assigned to this goal */
  labelIds?: string[];
  /** The primary label ID for this goal (used for node color in graph) */
  primaryLabelId?: string;
}

export interface ShortTermGoal {
  id: string;
  type: 'short';
  title: string;
  description: string;
  completed: boolean;
  longTermGoalId: string;
  midTermGoalId?: string;
  /** Backendで受け取るカラーコード（例: #64B5F6） */
  colorCode?: string;
  /** YYYY-MM-DD */
  dueDate?: string;
  /** Labels assigned to this goal */
  labelIds?: string[];
  /** The primary label ID for this goal (used for node color in graph) */
  primaryLabelId?: string;
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
}

// ─── Navigation ─────────────────────────────────────────────────────────────

export type Page = 'login' | 'top' | 'calendar' | 'goals';

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
  color: string;
}
