<?php

namespace App\Http\Controllers;

use App\Services\TaskService;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskController extends Controller
{
    public function __construct(private TaskService $taskService) {}

    public function index(Request $request)
    {
        $tasks = $this->taskService->getAll($request->goal_id);
        return response()->json($tasks);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'goal_id'      => ['nullable', 'uuid', 'exists:goals,id'],
            'user_id'      => ['required', 'string'],
            'title'        => ['required', 'string', 'max:255'],
            'description'  => ['nullable', 'string'],
            'scheduled_at' => ['nullable', 'date'],
        ]);

        $result = $this->taskService->create($validated);

        if (is_array($result)) {
            return response()->json(['message' => $result['error']], $result['status']);
        }

        return response()->json($result, 201);
    }

    public function show(Task $task)
    {
        if ($task->user_id !== Auth::id()) {
            return response()->json(['message' => 'アクセス権限がありません'], 403);
        }

        return response()->json($task);
    }

    public function update(Request $request, Task $task)
    {
        if ($task->user_id !== Auth::id()) {
            return response()->json(['message' => 'アクセス権限がありません'], 403);
        }

        $validated = $request->validate([
            'title'        => ['sometimes', 'required', 'string', 'max:255'],
            'description'  => ['nullable', 'string'],
            'scheduled_at' => ['nullable', 'date'],
            'is_completed' => ['sometimes', 'boolean'],
        ]);

        $result = $this->taskService->update($task->id, $validated);

        if (is_array($result)) {
            return response()->json(['message' => $result['error']], $result['status']);
        }

        return response()->json($result);
    }

    public function destroy(Task $task)
    {
        if ($task->user_id !== Auth::id()) {
            return response()->json(['message' => 'アクセス権限がありません'], 403);
        }

        $result = $this->taskService->delete($task->id);

        if (is_array($result)) {
            return response()->json(['message' => $result['error']], $result['status']);
        }

        return response()->json(null, 204);
    }
}
