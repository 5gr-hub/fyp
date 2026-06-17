<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Referral;
use App\Models\User;

class Attachment extends Model
{
    use HasFactory;

    protected $fillable = ['referral_id', 'uploaded_by', 'file_name', 'file_path', 'mime_type', 'file_size'];

    public function referral() { return $this->belongsTo(Referral::class); }
    public function uploadedBy() { return $this->belongsTo(User::class, 'uploaded_by'); }
}
