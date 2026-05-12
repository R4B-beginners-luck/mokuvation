<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// 各機能を担当するコントローラーを読み込み
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\GoalController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\DashboardController;

/*
|--------------------------------------------------------------------------
| API Routes (API用ルーティング設定)
|--------------------------------------------------------------------------
| ここに定義されたルートは、自動的に URL の先頭に `/api` が付与されます。
| 例: `/api/auth/register`
*/

/**
 * --------------------------------------------------------------------------
 * 1. 認証不要のルート (Public Routes)
 * --------------------------------------------------------------------------
 * ログインしていない状態（アカウント作成時やログイン時）でもアクセス可能なエンドポイントです。
 */
Route::post('/auth/register', [AuthController::class, 'register']); // 新規ユーザー作成
Route::post('/auth/login', [AuthController::class, 'login']);       // ログイン（トークン発行）

/**
 * --------------------------------------------------------------------------
 * 2. 認証必須のルート (Protected Routes)
 * --------------------------------------------------------------------------
 * `auth:sanctum` ミドルウェアにより、有効なトークンを持っていないリクエストは
 * 自動的に 401 Unauthorized エラーとして遮断されます。
 */
Route::middleware('auth:sanctum')->group(function () {
    
    // --- ユーザー関連 ---
    Route::post('/auth/logout', [AuthController::class, 'logout']); // ログアウト（トークン破棄）
    Route::get('/users/me', [UserController::class, 'me']);         // ログイン中の自分の情報を取得

    // --- 目標管理 (Goals) ---
    // {goal} は「ルートモデルバインディング」機能を利用。URL の ID から自動で Goal モデルを取得します。
    Route::get('/goals', [GoalController::class, 'index']);           // 自分の目標一覧を取得
    Route::post('/goals', [GoalController::class, 'store']);          // 新しい目標を保存
    Route::get('/goals/{goal}', [GoalController::class, 'show']);     // 特定の目標の詳細を取得
    Route::patch('/goals/{goal}', [GoalController::class, 'update']); // 目標の内容を更新
    Route::delete('/goals/{goal}', [GoalController::class, 'destroy']);// 目標を削除

    // --- タスク管理 (Tasks) ---
    // 柔軟な取得（クエリパラメータでの絞り込み）を想定した設計です。
    Route::get('/tasks', [TaskController::class, 'index']);           // タスク一覧（日付や目標IDで検索可）を取得
    Route::post('/tasks', [TaskController::class, 'store']);          // 新しいタスクを保存（目標に紐付け）
    Route::get('/tasks/{task}', [TaskController::class, 'show']);     // 特定のタスクの詳細を取得
    Route::patch('/tasks/{task}', [TaskController::class, 'update']); // タスクの更新・達成状態の切り替え
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);// タスクを削除

    // --- 集計・ダッシュボード (Dashboard) ---
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']); // グラフ用データや連続達成日数を取得
});