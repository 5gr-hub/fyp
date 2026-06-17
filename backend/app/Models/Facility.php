<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;
use App\Models\Referral;
use App\Models\Patient;
use App\Models\Appointment;

class Facility extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'code', 'level', 'district', 'region', 'phone', 'email', 'address', 'active',
    ];

    protected $casts = ['active' => 'boolean'];

    public function users() { return $this->hasMany(User::class); }
    public function referralsOut() { return $this->hasMany(Referral::class, 'referring_facility_id'); }
    public function referralsIn() { return $this->hasMany(Referral::class, 'receiving_facility_id'); }
    public function patients() { return $this->hasMany(Patient::class); }
    public function appointments() { return $this->hasMany(Appointment::class); }
}
