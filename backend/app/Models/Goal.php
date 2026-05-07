<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Goal extends Model
{
    use SoftDeletes, HasUuids;

    protected $fillable = [
        'user_id',
        'parent_goal_id',
        'title',
        'description',
        'period_type',
        'due_at',
        'is_completed',
    ];

    // 1. データ型のキャスト（変換）
    protected $casts = [
        'is_completed' => 'boolean', // DBの0/1をbooleanとして扱う
        'due_at' => 'datetime',      // 日付文字列をCarbonインスタンスとして扱う
    ];

    // 2. リレーション：目標は1人のユーザーに属する（多対1）
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    // 3. リレーション：目標は複数のタスクを持つ（1対多）
    public function tasks()
    {
        return $this->hasMany(Task::class, 'goal_id', 'id');
    }

    // 4. リレーション：この目標の「親」にあたる目標（多対1）
    public function parent()
    {
        return $this->belongsTo(Goal::class, 'parent_goal_id', 'id');
    }

    // 5. リレーション：この目標の「子」にあたる目標群（1対多）
    public function children()
    {
        return $this->hasMany(Goal::class, 'parent_goal_id', 'id');
    }
}
