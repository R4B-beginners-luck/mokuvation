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

        return Auth::user()->goals()->create([
            // Task 側と同様、クライアントが生成した UUID があれば優先する
            // （オフライン作成 → 同期時の重複/ID不整合を防ぐため）
            'id'             => $data['id'] ?? null,
            'title'          => $data['title'],
            'description'    => $data['description'] ?? null,
            'color_code'     => $data['color_code'] ?? null,
            'period_type'    => $data['period_type'],
            'due_at'         => $data['due_at'] ?? null,
            'parent_goal_id' => $data['parent_goal_id'] ?? null,
        ]);
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

    private function deleteRecursively(Goal $goal): void
    {
        foreach ($goal->children as $child) {
            $this->deleteRecursively($child);
        }

        $goal->tasks()->delete();
        $goal->delete();
    }
}
