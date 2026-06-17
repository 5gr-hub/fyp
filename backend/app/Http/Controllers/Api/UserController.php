<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('facility');
        if ($request->facility_id) {
            $query->where('facility_id', $request->facility_id);
        }
        return response()->json($query->orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string',
            'email'       => 'required|email|unique:users,email',
            'password'    => 'required|min:8',
            'role'        => 'required|in:admin,doctor,nurse,clinical_officer,referral_officer,records_officer',
            'facility_id' => 'nullable|exists:facilities,id',
            'phone'       => 'nullable|string',
        ]);
        $data['password'] = Hash::make($data['password']);
        return response()->json(User::create($data)->load('facility'), 201);
    }

    public function show(User $user)
    {
        return response()->json($user->load('facility'));
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name'        => 'sometimes|string',
            'email'       => 'sometimes|email|unique:users,email,' . $user->id,
            'password'    => 'sometimes|min:8',
            'role'        => 'sometimes|in:admin,doctor,nurse,clinical_officer,referral_officer,records_officer',
            'facility_id' => 'nullable|exists:facilities,id',
            'phone'       => 'nullable|string',
            'active'      => 'sometimes|boolean',
        ]);
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }
        $user->update($data);
        return response()->json($user->load('facility'));
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(null, 204);
    }
}
