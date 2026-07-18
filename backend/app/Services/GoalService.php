<?php

namespace App\Services;

use App\Models\Goal;
use Illuminate\Support\Facades\Auth;

class GoalService
{
    /**
     * 目標一覧取得
     */
    public function getAll(): \Illuminate\Database\Eloquent\Collection
    {
        return Auth::user()->goals()
            ->orderBy('created_at', 'asc')
            ->get();
    }

    /**
     * 目標作成
     * 成功時: Goal / 失敗時: ['error' => string, 'status' => int]
     */
    public function create(array $data): Goal|array
    {
        // parent_goal_id の所有権チェック
        if (!empty($data['parent_goal_id'])) {
            $parent = Goal::find($data['parent_goal_id']);
            if ($parent && $parent->user_id !== Auth::id()) {
                return ['error' => '不正な親目標へのアクセスです', 'status' => 403];
            }
        }

        // ⚠️ Task 側と同じ理由で、create の二重送信は主キー重複の
        // PDOException → /api/sync 500 → バッチ内の他操作も巻き添えで
        // 失敗、というループを引き起こす。updateOrCreate で冪等にする。
        return Goal::updateOrCreate(
            ['id' => $data['id'] ?? null],
            [
                'user_id'        => Auth::id(),
                'title'          => $data['title'],
                'description'    => $data['description'] ?? null,
                'color_code'     => $data['color_code'] ?? null,
                'period_type'    => $data['period_type'],
                'due_at'         => $data['due_at'] ?? null,
                'parent_goal_id' => $data['parent_goal_id'] ?? null,
            ]
        );
    }

    /**
     * 目標更新
     * 成功時: Goal / 失敗時: ['error' => string, 'status' => int]
     */
    public function update(string $goalId, array $data): Goal|array
    {
        $goal = Goal::find($goalId);

        if (!$goal) {
            return ['error' => '目標が見つかりません', 'status' => 404];
        }

        if ($goal->user_id !== Auth::id()) {
            return ['error' => 'アクセス権限がありません', 'status' => 403];
        }

        $goal->update(array_filter([
            'title'        => $data['title'] ?? null,
            'description'  => $data['description'] ?? null,
            'color_code'   => $data['color_code'] ?? null,
            'period_type'  => $data['period_type'] ?? null,
            'due_at'       => $data['due_at'] ?? null,
            'is_completed' => $data['is_completed'] ?? null,
            'position_x'   => $data['position_x'] ?? null,
            'position_y'   => $data['position_y'] ?? null,
        ], fn($v) => $v !== null));

        return $goal;
    }

    /**
     * 目標削除（再帰的に子・タスクも削除）
     * 成功時: true / 失敗時: ['error' => string, 'status' => int]
     */
    public function delete(string $goalId): bool|array
    {
        $goal = Goal::find($goalId);

        if (!$goal) {
            return ['error' => '目標が見つかりません', 'status' => 404];
        }

        if ($goal->user_id !== Auth::id()) {
            return ['error' => 'アクセス権限がありません', 'status' => 403];
        }

        $this->deleteRecursively($goal);

        return true;
    }

    /** 複数目標の位置を一括更新（目標マップのドラッグ配置・オフライン同期用） */
    public function updatePositions(array $positions): array|bool
    {
        foreach ($positions as $item) {
            $goal = Goal::find($item['goal_id'] ?? null);
            if (!$goal || $goal->user_id !== Auth::id()) continue;
            $goal->update([
                'position_x' => $item['x'],
                'position_y' => $item['y'],
            ]);
        }
        return true;
    }

    private function deleteRecursively(Goal $goal): void
    {
        foreach ($goal->children as $child) {
            $this->deleteRecursively($child);
        }

        $goal->tasks()->delete();
        $goal->delete();
    }
}
