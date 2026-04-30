<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->string('user_id')->primary()->comment('ユーザーID（ログイン時に使用）');
            $table->string('user_name')->comment('ユーザー名');
            $table->string('password')->comment('パスワード（ハッシュ化）');

            $table->timestamps(); // created_at, updated_at
            $table->softDeletes(); // deleted_at（論理削除）
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
?>
