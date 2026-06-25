<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('goals', function (Blueprint $table) {
            $table->decimal('position_x', 10, 2)->nullable()->after('is_completed')->comment('目標マップ上のX座標');
            $table->decimal('position_y', 10, 2)->nullable()->after('position_x')->comment('目標マップ上のY座標');
        });
    }

    public function down(): void
    {
        Schema::table('goals', function (Blueprint $table) {
            $table->dropColumn(['position_x', 'position_y']);
        });
    }
};
