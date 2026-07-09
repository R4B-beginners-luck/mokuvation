<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * CrdtChange
 *
 * Automergeの変更バイナリ（change_blob）を1件保持するだけのモデル。
 * サーバー側では中身を一切解釈しないため、業務ロジックは持たない。
 * 追記専用（append-only）のため updated_at は使わない。
 */
class CrdtChange extends Model
{
    protected $table = 'crdt_changes';

    const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'device_id',
        'change_blob',
    ];
}
