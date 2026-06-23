<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $tasks = [

            // ================================================================
            // 山田 太郎
            // ================================================================

            // タスクAPIのCRUDを実装する に紐づくタスク
            [
                'id'           => 'aaaaaaaa-1111-4000-8000-000000000001',
                'goal_id'      => '11111111-aaaa-4000-8000-000000000006',
                'user_id'      => 'user001',
                'title'        => 'Laravelプロジェクトを作成する',
                'description'  => '`composer create-project laravel/laravel` でセットアップ',
                'scheduled_at' => '2026-05-01 19:00:00',
                'is_completed' => true,
                'completed_at' => '2026-05-01 20:30:00',
                'created_at'   => $now, 'updated_at' => $now,
            ],
            [
                'id'           => 'aaaaaaaa-1111-4000-8000-000000000002',
                'goal_id'      => '11111111-aaaa-4000-8000-000000000006',
                'user_id'      => 'user001',
                'title'        => 'DB設計・マイグレーションを作成する',
                'description'  => 'users / goals / tasks テーブルを設計する',
                'scheduled_at' => '2026-05-03 19:00:00',
                'is_completed' => true,
                'completed_at' => '2026-05-03 22:00:00',
                'created_at'   => $now, 'updated_at' => $now,
            ],
            [
                'id'           => 'aaaaaaaa-1111-4000-8000-000000000003',
                'goal_id'      => '11111111-aaaa-4000-8000-000000000006',
                'user_id'      => 'user001',
                'title'        => 'タスクCRUD APIを実装する',
                'description'  => '作成・取得・更新・削除のエンドポイントを作る',
                'scheduled_at' => '2026-05-10 19:00:00',
                'is_completed' => false,
                'completed_at' => null,
                'created_at'   => $now, 'updated_at' => $now,
            ],

            // タスク作成APIのユニットテストを書く に紐づくタスク
            [
                'id'           => 'aaaaaaaa-1111-4000-8000-000000000004',
                'goal_id'      => '11111111-aaaa-4000-8000-000000000007',
                'user_id'      => 'user001',
                'title'        => 'PHPUnit のセットアップを確認する',
                'description'  => 'phpunit.xml の設定・テスト用DB接続を確認',
                'scheduled_at' => '2026-06-01 19:00:00',
                'is_completed' => false,
                'completed_at' => null,
                'created_at'   => $now, 'updated_at' => $now,
            ],
            [
                'id'           => 'aaaaaaaa-1111-4000-8000-000000000005',
                'goal_id'      => '11111111-aaaa-4000-8000-000000000007',
                'user_id'      => 'user001',
                'title'        => 'バリデーションの異常系テストを書く',
                'description'  => 'title未入力・goal_id不正などのケースを網羅する',
                'scheduled_at' => '2026-06-15 19:00:00',
                'is_completed' => false,
                'completed_at' => null,
                'created_at'   => $now, 'updated_at' => $now,
            ],

            // 個人開発アプリを1本リリースする に紐づくタスク
            [
                'id'           => 'aaaaaaaa-1111-4000-8000-000000000006',
                'goal_id'      => '11111111-aaaa-4000-8000-000000000004',
                'user_id'      => 'user001',
                'title'        => 'Renderにデプロイする',
                'description'  => '無料プランで本番環境を構築する',
                'scheduled_at' => null,
                'is_completed' => false,
                'completed_at' => null,
                'created_at'   => $now, 'updated_at' => $now,
            ],

            // ================================================================
            // 佐藤 花子
            // ================================================================

            // 週3回ジョギングを3ヶ月続ける に紐づくタスク
            [
                'id'           => 'aaaaaaaa-1111-4000-8000-000000000007',
                'goal_id'      => '22222222-bbbb-4000-8000-000000000004',
                'user_id'      => 'user002',
                'title'        => 'ランニングシューズを買う',
                'description'  => 'スポーツショップでフィッティングしてから購入する',
                'scheduled_at' => '2026-05-04 11:00:00',
                'is_completed' => true,
                'completed_at' => '2026-05-04 12:30:00',
                'created_at'   => $now, 'updated_at' => $now,
            ],
            [
                'id'           => 'aaaaaaaa-1111-4000-8000-000000000008',
                'goal_id'      => '22222222-bbbb-4000-8000-000000000004',
                'user_id'      => 'user002',
                'title'        => '朝のジョギング（30分）',
                'description'  => '公園を2周する',
                'scheduled_at' => '2026-05-05 06:30:00',
                'is_completed' => false,
                'completed_at' => null,
                'created_at'   => $now, 'updated_at' => $now,
            ],
            [
                'id'           => 'aaaaaaaa-1111-4000-8000-000000000009',
                'goal_id'      => '22222222-bbbb-4000-8000-000000000004',
                'user_id'      => 'user002',
                'title'        => '朝のジョギング（30分）',
                'description'  => null,
                'scheduled_at' => '2026-05-07 06:30:00',
                'is_completed' => false,
                'completed_at' => null,
                'created_at'   => $now, 'updated_at' => $now,
            ],

            // 体重を10kg減らす に紐づくタスク
            [
                'id'           => 'aaaaaaaa-1111-4000-8000-000000000010',
                'goal_id'      => '22222222-bbbb-4000-8000-000000000002',
                'user_id'      => 'user002',
                'title'        => '食事管理アプリに毎日記録する',
                'description'  => 'あすけん or MyFitnessPal を使って摂取カロリーを把握する',
                'scheduled_at' => '2026-05-01 21:00:00',
                'is_completed' => true,
                'completed_at' => '2026-05-01 21:15:00',
                'created_at'   => $now, 'updated_at' => $now,
            ],

            // ================================================================
            // 鈴木 一郎
            // ================================================================

            // TOEIC 800点を取得する に紐づくタスク
            [
                'id'           => 'aaaaaaaa-1111-4000-8000-000000000011',
                'goal_id'      => '33333333-cccc-4000-8000-000000000002',
                'user_id'      => 'user003',
                'title'        => '英単語アプリをインストールする',
                'description'  => 'Anki または mikan を使う',
                'scheduled_at' => '2026-05-01 08:00:00',
                'is_completed' => true,
                'completed_at' => '2026-05-01 09:00:00',
                'created_at'   => $now, 'updated_at' => $now,
            ],
            [
                'id'           => 'aaaaaaaa-1111-4000-8000-000000000012',
                'goal_id'      => '33333333-cccc-4000-8000-000000000002',
                'user_id'      => 'user003',
                'title'        => '今日の英単語30個を学習する',
                'description'  => null,
                'scheduled_at' => '2026-05-02 07:30:00',
                'is_completed' => false,
                'completed_at' => null,
                'created_at'   => $now, 'updated_at' => $now,
            ],
            [
                'id'           => 'aaaaaaaa-1111-4000-8000-000000000013',
                'goal_id'      => '33333333-cccc-4000-8000-000000000002',
                'user_id'      => 'user003',
                'title'        => 'リスニング問題集を購入する',
                'description'  => 'Part3・Part4 を重点的に対策できるものを選ぶ',
                'scheduled_at' => '2026-05-03 12:00:00',
                'is_completed' => false,
                'completed_at' => null,
                'created_at'   => $now, 'updated_at' => $now,
            ],

        ];

        DB::table('tasks')->insert($tasks);
    }
}
