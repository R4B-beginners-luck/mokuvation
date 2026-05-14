<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GoalSeeder extends Seeder
{
    public function run(): void
    {
        $user1 = 'user001'; 
        $user2 = 'user002'; 
        $user3 = 'user003'; 
        
        $now = now();

        $goals = [
            // 山田 太郎
            [
                'id'             => 'aa000001-0000-0000-0000-000000000000',
                'user_id'        => $user1,
                'parent_goal_id' => null,
                'title'          => 'フリーランスエンジニアとして独立する',
                'description'    => '会社に依存せず、自分の技術で生計を立てる',
                'period_type'    => 'long',
                'due_at'         => '2032-12-31 23:59:59',
                'is_completed'   => false,
                'created_at'     => $now, 'updated_at' => $now,
            ],
            [
                'id'             => 'aa000002-0000-0000-0000-000000000000',
                'user_id'        => $user1,
                'parent_goal_id' => 'aa000001-0000-0000-0000-000000000000',
                'title'          => 'Web系の実績・ポートフォリオを5本作る',
                'description'    => '案件獲得に使える公開実績を用意する',
                'period_type'    => 'long',
                'due_at'         => '2030-12-31 23:59:59',
                'is_completed'   => false,
                'created_at'     => $now, 'updated_at' => $now,
            ],
            [
                'id'             => 'aa000003-0000-0000-0000-000000000000',
                'user_id'        => $user1,
                'parent_goal_id' => 'aa000002-0000-0000-0000-000000000000',
                'title'          => 'LaravelとReactでフルスタック開発できるようになる',
                'description'    => 'バックエンドAPIとフロントエンドを1人で完結できるスキルを身につける',
                'period_type'    => 'long',
                'due_at'         => '2028-12-31 23:59:59',
                'is_completed'   => false,
                'created_at'     => $now, 'updated_at' => $now,
            ],
            [
                'id'             => 'aa000004-0000-0000-0000-000000000000',
                'user_id'        => $user1,
                'parent_goal_id' => 'aa000003-0000-0000-0000-000000000000',
                'title'          => '個人開発アプリを1本リリースする',
                'description'    => 'ゴール管理アプリをリリースしてユーザーを獲得する',
                'period_type'    => 'middle',
                'due_at'         => '2027-12-31 23:59:59',
                'is_completed'   => false,
                'created_at'     => $now, 'updated_at' => $now,
            ],
            [
                'id'             => 'aa000005-0000-0000-0000-000000000000',
                'user_id'        => $user1,
                'parent_goal_id' => 'aa000004-0000-0000-0000-000000000000',
                'title'          => 'バックエンドAPIをすべて完成させる',
                'description'    => 'ユーザー・目標・タスクのCRUD APIを設計・実装・テストまで完了する',
                'period_type'    => 'middle',
                'due_at'         => '2027-03-31 23:59:59',
                'is_completed'   => false,
                'created_at'     => $now, 'updated_at' => $now,
            ],
            [
                'id'             => 'aa000006-0000-0000-0000-000000000000',
                'user_id'        => $user1,
                'parent_goal_id' => 'aa000005-0000-0000-0000-000000000000',
                'title'          => 'タスクAPIのCRUDを実装する',
                'description'    => 'タスクの作成・取得・更新・削除エンドポイントを作る',
                'period_type'    => 'short',
                'due_at'         => '2026-12-31 23:59:59',
                'is_completed'   => false,
                'created_at'     => $now, 'updated_at' => $now,
            ],
            [
                'id'             => 'aa000007-0000-0000-0000-000000000000',
                'user_id'        => $user1,
                'parent_goal_id' => 'aa000006-0000-0000-0000-000000000000',
                'title'          => 'タスク作成APIのユニットテストを書く',
                'description'    => 'PHPUnitでバリデーション・正常系・異常系を網羅する',
                'period_type'    => 'short',
                'due_at'         => '2026-09-30 23:59:59',
                'is_completed'   => false,
                'created_at'     => $now, 'updated_at' => $now,
            ],

            // 佐藤 花子
            [
                'id'             => 'bb000001-0000-0000-0000-000000000000',
                'user_id'        => $user2,
                'parent_goal_id' => null,
                'title'          => '健康的な生活習慣を定着させる',
                'description'    => '体重・睡眠・食事・運動のすべてを整える',
                'period_type'    => 'long',
                'due_at'         => '2030-12-31 23:59:59',
                'is_completed'   => false,
                'created_at'     => $now, 'updated_at' => $now,
            ],
            [
                'id'             => 'bb000002-0000-0000-0000-000000000000',
                'user_id'        => $user2,
                'parent_goal_id' => 'bb000001-0000-0000-0000-000000000000',
                'title'          => '体重を10kg減らす',
                'description'    => '健康診断の数値を正常範囲に戻す',
                'period_type'    => 'middle',
                'due_at'         => '2027-12-31 23:59:59',
                'is_completed'   => false,
                'created_at'     => $now, 'updated_at' => $now,
            ],
            [
                'id'             => 'bb000003-0000-0000-0000-000000000000',
                'user_id'        => $user2,
                'parent_goal_id' => 'bb000002-0000-0000-0000-000000000000',
                'title'          => '今年中に5kg減らす',
                'description'    => '食事管理と運動を組み合わせて年内に結果を出す',
                'period_type'    => 'short',
                'due_at'         => '2026-12-31 23:59:59',
                'is_completed'   => false,
                'created_at'     => $now, 'updated_at' => $now,
            ],
            [
                'id'             => 'bb000004-0000-0000-0000-000000000000',
                'user_id'        => $user2,
                'parent_goal_id' => 'bb000003-0000-0000-0000-000000000000',
                'title'          => '週3回ジョギングを3ヶ月続ける',
                'description'    => '朝30分、近所の公園を走る。まず習慣化を最優先にする',
                'period_type'    => 'short',
                'due_at'         => '2026-09-30 23:59:59',
                'is_completed'   => false,
                'created_at'     => $now, 'updated_at' => $now,
            ],

            // 鈴木 一郎
            [
                'id'             => 'cc000001-0000-0000-0000-000000000000',
                'user_id'        => $user3,
                'parent_goal_id' => null,
                'title'          => '英語で技術記事を書けるようになる',
                'description'    => 'Dev.to に投稿できるレベルを目指す',
                'period_type'    => 'middle',
                'due_at'         => '2027-06-30 23:59:59',
                'is_completed'   => false,
                'created_at'     => $now, 'updated_at' => $now,
            ],
            [
                'id'             => 'cc000002-0000-0000-0000-000000000000',
                'user_id'        => $user3,
                'parent_goal_id' => 'cc000001-0000-0000-0000-000000000000',
                'title'          => 'TOEIC 800点を取得する',
                'description'    => '英語で読み書きできる土台として語学スコアを証明する',
                'period_type'    => 'short',
                'due_at'         => '2026-12-31 23:59:59',
                'is_completed'   => false,
                'created_at'     => $now, 'updated_at' => $now,
            ],
        ];

        DB::table('goals')->insert($goals);
    }
}