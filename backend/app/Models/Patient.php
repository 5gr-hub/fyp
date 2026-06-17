<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Facility;
use App\Models\User;
use App\Models\Referral;

class Patient extends Model
{
    use HasFactory;

    protected $fillable = [
        'full_name', 'date_of_birth', 'sex', 'nin', 'phone',
        'next_of_kin_name', 'next_of_kin_phone', 'next_of_kin_relation',
        'village', 'district', 'registered_by', 'facility_id',
    ];

    protected $casts = ['date_of_birth' => 'date'];

    public function facility() { return $this->belongsTo(Facility::class); }
    public function registeredBy() { return $this->belongsTo(User::class, 'registered_by'); }
    public function referrals() { return $this->hasMany(Referral::class); }
}
