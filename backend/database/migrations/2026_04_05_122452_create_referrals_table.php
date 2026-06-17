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
        Schema::create('referrals', function (Blueprint $table) {
            $table->id();
            $table->string('referral_number')->unique();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('referring_facility_id')->constrained('facilities');
            $table->foreignId('receiving_facility_id')->constrained('facilities');
            $table->foreignId('referred_by')->constrained('users');
            $table->enum('urgency', ['emergency', 'urgent', 'routine'])->default('routine');
            $table->enum('status', ['draft', 'submitted', 'acknowledged', 'in_transit', 'received', 'completed', 'cancelled'])->default('draft');
            $table->text('reason_for_referral');
            $table->text('additional_notes')->nullable();
            $table->foreignId('acknowledged_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('referrals');
    }
};
