<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Facility;
use App\Models\Referral;
use App\Models\ReferralClinicalData;
use App\Models\ReferralFeedback;
use App\Models\ReferralStatusLog;
use App\Models\User;
use App\Notifications\ReferralNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class ReferralController extends Controller
{
    private function notifyUsers(array $userIds, string $message, Referral $referral, string $action): void
    {
        $users = User::whereIn('id', array_unique(array_filter($userIds)))->get();
        foreach ($users as $user) {
            $user->notify(new ReferralNotification(
                $message,
                (string) $referral->id,
                $referral->referral_number,
                $action,
                $referral->referringFacility->name ?? '',
                $referral->receivingFacility->name ?? '',
                $referral->patient->full_name ?? ''
            ));
        }
    }

    private function usersAtFacility(?int $facilityId): array
    {
        if (!$facilityId) return [];
        return User::where('facility_id', $facilityId)->where('active', true)->pluck('id')->toArray();
    }

    private function notifyFacilityEmail(?int $facilityId, string $message, Referral $referral, string $action): void
    {
        if (!$facilityId) return;
        $facility = Facility::find($facilityId);
        if (!$facility || !$facility->email) return;

        $notification = new ReferralNotification(
            $message,
            (string) $referral->id,
            $referral->referral_number,
            $action,
            $referral->referringFacility->name ?? '',
            $referral->receivingFacility->name ?? '',
            $referral->patient->full_name ?? ''
        );

        // Send directly to the facility's registered email address
        Notification::route('mail', $facility->email)
            ->notify($notification);
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Referral::with([
            'patient', 'referringFacility', 'receivingFacility', 'referredBy',
        ]);

        if ($user->role !== 'admin') {
            $query->where(function ($q) use ($user) {
                $q->where('referring_facility_id', $user->facility_id)
                  ->orWhere('receiving_facility_id', $user->facility_id);
            });
        }

        if ($request->status)   $query->where('status', $request->status);
        if ($request->urgency)  $query->where('urgency', $request->urgency);
        if ($request->facility) {
            $query->where(function ($q) use ($request) {
                $q->where('referring_facility_id', $request->facility)
                  ->orWhere('receiving_facility_id', $request->facility);
            });
        }
        if ($request->from) $query->whereDate('created_at', '>=', $request->from);
        if ($request->to)   $query->whereDate('created_at', '<=', $request->to);

        return response()->json($query->latest()->paginate(15));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'patient_id'             => 'required|exists:patients,id',
            'referring_facility_id'  => 'nullable|exists:facilities,id',
            'receiving_facility_id'  => 'required|exists:facilities,id',
            'urgency'                => 'required|in:emergency,urgent,routine',
            'reason_for_referral'    => 'required|string',
            'additional_notes'       => 'nullable|string',
            'clinical'               => 'required|array',
            'clinical.presenting_complaint'    => 'required|string',
            'clinical.clinical_history'        => 'nullable|string',
            'clinical.examination_findings'    => 'nullable|string',
            'clinical.diagnosis'               => 'required|string',
            'clinical.treatment_given'         => 'nullable|string',
            'clinical.allergies'               => 'nullable|string',
            'clinical.investigations_summary'  => 'nullable|string',
            'clinical.current_medications'     => 'nullable|string',
        ]);

        $user = $request->user();

        // Use user's facility, or the one sent from the frontend (for admin users with no facility)
        $referringFacilityId = $user->facility_id ?? $data['referring_facility_id'] ?? null;

        if (!$referringFacilityId) {
            return response()->json(['message' => 'Referring facility could not be determined. Please assign a facility to your user account.'], 422);
        }

        $referral = Referral::create([
            'referral_number'       => 'REF-' . strtoupper(Str::random(8)),
            'patient_id'            => $data['patient_id'],
            'referring_facility_id' => $referringFacilityId,
            'receiving_facility_id' => $data['receiving_facility_id'],
            'referred_by'           => $user->id,
            'urgency'               => $data['urgency'],
            'status'                => 'submitted',
            'reason_for_referral'   => $data['reason_for_referral'],
            'additional_notes'      => $data['additional_notes'] ?? null,
        ]);

        ReferralClinicalData::create(array_merge(
            ['referral_id' => $referral->id],
            $data['clinical']
        ));

        ReferralStatusLog::create([
            'referral_id' => $referral->id,
            'status'      => 'submitted',
            'changed_by'  => $user->id,
            'notes'       => 'Referral created and submitted.',
        ]);

        $referral->load(['patient', 'referringFacility', 'receivingFacility', 'referredBy', 'clinicalData']);

        $msg = "New referral {$referral->referral_number} received from {$referral->referringFacility->name} for {$referral->patient->full_name}.";

        $this->notifyUsers(
            $this->usersAtFacility($referral->receiving_facility_id),
            $msg,
            $referral,
            'created'
        );

        $this->notifyFacilityEmail($referral->receiving_facility_id, $msg, $referral, 'created');

        return response()->json($referral, 201);
    }

    public function show(Referral $referral)
    {
        return response()->json($referral->load([
            'patient', 'referringFacility', 'receivingFacility',
            'referredBy', 'acknowledgedBy', 'clinicalData',
            'statusLogs.changedBy', 'feedback.submittedBy',
            'appointments.facility', 'attachments.uploadedBy',
        ]));
    }

    public function update(Request $request, Referral $referral)
    {
        $data = $request->validate([
            'urgency'             => 'sometimes|in:emergency,urgent,routine',
            'reason_for_referral' => 'sometimes|string',
            'additional_notes'    => 'nullable|string',
        ]);
        $referral->update($data);
        return response()->json($referral->load(['patient', 'referringFacility', 'receivingFacility']));
    }

    public function destroy(Referral $referral)
    {
        $referral->delete();
        return response()->json(null, 204);
    }

    public function updateStatus(Request $request, Referral $referral)
    {
        $allowed = ['submitted', 'acknowledged', 'in_transit', 'received', 'completed', 'cancelled', 'rejected'];
        $data = $request->validate([
            'status' => 'required|in:' . implode(',', $allowed),
            'notes'  => 'nullable|string',
        ]);

        $user      = $request->user();
        $newStatus = $data['status'];

        // Admins may set any status freely.
        if ($user->role !== 'admin') {
            $isReferring  = $user->facility_id === $referral->referring_facility_id;
            $isReceiving  = $user->facility_id === $referral->receiving_facility_id;

            // Statuses the referring facility is permitted to set.
            $referringAllowed = ['in_transit', 'cancelled'];
            // Statuses the receiving facility is permitted to set.
            $receivingAllowed = ['acknowledged', 'received', 'completed', 'rejected'];

            if ($isReferring && !in_array($newStatus, $referringAllowed)) {
                return response()->json([
                    'message' => "Referring facility can only set status to: " . implode(', ', $referringAllowed) . '.',
                ], 403);
            }

            if ($isReceiving && !in_array($newStatus, $receivingAllowed)) {
                return response()->json([
                    'message' => "Receiving facility can only set status to: " . implode(', ', $receivingAllowed) . '.',
                ], 403);
            }

            if (!$isReferring && !$isReceiving) {
                return response()->json(['message' => 'You are not associated with this referral.'], 403);
            }
        }

        $referral->load(['patient', 'referringFacility', 'receivingFacility']);
        $referral->update(['status' => $newStatus]);

        if ($newStatus === 'acknowledged') {
            $referral->update([
                'acknowledged_by' => $user->id,
                'acknowledged_at' => now(),
            ]);
        }

        ReferralStatusLog::create([
            'referral_id' => $referral->id,
            'status'      => $newStatus,
            'changed_by'  => $user->id,
            'notes'       => $data['notes'] ?? null,
        ]);

        $num  = $referral->referral_number;
        $from = $referral->referringFacility->name  ?? 'Unknown';
        $to   = $referral->receivingFacility->name  ?? 'Unknown';
        $pat  = $referral->patient->full_name        ?? 'patient';

        $statusConfig = [
            'acknowledged' => [
                'msg'          => "Referral {$num} for {$pat} has been acknowledged by {$to}.",
                'userIds'      => array_merge($this->usersAtFacility($referral->referring_facility_id), [$referral->referred_by]),
                'facilityIds'  => [$referral->referring_facility_id],
            ],
            'in_transit' => [
                'msg'          => "Referral {$num} — patient {$pat} is now in transit from {$from}.",
                'userIds'      => $this->usersAtFacility($referral->receiving_facility_id),
                'facilityIds'  => [$referral->receiving_facility_id],
            ],
            'received' => [
                'msg'          => "Referral {$num} — patient {$pat} has arrived at {$to}.",
                'userIds'      => $this->usersAtFacility($referral->referring_facility_id),
                'facilityIds'  => [$referral->referring_facility_id],
            ],
            'completed' => [
                'msg'          => "Referral {$num} for {$pat} has been completed at {$to}.",
                'userIds'      => $this->usersAtFacility($referral->referring_facility_id),
                'facilityIds'  => [$referral->referring_facility_id],
            ],
            'cancelled' => [
                'msg'          => "Referral {$num} for {$pat} has been cancelled.",
                'userIds'      => array_merge(
                    $this->usersAtFacility($referral->referring_facility_id),
                    $this->usersAtFacility($referral->receiving_facility_id)
                ),
                'facilityIds'  => [$referral->referring_facility_id, $referral->receiving_facility_id],
            ],
            'rejected' => [
                'msg'          => "Referral {$num} for {$pat} has been rejected by {$to}.",
                'userIds'      => array_merge($this->usersAtFacility($referral->referring_facility_id), [$referral->referred_by]),
                'facilityIds'  => [$referral->referring_facility_id],
            ],
        ];

        if (isset($statusConfig[$newStatus])) {
            $cfg = $statusConfig[$newStatus];
            $this->notifyUsers($cfg['userIds'], $cfg['msg'], $referral, $newStatus);
            foreach ($cfg['facilityIds'] as $fid) {
                $this->notifyFacilityEmail($fid, $cfg['msg'], $referral, $newStatus);
            }
        }

        return response()->json($referral->load(['statusLogs.changedBy']));
    }

    public function storeFeedback(Request $request, Referral $referral)
    {
        $data = $request->validate([
            'outcome'           => 'required|in:treated_discharged,admitted,referred_further,deceased,dna,other',
            'treatment_summary' => 'nullable|string',
            'notes'             => 'nullable|string',
        ]);

        $feedback = ReferralFeedback::updateOrCreate(
            ['referral_id' => $referral->id],
            array_merge($data, ['submitted_by' => $request->user()->id])
        );

        $referral->update(['status' => 'completed']);
        ReferralStatusLog::create([
            'referral_id' => $referral->id,
            'status'      => 'completed',
            'changed_by'  => $request->user()->id,
            'notes'       => 'Feedback submitted.',
        ]);

        $referral->load(['patient', 'referringFacility', 'receivingFacility']);

        $feedbackMsg = "Feedback submitted for referral {$referral->referral_number} ({$referral->patient->full_name}). Outcome: {$data['outcome']}.";

        $this->notifyUsers(
            array_merge(
                $this->usersAtFacility($referral->referring_facility_id),
                [$referral->referred_by]
            ),
            $feedbackMsg,
            $referral,
            'feedback'
        );

        $this->notifyFacilityEmail($referral->referring_facility_id, $feedbackMsg, $referral, 'feedback');

        return response()->json($feedback->load('submittedBy'));
    }

    public function showFeedback(Referral $referral)
    {
        return response()->json($referral->feedback?->load('submittedBy'));
    }
}
