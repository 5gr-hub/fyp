<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Referral;

class ReferralClinicalData extends Model
{
    use HasFactory;

    protected $fillable = [
        'referral_id', 'presenting_complaint', 'clinical_history', 'examination_findings',
        'diagnosis', 'treatment_given', 'allergies', 'investigations_summary', 'current_medications',
    ];

    public function referral() { return $this->belongsTo(Referral::class); }
}
