<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'user_id'    => 'user001',
                'user_name'  => '山田 太郎',
                'password'   => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id'    => 'user002',
                'user_name'  => '佐藤 花子',
                'password'   => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id'    => 'user003',
                'user_name'  => '鈴木 一郎',
                'password'   => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('users')->insert($users);
    }
}
