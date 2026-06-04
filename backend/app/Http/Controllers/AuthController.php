<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request; // FormRequestではなく標準のRequestを使用
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * 新規ユーザー登録
     */
    public function register(Request $request)
    {
        // 1. コントローラー内で最低限のバリデーション（DBエラー回避）
        $request->validate([
            'user_id' => ['required', 'string', 'unique:users,user_id'], // 重複チェックは必須
            'user_name' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        // 2. データの保存
        $user = User::create([
            'user_id' => $request->user_id,
            'user_name' => $request->user_name,
            'password' => Hash::make($request->password), // ハッシュ化は必須
        ]);

        // 3. SanctumによるAPIトークンの発行
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'ユーザー登録が完了しました',
            'user' => $user,
            'token' => $token
        ], 201);
    }

    /**
     * ログイン
     */
    public function login(Request $request)
    {
        // 最低限の必須チェック
        $request->validate([
            'user_id' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        // 1. ユーザーIDで検索
        $user = User::where('user_id', $request->user_id)->first();

        // 2. 存在確認とパスワードの照合
        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'user_id' => ['ユーザーIDまたはパスワードが正しくありません。'],
            ]);
        }

        // 3. APIトークンの発行
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'ログインに成功しました',
            'user' => $user,
            'token' => $token
        ]);
    }

    /**
     * ログアウト
     */
    public function logout(Request $request)
    {
        // 現在のリクエストに使用されているトークンのみを破棄（無効化）する
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'ログアウトしました'
        ]);
    }
}