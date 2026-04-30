# マイグレーション 属性一覧（修正版）

## users テーブル

| カラム名 | 型 | 属性 | 説明 |
|---|---|---|---|
| user_id | string | PRIMARY KEY | ユーザーID |
| user_name | string |  | ユーザー名 |
| password | string |  | パスワード（ハッシュ化） |
| created_at | timestamp | timestamps() | 作成日時 |
| updated_at | timestamp | timestamps() | 更新日時 |
| deleted_at | timestamp | softDeletes() | 削除日時（論理削除） |

---

## goals テーブル

| カラム名 | 型 | 属性 | 説明 |
|---|---|---|---|
| id | uuid | PRIMARY KEY | 目標ID |
| user_id | string | FK → users.user_id | ユーザーID（所有者） |
| parent_goal_id | uuid | NULLABLE, FK → goals.id | 親目標ID（階層構造） |
| title | string |  | 目標タイトル |
| description | text | NULLABLE | 目標の詳細・備考 |
| period_type | string |  | 期間区分（short / middle / long） |
| due_at | timestamp | NULLABLE | 期限日時 |
| is_completed | boolean | DEFAULT false | 達成フラグ |
| created_at | timestamp | timestamps() | 作成日時 |
| updated_at | timestamp | timestamps() | 更新日時 |
| deleted_at | timestamp | softDeletes() | 削除日時（論理削除） |

### インデックス
| 対象カラム | 種別 |
|---|---|
| user_id | INDEX |
| parent_goal_id | INDEX |

### 外部キー制約
| カラム | 参照先 | 削除時の挙動 |
|---|---|---|
| user_id | users.user_id | CASCADE |
| parent_goal_id | goals.id | SET NULL |

---

## tasks テーブル

| カラム名 | 型 | 属性 | 説明 |
|---|---|---|---|
| id | uuid | PRIMARY KEY | タスクID |
| goal_id | uuid | FK → goals.id | 紐づく目標ID |
| title | string |  | タスクタイトル |
| description | text | NULLABLE | タスク詳細・備考 |
| scheduled_at | timestamp | NULLABLE | 実行予定日時 |
| is_completed | boolean | DEFAULT false | 達成フラグ |
| completed_at | timestamp | NULLABLE | 達成日時 |
| created_at | timestamp | timestamps() | 作成日時 |
| updated_at | timestamp | timestamps() | 更新日時 |
| deleted_at | timestamp | softDeletes() | 削除日時（論理削除） |

### インデックス
| 対象カラム | 種別 |
|---|---|
| goal_id | INDEX |
| is_completed | INDEX |

### 外部キー制約
| カラム | 参照先 | 削除時の挙動 |
|---|---|---|
| goal_id | goals.id | CASCADE |