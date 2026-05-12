<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

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
}
