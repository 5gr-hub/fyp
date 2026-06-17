<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Patient;
use App\Models\Facility;
use App\Models\User;
use App\Models\ReferralClinicalData;
use App\Models\ReferralStatusLog;
use App\Models\ReferralFeedback;
use App\Models\Appointment;
use App\Models\Attachment;

class Referral extends Model
{
    use HasFactory;

    protected $fillable = [
        'referral_number', 'patient_id', 'referring_facility_id', 'receiving_facility_id',
        'referred_by', 'urgency', 'status', 'reason_for_referral', 'additional_notes',
        'acknowledged_by', 'acknowledged_at',
    ];

    protected $casts = ['acknowledged_at' => 'datetime'];

    public function patient() { return $this->belongsTo(Patient::class); }
    public function referringFacility() { return $this->belongsTo(Facility::class, 'referring_facility_id'); }
    public function receivingFacility() { return $this->belongsTo(Facility::class, 'receiving_facility_id'); }
    public function referredBy() { return $this->belongsTo(User::class, 'referred_by'); }
    public function acknowledgedBy() { return $this->belongsTo(User::class, 'acknowledged_by'); }
    public function clinicalData() { return $this->hasOne(ReferralClinicalData::class); }
    public function statusLogs() { return $this->hasMany(ReferralStatusLog::class)->latest(); }
    public function feedback() { return $this->hasOne(ReferralFeedback::class); }
    public function appointments() { return $this->hasMany(Appointment::class); }
    public function attachments() { return $this->hasMany(Attachment::class); }
}
