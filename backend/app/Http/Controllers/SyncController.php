<?php

namespace App\Http\Controllers;

use App\Services\TaskService;
use App\Services\GoalService;
use Illuminate\Http\Request;

/**
 * SyncController
 *
 * フロントの sync_queue に積まれたオフライン操作を一括で受け取り処理する。
 *
 * リクエスト形式:
 * POST /api/sync
 * {
 *   "operations": [
 *     { "entity": "task", "operation": "update", "payload": { "id": "...", "is_completed": true } },
 *     { "entity": "task", "operation": "delete", "payload": { "id": "..." } },
 *     { "entity": "goal", "operation": "update", "payload": { "id": "...", "is_completed": true } }
 *   ]
 * }
 *
 * レスポンス形式:
 * {
 *   "results": [
 *     { "index": 0, "status": "ok" },
 *     { "index": 1, "status": "error", "message": "タスクが見つかりません" }
 *   ]
 * }
 */
class SyncController extends Controller
{
    public function __construct(
        private TaskService $taskService,
        private GoalService $goalService,
    ) {}

    public function handle(Request $request)
    {
        $request->validate([
            'operations'             => ['required', 'array'],
            'operations.*.entity'    => ['required', 'string', 'in:task,goal'],
            'operations.*.operation' => ['required', 'string', 'in:create,update,delete'],
            'operations.*.payload'   => ['required', 'array'],
        ]);

        $results = [];

        foreach ($request->operations as $index => $op) {
            $entity    = $op['entity'];
            $operation = $op['operation'];
            $payload   = $op['payload'];

            $result = match (true) {
                $entity === 'task' && $operation === 'create' => $this->taskService->create($payload),
                $entity === 'task' && $operation === 'update' => $this->taskService->update($payload['id'], $payload),
                $entity === 'task' && $operation === 'delete' => $this->taskService->delete($payload['id']),
                $entity === 'goal' && $operation === 'create' => $this->goalService->create($payload),
                // positions キーがある場合は一括位置更新（目標マップのドラッグ配置）
                $entity === 'goal' && $operation === 'update' && isset($payload['positions'])
                    => $this->goalService->updatePositions($payload['positions']),
                $entity === 'goal' && $operation === 'update' => $this->goalService->update($payload['id'], $payload),
                $entity === 'goal' && $operation === 'delete' => $this->goalService->delete($payload['id']),
                default => ['error' => '不明な操作です', 'status' => 400],
            };

            // Service がエラー配列を返した場合
            if (is_array($result) && isset($result['error'])) {
                $results[] = [
                    'index'   => $index,
                    'status'  => 'error',
                    'message' => $result['error'],
                    'code'    => $result['status'],
                ];
            } else {
                $results[] = [
                    'index'  => $index,
                    'status' => 'ok',
                ];
            }
        }

        return response()->json(['results' => $results]);
    }
}
