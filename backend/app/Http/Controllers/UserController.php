<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    /**
     * ログイン中のユーザー情報を取得
     */
    public function me(Request $request)
    {
        // auth:sanctum ミドルウェアにより、$request->user() でログイン中のユーザーモデルが取得できる
        return response()->json($request->user());
    }

    /**
     * ログイン中ユーザーの設定を更新
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'theme_color' => ['sometimes', 'nullable', 'integer', 'between:0,4'],
            'user_name' => ['sometimes', 'required', 'string', 'max:10'],
            'user_id' => [
                'sometimes',
                'required',
                'string',
                'min:4',
                'max:32',
                Rule::unique('users', 'user_id')->ignore($user->user_id, 'user_id'),
            ],
        ]);

        $newUserId = $validated['user_id'] ?? null;
        $renamingId = is_string($newUserId) && $newUserId !== $user->user_id;

        if ($renamingId) {
            $oldUserId = $user->user_id;

            Schema::disableForeignKeyConstraints();
            try {
                DB::transaction(function () use ($oldUserId, $newUserId, $validated, $user) {
                    $payload = [];
                    if (array_key_exists('user_name', $validated)) {
                        $payload['user_name'] = $validated['user_name'];
                    }
                    if (array_key_exists('theme_color', $validated)) {
                        $payload['theme_color'] = $validated['theme_color'];
                    }
                    $payload['user_id'] = $newUserId;
                    $payload['updated_at'] = now();

                    DB::table('users')->where('user_id', $oldUserId)->update($payload);
                    DB::table('goals')->where('user_id', $oldUserId)->update(['user_id' => $newUserId]);
                    DB::table('tasks')->where('user_id', $oldUserId)->update(['user_id' => $newUserId]);
                    if (Schema::hasTable('crdt_changes')) {
                        DB::table('crdt_changes')->where('user_id', $oldUserId)->update(['user_id' => $newUserId]);
                    }
                    if (Schema::hasTable('personal_access_tokens')) {
                        DB::table('personal_access_tokens')
                            ->where('tokenable_type', $user->getMorphClass())
                            ->where('tokenable_id', $oldUserId)
                            ->update(['tokenable_id' => $newUserId]);
                    }
                });
            } finally {
                Schema::enableForeignKeyConstraints();
            }

            $user = $user->newQuery()->findOrFail($newUserId);
        } else {
            if (array_key_exists('user_name', $validated)) {
                $user->user_name = $validated['user_name'];
            }
            if (array_key_exists('theme_color', $validated)) {
                $user->theme_color = $validated['theme_color'];
            }
            $user->save();
        }

        return response()->json($user);
    }

    /**
     * ログイン中ユーザーのパスワード変更
     */
    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'max:72', 'confirmed'],
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['現在のパスワードが正しくありません。'],
            ]);
        }

        $user->password = Hash::make($validated['new_password']);
        $user->save();

        return response()->json([
            'message' => 'パスワードを変更しました',
        ]);
    }
}
