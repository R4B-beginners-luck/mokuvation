<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

use App\Models\Goal;
use App\Models\User;

class Task extends Model
{
    use SoftDeletes, HasUuids;

    protected $fillable = [
        'goal_id',
        'user_id',
        'title',
        'description',
        'scheduled_at',
        'is_completed',
        'completed_at',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'scheduled_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    // リレーション：タスクは1つの目標に属する（多対1）
    public function goal()
    {
        return $this->belongsTo(Goal::class, 'goal_id', 'id');
    }

    // リレーション：タスクは1人のユーザーに属する（多対1）
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}