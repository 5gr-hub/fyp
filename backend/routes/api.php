<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FacilityController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\ReferralController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AttachmentController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\IntegrationController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/auth/login', [AuthController::class, 'login']);

// Handle CORS preflight OPTIONS requests for all API routes
Route::options('{any}', function () {
    return response('', 200);
})->where('any', '.*');

// Temporary route to run seeder since Render free tier has no shell
Route::get('/run-seeder', function () {
    try {
        \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
        return response()->json(['message' => 'Database seeded successfully. You can now login.']);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/auth/me',    [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Facilities
    Route::apiResource('facilities', FacilityController::class);

    // Users (admin)
    Route::apiResource('users', UserController::class);

    // Patients
    Route::apiResource('patients', PatientController::class);

    // Referrals
    Route::apiResource('referrals', ReferralController::class);
    Route::put('referrals/{referral}/status',   [ReferralController::class, 'updateStatus']);
    Route::post('referrals/{referral}/feedback', [ReferralController::class, 'storeFeedback']);
    Route::get('referrals/{referral}/feedback',  [ReferralController::class, 'showFeedback']);

    // Attachments (nested under referrals)
    Route::get('referrals/{referral}/attachments',                          [AttachmentController::class, 'index']);
    Route::post('referrals/{referral}/attachments',                         [AttachmentController::class, 'store']);
    Route::get('referrals/{referral}/attachments/{attachment}/download',    [AttachmentController::class, 'download']);
    Route::delete('referrals/{referral}/attachments/{attachment}',          [AttachmentController::class, 'destroy']);

    // Appointments
    Route::apiResource('appointments', AppointmentController::class);

    // Reports
    Route::get('reports/summary',      [ReportController::class, 'summary']);
    Route::get('reports/trends',       [ReportController::class, 'trends']);
    Route::get('reports/referrals',    [ReportController::class, 'referrals']);
    Route::get('reports/facilities',   [ReportController::class, 'facilities']);
    // External HMIS Integrations
    Route::get('integrations',                           [IntegrationController::class, 'index']);
    Route::post('integrations',                          [IntegrationController::class, 'store']);
    Route::put('integrations/{integration}',             [IntegrationController::class, 'update']);
    Route::delete('integrations/{integration}',          [IntegrationController::class, 'destroy']);
    Route::post('integrations/{integration}/test',       [IntegrationController::class, 'test']);
    Route::post('integrations/{integration}/lookup',     [IntegrationController::class, 'lookup']);

    // Notifications
    Route::get('notifications',              [NotificationController::class, 'index']);
    Route::get('notifications/unread',       [NotificationController::class, 'unread']);
    Route::put('notifications/{id}/read',    [NotificationController::class, 'markRead']);
    Route::put('notifications/read-all',     [NotificationController::class, 'markAllRead']);
});
