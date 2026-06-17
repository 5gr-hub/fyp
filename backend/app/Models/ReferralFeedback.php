<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Referral;
use App\Models\User;

class ReferralFeedback extends Model
{
    use HasFactory;

    protected $fillable = ['referral_id', 'submitted_by', 'outcome', 'treatment_summary', 'notes'];

    public function referral() { return $this->belongsTo(Referral::class); }
    public function submittedBy() { return $this->belongsTo(User::class, 'submitted_by'); }
}
