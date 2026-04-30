// ─── Goal types ────────────────────────────────────────────────────────────

export interface LongTermGoal {
  id: string;
  type: 'long';
  title: string;
  description: string;
  createdAt: string;
}

export interface MidTermGoal {
  id: string;
  type: 'mid';
  title: string;
  description: string;
  longTermGoalId: string;
  /** IDs of other mid-term goals that are related (bidirectional) */
  relatedMidTermGoalIds: string[];
}

export interface ShortTermGoal {
  id: string;
  type: 'short';
  title: string;
  description: string;
  /** YYYY-MM-DD — short-term goals are daily tasks */
  date: string;
  completed: boolean;
  longTermGoalId: string;
  midTermGoalId?: string;
}

export type Goal = LongTermGoal | MidTermGoal | ShortTermGoal;

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
