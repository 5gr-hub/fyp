<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('external_systems', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type')->default('custom'); // dhis2 | openmrs | hapis | custom
            $table->string('base_url');
            $table->string('auth_type')->default('api_key'); // api_key | basic | bearer | none
            $table->string('api_key')->nullable();
            $table->string('api_secret')->nullable();
            $table->string('username')->nullable();
            $table->string('password')->nullable();
            $table->boolean('active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('external_systems');
    }
};
