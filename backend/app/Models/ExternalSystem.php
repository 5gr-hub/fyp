<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExternalSystem extends Model
{
    protected $fillable = [
        'name', 'type', 'base_url', 'auth_type',
        'api_key', 'api_secret', 'username', 'password',
        'active', 'notes',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    protected $hidden = [
        'api_key', 'api_secret', 'password',
    ];

    public function getApiKeyMaskedAttribute(): string
    {
        if (!$this->api_key) return '';
        return str_repeat('*', max(0, strlen($this->api_key) - 4)) . substr($this->api_key, -4);
    }
}
