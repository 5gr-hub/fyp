<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExternalSystem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class IntegrationController extends Controller
{
    public function index()
    {
        return ExternalSystem::orderBy('name')->get()->map(function ($s) {
            return array_merge($s->toArray(), [
                'api_key_masked' => $s->api_key_masked,
            ]);
        });
    }

    public function store(Request $request)
    {
        $this->requireAdmin($request);

        $data = $request->validate([
            'name'      => 'required|string|max:255',
            'type'      => 'required|in:dhis2,openmrs,hapis,custom',
            'base_url'  => 'required|url',
            'auth_type' => 'required|in:api_key,basic,bearer,none',
            'api_key'   => 'nullable|string',
            'api_secret'=> 'nullable|string',
            'username'  => 'nullable|string',
            'password'  => 'nullable|string',
            'active'    => 'boolean',
            'notes'     => 'nullable|string',
        ]);

        $system = ExternalSystem::create($data);
        return response()->json(array_merge($system->toArray(), [
            'api_key_masked' => $system->api_key_masked,
        ]), 201);
    }

    public function update(Request $request, ExternalSystem $integration)
    {
        $this->requireAdmin($request);

        $data = $request->validate([
            'name'      => 'sometimes|string|max:255',
            'type'      => 'sometimes|in:dhis2,openmrs,hapis,custom',
            'base_url'  => 'sometimes|url',
            'auth_type' => 'sometimes|in:api_key,basic,bearer,none',
            'api_key'   => 'nullable|string',
            'api_secret'=> 'nullable|string',
            'username'  => 'nullable|string',
            'password'  => 'nullable|string',
            'active'    => 'boolean',
            'notes'     => 'nullable|string',
        ]);

        // Don't overwrite credentials if blank strings sent (preserve existing)
        foreach (['api_key', 'api_secret', 'password'] as $field) {
            if (array_key_exists($field, $data) && $data[$field] === '') {
                unset($data[$field]);
            }
        }

        $integration->update($data);
        return response()->json(array_merge($integration->fresh()->toArray(), [
            'api_key_masked' => $integration->fresh()->api_key_masked,
        ]));
    }

    public function destroy(Request $request, ExternalSystem $integration)
    {
        $this->requireAdmin($request);
        $integration->delete();
        return response()->json(['message' => 'Deleted.']);
    }

    public function test(ExternalSystem $integration)
    {
        try {
            $response = Http::timeout(8)
                ->withHeaders($this->buildHeaders($integration))
                ->get(rtrim($integration->base_url, '/'));

            return response()->json([
                'reachable' => $response->successful() || $response->status() < 500,
                'status'    => $response->status(),
                'message'   => $response->successful() ? 'Connection successful.' : "HTTP {$response->status()}",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'reachable' => false,
                'status'    => 0,
                'message'   => $e->getMessage(),
            ]);
        }
    }

    public function lookup(Request $request, ExternalSystem $integration)
    {
        $data = $request->validate([
            'identifier'      => 'required|string',
            'identifier_type' => 'nullable|string|in:nin,patient_id,name',
        ]);

        $identifier      = $data['identifier'];
        $identifierType  = $data['identifier_type'] ?? 'nin';

        try {
            $result = match ($integration->type) {
                'dhis2'   => $this->lookupDhis2($integration, $identifier, $identifierType),
                'openmrs' => $this->lookupOpenmrs($integration, $identifier, $identifierType),
                default   => $this->lookupCustom($integration, $identifier, $identifierType),
            };

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'found'   => false,
                'patients' => [],
                'error'   => $e->getMessage(),
            ], 502);
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function requireAdmin(Request $request): void
    {
        if ($request->user()?->role !== 'admin') {
            abort(403, 'Admin access required.');
        }
    }

    private function buildHeaders(ExternalSystem $system): array
    {
        return match ($system->auth_type) {
            'api_key' => ['Authorization' => "ApiKey {$system->api_key}"],
            'bearer'  => ['Authorization' => "Bearer {$system->api_key}"],
            'basic'   => ['Authorization' => 'Basic ' . base64_encode("{$system->username}:{$system->password}")],
            default   => [],
        };
    }

    private function lookupDhis2(ExternalSystem $s, string $id, string $type): array
    {
        $attr = $type === 'nin' ? 'NIN' : 'patientId';
        $url  = rtrim($s->base_url, '/') . "/api/trackedEntityInstances.json";

        $resp = Http::timeout(10)
            ->withHeaders($this->buildHeaders($s))
            ->get($url, [
                'filter'              => "{$attr}:EQ:{$id}",
                'fields'              => 'trackedEntityInstance,attributes[attribute,value]',
                'skipPaging'          => true,
                'includeAllAttributes'=> true,
            ]);

        if (!$resp->successful()) {
            return ['found' => false, 'patients' => [], 'raw_status' => $resp->status()];
        }

        $instances = $resp->json('trackedEntityInstances') ?? [];
        $patients  = array_map(fn($t) => $this->normalizeDhis2($t), $instances);

        return ['found' => count($patients) > 0, 'patients' => $patients];
    }

    private function lookupOpenmrs(ExternalSystem $s, string $id, string $type): array
    {
        $url  = rtrim($s->base_url, '/') . '/ws/rest/v1/patient';

        $resp = Http::timeout(10)
            ->withHeaders($this->buildHeaders($s))
            ->get($url, ['q' => $id, 'v' => 'full']);

        if (!$resp->successful()) {
            return ['found' => false, 'patients' => [], 'raw_status' => $resp->status()];
        }

        $results  = $resp->json('results') ?? [];
        $patients = array_map(fn($p) => $this->normalizeOpenmrs($p), $results);

        return ['found' => count($patients) > 0, 'patients' => $patients];
    }

    private function lookupCustom(ExternalSystem $s, string $id, string $type): array
    {
        $url  = rtrim($s->base_url, '/') . '/patients';

        $resp = Http::timeout(10)
            ->withHeaders($this->buildHeaders($s))
            ->get($url, ['identifier' => $id, 'identifier_type' => $type]);

        if (!$resp->successful()) {
            return ['found' => false, 'patients' => [], 'raw_status' => $resp->status()];
        }

        $raw = $resp->json();
        // Support { data: [...] } or plain array
        $list = is_array($raw['data'] ?? null) ? $raw['data'] : (array_values($raw)[0] ?? []);

        $patients = array_map(fn($p) => [
            'source'              => $s->name,
            'full_name'           => $p['full_name'] ?? $p['name'] ?? null,
            'dob'                 => $p['date_of_birth'] ?? $p['dob'] ?? null,
            'sex'                 => $p['sex'] ?? $p['gender'] ?? null,
            'identifier'          => $p['identifier'] ?? $p['nin'] ?? $id,
            'phone'               => $p['phone'] ?? null,
            'district'            => $p['district'] ?? null,
            'village'             => $p['village'] ?? null,
            'blood_group'         => $p['blood_group'] ?? null,
            'allergies'           => $p['allergies'] ?? null,
            'chronic_conditions'  => $p['chronic_conditions'] ?? null,
            'next_of_kin_name'    => $p['next_of_kin_name'] ?? null,
            'next_of_kin_phone'   => $p['next_of_kin_phone'] ?? null,
            'next_of_kin_relation'=> $p['next_of_kin_relation'] ?? null,
            'last_encounter'      => $p['last_encounter'] ?? null,
            'last_vitals'         => $p['last_vitals'] ?? null,
            'recent_labs'         => $p['recent_labs'] ?? [],
            'raw'                 => $p,
        ], is_array($list) ? $list : []);

        return ['found' => count($patients) > 0, 'patients' => $patients];
    }

    private function normalizeDhis2(array $t): array
    {
        $attrs = collect($t['attributes'] ?? [])
            ->pluck('value', 'attribute')
            ->toArray();

        return [
            'source'     => 'DHIS2',
            'full_name'  => trim(($attrs['firstName'] ?? '') . ' ' . ($attrs['lastName'] ?? $attrs['familyName'] ?? '')),
            'dob'        => $attrs['birthdate'] ?? $attrs['dateOfBirth'] ?? null,
            'sex'        => $attrs['sex'] ?? $attrs['gender'] ?? null,
            'identifier' => $attrs['NIN'] ?? $attrs['patientId'] ?? $t['trackedEntityInstance'],
            'phone'      => $attrs['phoneNumber'] ?? $attrs['phone'] ?? null,
            'district'   => $attrs['district'] ?? null,
            'raw'        => $t,
        ];
    }

    private function normalizeOpenmrs(array $p): array
    {
        $name = $p['person']['preferredName'] ?? [];
        return [
            'source'     => 'OpenMRS',
            'full_name'  => trim(($name['givenName'] ?? '') . ' ' . ($name['familyName'] ?? '')),
            'dob'        => $p['person']['birthdate'] ?? null,
            'sex'        => $p['person']['gender'] ?? null,
            'identifier' => (collect($p['identifiers'] ?? [])->first()['identifier'] ?? null) ?? $p['uuid'],
            'phone'      => null,
            'district'   => null,
            'raw'        => $p,
        ];
    }
}
