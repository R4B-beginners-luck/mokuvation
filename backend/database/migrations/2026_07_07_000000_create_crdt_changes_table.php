<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * crdt_changes テーブル
 *
 * Automergeの変更バイナリ（change）を溜めるだけの「配送係」用テーブル。
 * サーバー（PHP）にはAutomergeの実装が無いため、change_blobの中身は
 * 一切解釈しない。マージ処理はクライアント側（Automerge JS）が担当する。
 *
 * id (auto increment) を「どこまで取り込み済みか」のカーソルとして使うため、
 * 論理削除やupdated_atは持たせず、追記専用（append-only）のシンプルなログにしている。
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('crdt_changes', function (Blueprint $table) {
            $table->id()->comment('pullカーソルとして使う連番ID');

            $table->string('user_id')->comment('変更の所有者ユーザーID');
            $table->string('device_id')->comment('変更を発行した端末ID（ログ・デバッグ用。マージ判定には使わない）');
            $table->text('change_blob')->comment('Automergeの変更バイナリをbase64化したもの。サーバー側では中身を解釈しない');

            $table->timestamp('created_at')->useCurrent()->comment('サーバーに届いた日時');

            $table->foreign('user_id')
                ->references('user_id')
                ->on('users')
                ->cascadeOnDelete();

            // pull時の「user_id かつ id > since」検索に使う複合インデックス
            $table->index(['user_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crdt_changes');
    }
};
