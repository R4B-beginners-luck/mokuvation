<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Goal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskController extends Controller
{
    /**
     * タスク一覧表示
     * ログインユーザーの目標に紐づくタスクのみを取得。
     */
    public function index(Request $request)
    {
        // ログインユーザーが所有するすべての目標IDを取得
        $userGoalIds = Auth::user()->goals()->pluck('id');

        $query = Task::whereIn('goal_id', $userGoalIds);

        // フロントから ?goal_id=xxx で特定の目標のタスクのみに絞り込む機能
        if ($request->has('goal_id')) {
            $query->where('goal_id', $request->goal_id);
        }

        return response()->json($query->get());
    }

    /**
     * 新規タスク作成
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'goal_id' => ['required', 'uuid', 'exists:goals,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'scheduled_at' => ['nullable', 'date'],
        ]);

        // 紐付ける対象の目標が、本当にログインユーザーのものか厳格にチェック
        $goal = Goal::find($request->goal_id);
        if ($goal->user_id !== Auth::id()) {
            return response()->json(['message' => '不正な目標へのアクセスです'], 403);
        }

        $task = Task::create($validated);

        return response()->json($task, 201);
    }

    /**
     * タスクの詳細情報取得
     */
    public function show(Task $task)
    {
        // タスク -> 目標 -> ユーザーID の順で所有権を確認
        if ($task->goal->user_id !== Auth::id()) {
            return response()->json(['message' => 'アクセス権限がありません'], 403);
        }

        return response()->json($task);
    }

    /**
     * タスク情報更新
     */
    public function update(Request $request, Task $task)
    {
        if ($task->goal->user_id !== Auth::id()) {
            return response()->json(['message' => 'アクセス権限がありません'], 403);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'scheduled_at' => ['nullable', 'date'],
            'is_completed' => ['sometimes', 'boolean'],
        ]);

        // 達成フラグ (is_completed) が送信された場合、completed_at を自動で制御する
        if ($request->has('is_completed')) {
            if ($request->is_completed) {
                $validated['completed_at'] = now(); // 達成時に現在時刻をセット
            } else {
                $validated['completed_at'] = null;  // 未達成に戻した場合はクリア
            }
        }

        $task->update($validated);

        return response()->json($task);
    }

    /**
     * タスク削除
     */
    public function destroy(Task $task)
    {
        if ($task->goal->user_id !== Auth::id()) {
            return response()->json(['message' => 'アクセス権限がありません'], 403);
        }

        $task->delete();

        return response()->json(null, 204);
    }
}