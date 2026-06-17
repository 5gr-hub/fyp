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
        Schema::create('referral_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referral_id')->unique()->constrained('referrals')->cascadeOnDelete();
            $table->foreignId('submitted_by')->constrained('users');
            $table->enum('outcome', ['treated_discharged', 'admitted', 'referred_further', 'deceased', 'dna', 'other']);
            $table->text('treatment_summary')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('referral_feedback');
    }
};
