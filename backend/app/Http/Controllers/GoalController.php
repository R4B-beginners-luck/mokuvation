<?php

namespace App\Http\Controllers;

use App\Services\GoalService;
use App\Models\Goal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GoalController extends Controller
{
    public function __construct(private GoalService $goalService) {}

    public function index()
    {
        return response()->json($this->goalService->getAll());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'          => ['required', 'string', 'max:255'],
            'description'    => ['nullable', 'string'],
            'color_code'     => ['nullable', 'integer', 'between:0,11'],
            'period_type'    => ['required', 'string', 'in:short,middle,long'],
            'due_at'         => ['nullable', 'date'],
            'parent_goal_id' => ['nullable', 'uuid', 'exists:goals,id'],
        ]);

        $result = $this->goalService->create($validated);

        if (is_array($result)) {
            return response()->json(['message' => $result['error']], $result['status']);
        }

        return response()->json($result, 201);
    }

    public function show(Goal $goal)
    {
        if ($goal->user_id !== Auth::id()) {
            return response()->json(['message' => 'アクセス権限がありません'], 403);
        }

        return response()->json($goal->load(['children', 'tasks']));
    }

    public function update(Request $request, Goal $goal)
    {
        if ($goal->user_id !== Auth::id()) {
            return response()->json(['message' => 'アクセス権限がありません'], 403);
        }

        $validated = $request->validate([
            'title'        => ['sometimes', 'required', 'string', 'max:255'],
            'description'  => ['nullable', 'string'],
            'color_code'   => ['nullable', 'integer', 'between:0,11'],
            'period_type'  => ['sometimes', 'required', 'string', 'in:short,middle,long'],
            'due_at'       => ['nullable', 'date'],
            'is_completed' => ['sometimes', 'boolean'],
        ]);

        $result = $this->goalService->update($goal->id, $validated);

        if (is_array($result)) {
            return response()->json(['message' => $result['error']], $result['status']);
        }

        return response()->json($result);
    }

    public function destroy(Goal $goal)
    {
        if ($goal->user_id !== Auth::id()) {
            return response()->json(['message' => 'アクセス権限がありません'], 403);
        }

        $result = $this->goalService->delete($goal->id);

        if (is_array($result)) {
            return response()->json(['message' => $result['error']], $result['status']);
        }

        return response()->json(null, 204);
    }
}
