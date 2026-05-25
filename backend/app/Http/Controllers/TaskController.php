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
     * ログインユーザーのタスクを直接取得（目標に紐づかないタスクも含む）。
     */
    public function index(Request $request)
    {
        // 修正: ログインユーザーのタスクを直接検索する（goal_idの有無は問わない）
        $query = Task::where('user_id', Auth::id());

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
            'goal_id' => ['nullable', 'uuid', 'exists:goals,id'],
            'user_id' => ['required', 'string'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'scheduled_at' => ['nullable', 'date'],
        ]);

        // セキュリティ対策: フロントから送信されたuser_idが本当にログイン中のユーザーか検証
        if ($validated['user_id'] !== Auth::id()) {
            return response()->json(['message' => '不正なユーザーIDです'], 403);
        }

        // 目標が指定されている場合は、その目標の所有権をチェック
        if ($request->filled('goal_id')) {
            $goal = Goal::find($request->goal_id);
            if ($goal && $goal->user_id !== Auth::id()) {
                return response()->json(['message' => '不正な目標へのアクセスです'], 403);
            }
        }

        $task = Task::create($validated);

        return response()->json($task, 201);
    }

    /**
     * タスクの詳細情報取得
     */
    public function show(Task $task)
    {
        // 修正: Taskテーブルが直接持つ user_id を使って権限チェックを行う
        if ($task->user_id !== Auth::id()) {
            return response()->json(['message' => 'アクセス権限がありません'], 403);
        }

        return response()->json($task);
    }

    /**
     * タスク情報更新
     */
    public function update(Request $request, Task $task)
    {
        // 修正: Taskテーブルが直接持つ user_id を使って権限チェックを行う
        if ($task->user_id !== Auth::id()) {
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
        // 修正: Taskテーブルが直接持つ user_id を使って権限チェックを行う
        if ($task->user_id !== Auth::id()) {
            return response()->json(['message' => 'アクセス権限がありません'], 403);
        }

        $task->delete();

        return response()->json(null, 204);
    }
}