<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        // 末端・中間の goal_id に紐づけてタスクを作成
        // ※ タスクはどの階層の目標にも紐づけられる想定

        $now = now();

        $tasks = [

            // ================================================================
            // 山田 太郎
            // ================================================================

            // L6: タスクAPIのCRUDを実装する に紐づくタスク
            [
                'id'           => 'tt000001-0000-0000-0000-000000000000',
                'goal_id'      => 'aa000006-0000-0000-0000-000000000000',
                'title'        => 'Laravelプロジェクトを作成する',
                'description'  => '`composer create-project laravel/laravel` でセットアップ',
                'scheduled_at' => '2026-05-01 19:00:00',
                'is_completed' => true,
                'completed_at' => '2026-05-01 20:30:00',
                'created_at'   => $now, 'updated_at' => $now,
            ],
            [
                'id'           => 'tt000002-0000-0000-0000-000000000000',
                'goal_id'      => 'aa000006-0000-0000-0000-000000000000',
                'title'        => 'DB設計・マイグレーションを作成する',
                'description'  => 'users / goals / tasks テーブルを設計する',
                'scheduled_at' => '2026-05-03 19:00:00',
                'is_completed' => true,
                'completed_at' => '2026-05-03 22:00:00',
                'created_at'   => $now, 'updated_at' => $now,
            ],
            [
                'id'           => 'tt000003-0000-0000-0000-000000000000',
                'goal_id'      => 'aa000006-0000-0000-0000-000000000000',
                'title'        => 'タスクCRUD APIを実装する',
                'description'  => '作成・取得・更新・削除のエンドポイントを作る',
                'scheduled_at' => '2026-05-10 19:00:00',
                'is_completed' => false,
                'completed_at' => null,
                'created_at'   => $now, 'updated_at' => $now,
            ],

            // L7: タスク作成APIのユニットテストを書く に紐づくタスク
            [
                'id'           => 'tt000004-0000-0000-0000-000000000000',
                'goal_id'      => 'aa000007-0000-0000-0000-000000000000',
                'title'        => 'PHPUnit のセットアップを確認する',
                'description'  => 'phpunit.xml の設定・テスト用DB接続を確認',
                'scheduled_at' => '2026-06-01 19:00:00',
                'is_completed' => false,
                'completed_at' => null,
                'created_at'   => $now, 'updated_at' => $now,
            ],
            [
                'id'           => 'tt000005-0000-0000-0000-000000000000',
                'goal_id'      => 'aa000007-0000-0000-0000-000000000000',
                'title'        => 'バリデーションの異常系テストを書く',
                'description'  => 'title未入力・goal_id不正などのケースを網羅する',
                'scheduled_at' => '2026-06-15 19:00:00',
                'is_completed' => false,
                'completed_at' => null,
                'created_at'   => $now, 'updated_at' => $now,
            ],

            // L4: 個人開発アプリを1本リリースする に紐づくタスク（中間階層の例）
            [
                'id'           => 'tt000006-0000-0000-0000-000000000000',
                'goal_id'      => 'aa000004-0000-0000-0000-000000000000',
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

            // L4: 週3回ジョギングを3ヶ月続ける に紐づくタスク
            [
                'id'           => 'tt000007-0000-0000-0000-000000000000',
                'goal_id'      => 'bb000004-0000-0000-0000-000000000000',
                'title'        => 'ランニングシューズを買う',
                'description'  => 'スポーツショップでフィッティングしてから購入する',
                'scheduled_at' => '2026-05-04 11:00:00',
                'is_completed' => true,
                'completed_at' => '2026-05-04 12:30:00',
                'created_at'   => $now, 'updated_at' => $now,
            ],
            [
                'id'           => 'tt000008-0000-0000-0000-000000000000',
                'goal_id'      => 'bb000004-0000-0000-0000-000000000000',
                'title'        => '朝のジョギング（30分）',
                'description'  => '公園を2周する',
                'scheduled_at' => '2026-05-05 06:30:00',
                'is_completed' => false,
                'completed_at' => null,
                'created_at'   => $now, 'updated_at' => $now,
            ],
            [
                'id'           => 'tt000009-0000-0000-0000-000000000000',
                'goal_id'      => 'bb000004-0000-0000-0000-000000000000',
                'title'        => '朝のジョギング（30分）',
                'description'  => null,
                'scheduled_at' => '2026-05-07 06:30:00',
                'is_completed' => false,
                'completed_at' => null,
                'created_at'   => $now, 'updated_at' => $now,
            ],

            // L2: 体重を10kg減らす に紐づくタスク（中間階層の例）
            [
                'id'           => 'tt000010-0000-0000-0000-000000000000',
                'goal_id'      => 'bb000002-0000-0000-0000-000000000000',
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

            // L2: TOEIC 800点を取得する に紐づくタスク
            [
                'id'           => 'tt000011-0000-0000-0000-000000000000',
                'goal_id'      => 'cc000002-0000-0000-0000-000000000000',
                'title'        => '英単語アプリをインストールする',
                'description'  => 'Anki または mikan を使う',
                'scheduled_at' => '2026-05-01 08:00:00',
                'is_completed' => true,
                'completed_at' => '2026-05-01 09:00:00',
                'created_at'   => $now, 'updated_at' => $now,
            ],
            [
                'id'           => 'tt000012-0000-0000-0000-000000000000',
                'goal_id'      => 'cc000002-0000-0000-0000-000000000000',
                'title'        => '今日の英単語30個を学習する',
                'description'  => null,
                'scheduled_at' => '2026-05-02 07:30:00',
                'is_completed' => false,
                'completed_at' => null,
                'created_at'   => $now, 'updated_at' => $now,
            ],
            [
                'id'           => 'tt000013-0000-0000-0000-000000000000',
                'goal_id'      => 'cc000002-0000-0000-0000-000000000000',
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
