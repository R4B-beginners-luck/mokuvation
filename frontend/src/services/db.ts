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
 *
 * entity: 'crdt_change' は Automerge の変更バイナリ（base64）を運ぶための種別。
 * payload には { blob: string } を積む。operation は現状使わないため 'create' 固定。
 */
export interface SyncQueueItem {
  id?: number; // auto-increment
  entity: 'task' | 'goal' | 'crdt_change';
  operation: 'create' | 'update' | 'delete';
  payload: LocalTask | LocalGoal | { id: string } | { blob: string } | Record<string, unknown>; // GoalsPage等でobjectを渡すケースに対応
  created_at: string;
}

/**
 * crdt_meta テーブル
 * Automerge ドキュメント本体（バイナリ）と、サーバーからの pull カーソルなど、
 * CRDT 同期に必要な小さな状態値をキー・バリューで保持する。
 *
 * 主なキー:
 *   - 'crdt_doc_binary'  : Automerge.save(doc) の結果を base64 化したもの
 *   - 'crdt_pull_cursor' : サーバー側 crdt_changes テーブルの last_id（次回 pull の起点）
 */
export interface CrdtMetaItem {
  key: string;
  value: string;
  updated_at: string;
}

// ─── Dexie クラス ────────────────────────────────────────────────

class MokuvationDB extends Dexie {
  tasks!: Table<LocalTask, string>;
  goals!: Table<LocalGoal, string>;
  sync_queue!: Table<SyncQueueItem, number>;
  crdt_meta!: Table<CrdtMetaItem, string>;

  constructor() {
    super('mokuvation');

    this.version(1).stores({
      // インデックスを張るフィールドをカンマ区切りで列挙
      // & → primary key、* → multi-entry index
      tasks:      '&id, user_id, goal_id, is_completed, scheduled_at, updated_at',
      goals:      '&id, user_id, parent_goal_id, period_type, is_completed, updated_at',
      sync_queue: '++id, entity, operation, created_at',
    });

    // v2: CRDT同期（Automergeドキュメント本体とpullカーソル）を保持するテーブルを追加
    this.version(2).stores({
      tasks:      '&id, user_id, goal_id, is_completed, scheduled_at, updated_at',
      goals:      '&id, user_id, parent_goal_id, period_type, is_completed, updated_at',
      sync_queue: '++id, entity, operation, created_at',
      crdt_meta:  '&key',
    });
  }
}

export const db = new MokuvationDB();
