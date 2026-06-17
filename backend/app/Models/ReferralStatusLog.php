<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Referral;
use App\Models\User;

class ReferralStatusLog extends Model
{
    use HasFactory;

    protected $fillable = ['referral_id', 'status', 'changed_by', 'notes'];

    public function referral() { return $this->belongsTo(Referral::class); }
    public function changedBy() { return $this->belongsTo(User::class, 'changed_by'); }
}
