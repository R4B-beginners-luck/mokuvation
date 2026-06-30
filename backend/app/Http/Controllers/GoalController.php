<?php

namespace App\Http\Controllers;

use App\Models\Goal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class GoalController extends Controller
{
    /**
     * 目標一覧取得
     * ログインユーザー本人の目標のみを取得。
     * 親目標のみを抽出し、子目標をEager LoadingすることでN+1問題を防止。
     */
    public function index()
    {
        $goals = Auth::user()->goals()
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($goals);
    }

    /**
     * 新規目標作成
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            // パレットのインデックス（0〜11）を整数で受け取る
            'color_code' => ['nullable', 'integer', 'between:0,11'],
            'period_type' => ['required', 'string', 'in:short,middle,long'],
            'due_at' => ['nullable', 'date'],
            'parent_goal_id' => ['nullable', 'uuid', 'exists:goals,id'],
        ]);

        // ログインユーザーに紐付けて作成
        $goal = Auth::user()->goals()->create($validated);

        return response()->json($goal, 201);
    }

    /**
     * 目標詳細取得
     */
    public function show(Goal $goal)
    {
        // 所有権の確認（認可）
        if ($goal->user_id !== Auth::id()) {
            return response()->json(['message' => 'アクセス権限がありません'], 403);
        }

        return response()->json($goal->load(['children', 'tasks']));
    }

    /**
     * 目標情報更新
     */
    public function update(Request $request, Goal $goal)
    {
        if ($goal->user_id !== Auth::id()) {
            return response()->json(['message' => 'アクセス権限がありません'], 403);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'color_code' => ['nullable', 'integer', 'between:0,11'],
            'period_type' => ['sometimes', 'required', 'string', 'in:short,middle,long'],
            'due_at' => ['nullable', 'date'],
            'is_completed' => ['sometimes', 'boolean'],
            'position_x' => ['nullable', 'numeric', 'between:-10000,10000'],
            'position_y' => ['nullable', 'numeric', 'between:-10000,10000'],
        ]);

        if ($goal->period_type === 'long' && array_key_exists('position_x', $validated)) {
            $validated['position_x'] = 0;
            $validated['position_y'] = 0;
        }

        $goal->update($validated);

        return response()->json($goal);
    }

    /**
     * 目標マップ上の座標を一括更新
     */
    public function updatePositions(Request $request)
    {
        $validated = $request->validate([
            'positions' => ['required', 'array', 'min:1', 'max:200'],
            'positions.*.goal_id' => ['required', 'uuid'],
            'positions.*.x' => ['required', 'numeric', 'between:-10000,10000'],
            'positions.*.y' => ['required', 'numeric', 'between:-10000,10000'],
        ]);

        $userId = Auth::id();
        $requestedIds = collect($validated['positions'])->pluck('goal_id')->unique()->values();
        $ownedGoals = Goal::query()
            ->where('user_id', $userId)
            ->whereIn('id', $requestedIds)
            ->get()
            ->keyBy('id');

        $invalidIds = $requestedIds->diff($ownedGoals->keys())->values();
        if ($invalidIds->isNotEmpty()) {
            return response()->json([
                'message' => '更新できない目標IDが含まれています。',
                'invalid_goal_ids' => $invalidIds,
            ], 422);
        }

        DB::transaction(function () use ($validated, $ownedGoals) {
            foreach ($validated['positions'] as $item) {
                /** @var Goal $goal */
                $goal = $ownedGoals->get($item['goal_id']);

                if ($goal->period_type === 'long') {
                    $goal->update([
                        'position_x' => 0,
                        'position_y' => 0,
                    ]);
                    continue;
                }

                $goal->update([
                    'position_x' => $item['x'],
                    'position_y' => $item['y'],
                ]);
            }
        });

        return response()->json([
            'updated' => count($validated['positions']),
        ]);
    }

    /**
     * 目標削除（論理削除）
     */
    public function destroy(Goal $goal)
    {
        if ($goal->user_id !== Auth::id()) {
            return response()->json(['message' => 'アクセス権限がありません'], 403);
        }

        $this->deleteGoalRecursively($goal);

        return response()->json(null, 204);
    }

    private function deleteGoalRecursively(Goal $goal): void
    {
        foreach ($goal->children as $child) {
            $this->deleteGoalRecursively($child);
        }

        $goal->tasks()->delete();
        $goal->delete();
    }
}