<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Appointment::with(['referral.patient', 'facility', 'scheduledBy']);

        if ($user->role !== 'admin' && $user->facility_id) {
            $query->where('facility_id', $user->facility_id);
        }
        if ($request->status) $query->where('status', $request->status);
        if ($request->from)   $query->where('scheduled_at', '>=', $request->from);
        if ($request->to)     $query->where('scheduled_at', '<=', $request->to);

        return response()->json($query->orderBy('scheduled_at')->paginate(20));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'referral_id'  => 'required|exists:referrals,id',
            'facility_id'  => 'required|exists:facilities,id',
            'scheduled_at' => 'required|date',
            'department'   => 'nullable|string',
            'notes'        => 'nullable|string',
        ]);
        $data['scheduled_by'] = $request->user()->id;
        return response()->json(
            Appointment::create($data)->load(['referral.patient', 'facility']),
            201
        );
    }

    public function show(Appointment $appointment)
    {
        return response()->json($appointment->load(['referral.patient', 'facility', 'scheduledBy']));
    }

    public function update(Request $request, Appointment $appointment)
    {
        $data = $request->validate([
            'scheduled_at' => 'sometimes|date',
            'status'       => 'sometimes|in:scheduled,confirmed,attended,missed,cancelled',
            'department'   => 'nullable|string',
            'notes'        => 'nullable|string',
        ]);
        $appointment->update($data);
        return response()->json($appointment->load(['referral.patient', 'facility']));
    }

    public function destroy(Appointment $appointment)
    {
        $appointment->delete();
        return response()->json(null, 204);
    }
}
