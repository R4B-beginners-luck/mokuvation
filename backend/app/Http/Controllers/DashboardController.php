<?php

namespace App\Http\Controllers;

use App\Models\Goal;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * ダッシュボード用の集計データを取得
     */
    public function summary(Request $request)
    {
        $userId = Auth::id();

        // 1. 目標の集計
        $totalGoals = Goal::where('user_id', $userId)->count();
        $completedGoals = Goal::where('user_id', $userId)->where('is_completed', true)->count();
        
        // 2. ユーザーが所有するすべての目標IDを取得（タスク集計のベース）
        $userGoalIds = Goal::where('user_id', $userId)->pluck('id');

        // 3. タスクの集計
        $totalTasks = Task::whereIn('goal_id', $userGoalIds)->count();
        $completedTasks = Task::whereIn('goal_id', $userGoalIds)->where('is_completed', true)->count();

        // 4. 直近の活動（過去7日間に達成したタスク数）
        $recentCompletedTasks = Task::whereIn('goal_id', $userGoalIds)
            ->where('is_completed', true)
            ->where('completed_at', '>=', Carbon::now()->subDays(7))
            ->count();

        // JSONとして成形して返却
        return response()->json([
            'goals' => [
                'total' => $totalGoals,
                'completed' => $completedGoals,
                'progress_percentage' => $totalGoals > 0 ? round(($completedGoals / $totalGoals) * 100) : 0,
            ],
            'tasks' => [
                'total' => $totalTasks,
                'completed' => $completedTasks,
                'recent_completed' => $recentCompletedTasks,
                'progress_percentage' => $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0,
            ]
        ]);
    }
}