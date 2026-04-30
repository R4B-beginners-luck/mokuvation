<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('goals', function (Blueprint $table) {
            $table->uuid('id')->primary()->comment('目標ID');

            $table->uuid('user_id')->comment('ユーザーID（所有者）');
            $table->uuid('parent_goal_id')->nullable()->comment('親目標ID（階層構造）');
            
            $table->string('title')->comment('目標タイトル');
            $table->text('description')->nullable()->comment('目標の詳細・備考');

            $table->string('period_type')->comment('期間区分（short:短期 / middle:中期 / long:長期）');
            $table->timestamp('due_at')->nullable()->comment('期限日時');
            $table->boolean('is_completed')->default(false)->comment('達成フラグ');

            $table->timestamp('created_at')->nullable()->comment('作成日時');
            $table->timestamp('updated_at')->nullable()->comment('更新日時');
            $table->timestamp('deleted_at')->nullable()->comment('削除日時（論理削除）');

            $table->foreign('user_id')
                ->references('user_id')
                ->on('users')
                ->cascadeOnDelete();

            $table->foreign('parent_goal_id')
                ->references('id')
                ->on('goals')
                ->nullOnDelete();

            $table->index('user_id');
            $table->index('parent_goal_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('goals');
    }
};