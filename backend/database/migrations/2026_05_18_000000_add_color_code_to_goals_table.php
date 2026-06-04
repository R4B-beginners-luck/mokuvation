<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('goals', function (Blueprint $table) {
            // カラーパレットのインデックス(0-11)を格納する整数カラムに変更
            $table->unsignedTinyInteger('color_code')->nullable()->after('description')->comment('目標のカラーパレットインデックス（0-11）');
        });
    }

    public function down(): void
    {
        Schema::table('goals', function (Blueprint $table) {
            $table->dropColumn('color_code');
        });
    }
};
