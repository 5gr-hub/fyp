<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    public function index(Request $request)
    {
        $query = Patient::with('facility');
        if ($s = $request->search) {
            $query->where(function ($q) use ($s) {
                $q->where('full_name', 'ilike', "%$s%")
                  ->orWhere('nin', 'ilike', "%$s%")
                  ->orWhere('phone', 'ilike', "%$s%");
            });
        }
        return response()->json($query->orderBy('full_name')->paginate(20));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'full_name'            => 'required|string',
            'date_of_birth'        => 'nullable|date',
            'sex'                  => 'required|in:male,female,other',
            'nin'                  => 'nullable|string|unique:patients,nin',
            'phone'                => 'nullable|string',
            'next_of_kin_name'     => 'nullable|string',
            'next_of_kin_phone'    => 'nullable|string',
            'next_of_kin_relation' => 'nullable|string',
            'village'              => 'nullable|string',
            'district'             => 'nullable|string',
            'facility_id'          => 'nullable|exists:facilities,id',
        ]);
        $data['registered_by'] = $request->user()->id;
        return response()->json(Patient::create($data)->load('facility'), 201);
    }

    public function show(Patient $patient)
    {
        return response()->json($patient->load(['facility', 'referrals.referringFacility', 'referrals.receivingFacility']));
    }

    public function update(Request $request, Patient $patient)
    {
        $data = $request->validate([
            'full_name'            => 'sometimes|string',
            'date_of_birth'        => 'nullable|date',
            'sex'                  => 'sometimes|in:male,female,other',
            'nin'                  => 'nullable|string|unique:patients,nin,' . $patient->id,
            'phone'                => 'nullable|string',
            'next_of_kin_name'     => 'nullable|string',
            'next_of_kin_phone'    => 'nullable|string',
            'next_of_kin_relation' => 'nullable|string',
            'village'              => 'nullable|string',
            'district'             => 'nullable|string',
        ]);
        $patient->update($data);
        return response()->json($patient->load('facility'));
    }

    public function destroy(Patient $patient)
    {
        $patient->delete();
        return response()->json(null, 204);
    }
}
