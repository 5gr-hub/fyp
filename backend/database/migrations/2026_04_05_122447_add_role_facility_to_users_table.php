<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('clinical_officer')->after('email');
            $table->foreignId('facility_id')->nullable()->constrained('facilities')->nullOnDelete()->after('role');
            $table->string('phone')->nullable()->after('facility_id');
            $table->boolean('active')->default(true)->after('phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'facility_id', 'phone', 'active']);
        });
    }
};
