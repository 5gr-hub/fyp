<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Facility;
use Illuminate\Http\Request;

class FacilityController extends Controller
{
    public function index()
    {
        return response()->json(Facility::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string',
            'code'     => 'nullable|string|unique:facilities,code',
            'level'    => 'required|in:HC_II,HC_III,HC_IV,District_Hospital,Regional_Referral,National_Referral',
            'district' => 'required|string',
            'region'   => 'nullable|string',
            'phone'    => 'nullable|string',
            'email'    => 'nullable|email',
            'address'  => 'nullable|string',
        ]);
        return response()->json(Facility::create($data), 201);
    }

    public function show(Facility $facility)
    {
        return response()->json($facility->load('users'));
    }

    public function update(Request $request, Facility $facility)
    {
        $data = $request->validate([
            'name'     => 'sometimes|string',
            'code'     => 'nullable|string|unique:facilities,code,' . $facility->id,
            'level'    => 'sometimes|in:HC_II,HC_III,HC_IV,District_Hospital,Regional_Referral,National_Referral',
            'district' => 'sometimes|string',
            'region'   => 'nullable|string',
            'phone'    => 'nullable|string',
            'email'    => 'nullable|email',
            'address'  => 'nullable|string',
            'active'   => 'sometimes|boolean',
        ]);
        $facility->update($data);
        return response()->json($facility);
    }

    public function destroy(Facility $facility)
    {
        $facility->delete();
        return response()->json(null, 204);
    }
}
