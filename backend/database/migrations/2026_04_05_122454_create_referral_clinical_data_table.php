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
        Schema::create('referral_clinical_data', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referral_id')->unique()->constrained('referrals')->cascadeOnDelete();
            $table->text('presenting_complaint');
            $table->text('clinical_history')->nullable();
            $table->text('examination_findings')->nullable();
            $table->text('diagnosis');
            $table->text('treatment_given')->nullable();
            $table->text('allergies')->nullable();
            $table->text('investigations_summary')->nullable();
            $table->text('current_medications')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('referral_clinical_data');
    }
};
