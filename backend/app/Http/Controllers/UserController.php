<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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
        $request->validate([
            'theme_color' => ['nullable', 'integer', 'between:0,4'],
        ]);

        $user = $request->user();
        $user->theme_color = $request->input('theme_color');
        $user->save();

        return response()->json($user);
    }
}
