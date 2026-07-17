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

            // ⚠️ 以前はここで例外が飛ぶと（例：想定外のDB制約違反）
            // foreach 全体が中断し、リクエスト全体が 500 になっていた。
            // すると、このバッチに含まれる「他の」正常な操作（他デバイスの
            // タスク完了状態の更新など）まで一切処理されないまま応答が
            // 返ってしまい、フロント側も results を受け取れず何一つ
            // キューから消せないため、次回も同じバッチをまるごと再送し、
            // また同じ操作で例外→500…という無限ループになっていた。
            // 1操作ずつ try/catch し、失敗はこの操作だけの結果として
            // 返すことで、他の操作は正常に処理・反映されるようにする。
            try {
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
            } catch (\Throwable $e) {
                report($e); // laravel.log には残しつつ、このリクエスト自体は500にしない
                $result = ['error' => 'サーバー内部エラー: ' . $e->getMessage(), 'status' => 500];
            }

            // Service がエラー配列を返した場合
            if (is_array($result) && isset($result['error'])) {
                $results[] = [
                    'index'   => $index,
                    'status'  => 'error',
                    'message' => $result['error'],
                    'code'    => $result['status'],
                ];
            } else {
                $entry = [
                    'index'  => $index,
                    'status' => 'ok',
                ];

                // ⚠️ Task::create() 内で goal_id を、Goal::create() 内で
                // parent_goal_id を「参照先が既に削除されていたら null に
                // 補正する」処理を追加した。しかし今まではこのレスポンスが
                // { status: 'ok' } しか返さなかったため、フロント側は
                // サーバーがそう補正したこと自体を知る手段が無く、
                // ローカルDexie・CRDT docは送信時のまま（削除済みIDを
                // 参照した状態）で取り残されていた。
                // Task/Goal モデルが返ってきた（＝create/update成功）場合は
                // 補正後の実データも一緒に返し、フロント側で
                // ローカルの内容をこれに合わせて上書きできるようにする。
                if ($result instanceof \App\Models\Task || $result instanceof \App\Models\Goal) {
                    $entry['data'] = $result->toArray();
                }

                $results[] = $entry;
            }
        }

        return response()->json(['results' => $results]);
    }
}
