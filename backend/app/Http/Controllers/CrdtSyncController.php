<?php

namespace App\Http\Controllers;

use App\Models\CrdtChange;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * CrdtSyncController
 *
 * フロント（Automerge/JS）が生成した「変更バイナリ（change）」を
 * ただ配送するだけのコントローラー。
 *
 * サーバー（PHP）にはAutomergeの実装が無い（公式PHPバインディング無し）ため、
 * change_blob の中身は一切解釈・検証しない。マージ処理は必ずクライアント側
 * （crdtStore.ts の Automerge.applyChanges）が担当する設計。
 *
 * POST /api/crdt/push : 自端末発の変更を追記する
 * GET  /api/crdt/pull  : since より新しい、自分（全端末）の変更を取得する
 */
class CrdtSyncController extends Controller
{
    /**
     * 自端末で発生したAutomergeの変更（base64の配列）を追記する。
     * 中身を解釈しないため、そのままバルクinsertするだけでよい。
     */
    public function push(Request $request)
    {
        $validated = $request->validate([
            'device_id'  => ['required', 'string', 'max:255'],
            'changes'    => ['required', 'array', 'min:1'],
            'changes.*'  => ['required', 'string'],
        ]);

        $userId   = Auth::id();
        $deviceId = $validated['device_id'];
        $now      = now();

        $rows = array_map(
            fn (string $blob) => [
                'user_id'     => $userId,
                'device_id'   => $deviceId,
                'change_blob' => $blob,
                'created_at'  => $now,
            ],
            $validated['changes']
        );

        CrdtChange::insert($rows);

        return response()->json([
            'status' => 'ok',
            'count'  => count($rows),
        ]);
    }

    /**
     * since（crdt_changes.id）より新しい、自分（同一ユーザーの全端末分）の
     * 変更を古い順で返す。
     *
     * 自端末が送った分も含めて返す想定 — Automerge.applyChanges は
     * 取り込み済みの change を渡されても冪等なので、クライアント側で
     * 「自分が出した変更かどうか」を除外する必要はない。
     */
    public function pull(Request $request)
    {
        $validated = $request->validate([
            'since' => ['nullable', 'integer', 'min:0'],
        ]);

        $sinceId = $validated['since'] ?? 0;
        $userId  = Auth::id();

        $changes = CrdtChange::where('user_id', $userId)
            ->where('id', '>', $sinceId)
            ->orderBy('id')
            ->get(['id', 'change_blob']);

        $latestId = $changes->isNotEmpty()
            ? (int) $changes->last()->id
            : $sinceId;

        return response()->json([
            'changes'   => $changes,
            'latest_id' => $latestId,
        ]);
    }
}
