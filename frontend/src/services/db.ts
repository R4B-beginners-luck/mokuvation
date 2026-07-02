import Dexie, { type Table } from 'dexie';

// ─── テーブルの型定義 ────────────────────────────────────────────

/** tasks テーブル（既存の Task 型と同じフィールド） */
export interface LocalTask {
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
}

/** goals テーブル（既存の BackendGoal 型と同じフィールド） */
export interface LocalGoal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  parent_goal_id: string | null;
  period_type: 'short' | 'middle' | 'long';
  due_at: string | null;
  is_completed: boolean;
  color_code: number | null;
  position_x: number | null;
  position_y: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * sync_queue テーブル
 * オフライン中に行った操作を溜めておき、
 * オンライン復帰時にバックエンドへ送る
 */
export interface SyncQueueItem {
  id?: number; // auto-increment
  entity: 'task' | 'goal';
  operation: 'create' | 'update' | 'delete';
  payload: LocalTask | LocalGoal | { id: string } | Record<string, unknown>; // GoalsPage等でobjectを渡すケースに対応
  created_at: string;
}

// ─── Dexie クラス ────────────────────────────────────────────────

class MokuvationDB extends Dexie {
  tasks!: Table<LocalTask, string>;
  goals!: Table<LocalGoal, string>;
  sync_queue!: Table<SyncQueueItem, number>;

  constructor() {
    super('mokuvation');

    this.version(1).stores({
      // インデックスを張るフィールドをカンマ区切りで列挙
      // & → primary key、* → multi-entry index
      tasks:      '&id, user_id, goal_id, is_completed, scheduled_at, updated_at',
      goals:      '&id, user_id, parent_goal_id, period_type, is_completed, updated_at',
      sync_queue: '++id, entity, operation, created_at',
    });
  }
}

export const db = new MokuvationDB();
