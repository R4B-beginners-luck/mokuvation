<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->uuid('id')->primary()->comment('タスクID');

            $table->uuid('goal_id')->comment('目標ID（紐づく目標）');

            $table->string('title')->comment('タスクタイトル');
            $table->text('description')->nullable()->comment('タスク詳細・備考');

            $table->timestamp('scheduled_at')->nullable()->comment('実行予定日時');

            $table->boolean('is_completed')->default(false)->comment('達成フラグ');
            $table->timestamp('completed_at')->nullable()->comment('達成日時');
            $table->timestamp('created_at')->nullable()->comment('作成日時');
            $table->timestamp('updated_at')->nullable()->comment('更新日時');
            $table->timestamp('deleted_at')->nullable()->comment('削除日時（論理削除）');

            $table->foreign('goal_id')
                ->references('id')
                ->on('goals')
                ->cascadeOnDelete();

            $table->index('goal_id');
            $table->index('is_completed');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};