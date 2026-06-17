<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Referral;
use App\Models\Facility;
use App\Models\User;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'referral_id', 'facility_id', 'scheduled_by', 'scheduled_at', 'status', 'department', 'notes',
    ];

    protected $casts = ['scheduled_at' => 'datetime'];

    public function referral() { return $this->belongsTo(Referral::class); }
    public function facility() { return $this->belongsTo(Facility::class); }
    public function scheduledBy() { return $this->belongsTo(User::class, 'scheduled_by'); }
}
