<?php

namespace App\Services;

use App\Models\Task;
use App\Models\Goal;
use Illuminate\Support\Facades\Auth;

class TaskService
{
    /**
     * タスク一覧取得
     */
    public function getAll(?string $goalId = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = Task::where('user_id', Auth::id());

        if ($goalId) {
            $query->where('goal_id', $goalId);
        }

        return $query->get();
    }

    /**
     * タスク作成
     * 成功時: Task / 失敗時: ['error' => string, 'status' => int]
     */
    public function create(array $data): Task|array
    {
        // user_id の所有権チェック
        if (($data['user_id'] ?? null) !== Auth::id()) {
            return ['error' => '不正なユーザーIDです', 'status' => 403];
        }

        // goal_id の所有権チェック
        if (!empty($data['goal_id'])) {
            $goal = Goal::find($data['goal_id']);
            if ($goal && $goal->user_id !== Auth::id()) {
                return ['error' => '不正な目標へのアクセスです', 'status' => 403];
            }
        }

        // ⚠️ クライアント生成UUIDを使うため、同じ create 操作が二重送信されると
        // （オンライン復帰直後に複数のタイマー/イベントから flushQueue() が
        // 同時に走る等）Task::create() が主キー重複の PDOException を投げ、
        // /api/sync のリクエスト全体が 500 で落ちる。その結果、同じバッチに
        // 含まれる他の操作（他デバイスのタスク完了状態更新など）も一切処理
        // されずに巻き添えで失敗し、キューに残って何度も再送→再度500…という
        // 無限ループになっていた。
        // updateOrCreate にして「そのIDが既にあれば中身を合わせるだけ」の
        // 冪等な処理にすることで、二重送信されても安全に成功として扱える。
        return Task::updateOrCreate(
            ['id' => $data['id'] ?? null],
            [
                'goal_id'      => $data['goal_id'] ?? null,
                'user_id'      => $data['user_id'],
                'title'        => $data['title'],
                'description'  => $data['description'] ?? null,
                'scheduled_at' => $data['scheduled_at'] ?? null,
            ]
        );
    }

    /**
     * タスク更新
     * 成功時: Task / 失敗時: ['error' => string, 'status' => int]
     */
    public function update(string $taskId, array $data): Task|array
    {
        $task = Task::find($taskId);

        if (!$task) {
            return ['error' => 'タスクが見つかりません', 'status' => 404];
        }

        if ($task->user_id !== Auth::id()) {
            return ['error' => 'アクセス権限がありません', 'status' => 403];
        }

        $updateData = array_filter([
            'title'        => $data['title'] ?? null,
            'description'  => $data['description'] ?? null,
            'scheduled_at' => $data['scheduled_at'] ?? null,
        ], fn($v) => $v !== null);

        if (isset($data['is_completed'])) {
            $updateData['is_completed'] = $data['is_completed'];
            $updateData['completed_at'] = $data['is_completed'] ? now() : null;
        }

        $task->update($updateData);

        return $task;
    }

    /**
     * タスク削除
     * 成功時: true / 失敗時: ['error' => string, 'status' => int]
     */
    public function delete(string $taskId): bool|array
    {
        $task = Task::find($taskId);

        if (!$task) {
            return ['error' => 'タスクが見つかりません', 'status' => 404];
        }

        if ($task->user_id !== Auth::id()) {
            return ['error' => 'アクセス権限がありません', 'status' => 403];
        }

        $task->delete();

        return true;
    }
}
