<?php

namespace App\Http\Controllers;

use App\Services\GoalService;
use App\Models\Goal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

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
            'position_x' => ['nullable', 'numeric', 'between:-10000,10000'],
            'position_y' => ['nullable', 'numeric', 'between:-10000,10000'],
        ]);

        if ($goal->period_type === 'long' && array_key_exists('position_x', $validated)) {
            $validated['position_x'] = 0;
            $validated['position_y'] = 0;
        }
        $result = $this->goalService->update($goal->id, $validated);


        if (is_array($result)) {
            return response()->json(['message' => $result['error']], $result['status']);
        }

        return response()->json($result);
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

        $result = $this->goalService->delete($goal->id);

        if (is_array($result)) {
            return response()->json(['message' => $result['error']], $result['status']);
        }

        return response()->json(null, 204);
    }
}
