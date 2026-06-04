<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use SoftDeletes;
    use HasApiTokens, SoftDeletes;

    // 1. 主キーのカスタマイズ設定
    protected $primaryKey = 'user_id';
    public $incrementing = false; // 自動採番（オートインクリメント）を無効化
    protected $keyType = 'string'; // 主キーの型を文字列に指定

    // 2. 複数代入を許可するカラムの指定
    protected $fillable = [
        'user_id',
        'user_name',
        'password',
    ];

    // 3. リレーション：ユーザーは複数の目標を持つ（1対多）
    public function goals()
    {
        return $this->hasMany(Goal::class, 'user_id', 'user_id');
    }
}