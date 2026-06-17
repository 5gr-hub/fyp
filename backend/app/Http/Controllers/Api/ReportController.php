<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Facility;
use App\Models\Referral;
use App\Models\ReferralFeedback;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    private function baseQuery(Request $request)
    {
        $user  = $request->user();
        $query = Referral::query();

        if ($user->role !== 'admin' && $user->facility_id) {
            $query->where(function ($q) use ($user) {
                $q->where('referring_facility_id', $user->facility_id)
                  ->orWhere('receiving_facility_id', $user->facility_id);
            });
        }

        if ($request->filled('from'))     $query->whereDate('created_at', '>=', $request->from);
        if ($request->filled('to'))       $query->whereDate('created_at', '<=', $request->to);
        if ($request->filled('status'))   $query->where('status', $request->status);
        if ($request->filled('urgency'))  $query->where('urgency', $request->urgency);
        if ($request->filled('facility_id')) {
            $fid = $request->facility_id;
            $query->where(function ($q) use ($fid) {
                $q->where('referring_facility_id', $fid)
                  ->orWhere('receiving_facility_id', $fid);
            });
        }

        return $query;
    }

    public function summary(Request $request)
    {
        $query = $this->baseQuery($request);
        $total = (clone $query)->count();

        $byStatus  = (clone $query)->select('status', DB::raw('count(*) as count'))->groupBy('status')->pluck('count', 'status');
        $byUrgency = (clone $query)->select('urgency', DB::raw('count(*) as count'))->groupBy('urgency')->pluck('count', 'urgency');

        $completedIds    = (clone $query)->where('status', 'completed')->pluck('id');
        $avgTurnaroundRaw = Referral::whereIn('id', $completedIds)
            ->whereNotNull('acknowledged_at')
            ->select(DB::raw("AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at))/3600) as avg_hours"))
            ->value('avg_hours');

        $feedbackRate = $total > 0
            ? round(ReferralFeedback::whereIn('referral_id', (clone $query)->pluck('id'))->count() / $total * 100, 1)
            : 0;

        return response()->json([
            'total'              => $total,
            'by_status'          => $byStatus,
            'by_urgency'         => $byUrgency,
            'feedback_rate'      => $feedbackRate,
            'avg_turnaround_hrs' => $avgTurnaroundRaw ? round($avgTurnaroundRaw, 1) : null,
        ]);
    }

    public function trends(Request $request)
    {
        $period = $request->period ?? 'monthly';
        $query  = $this->baseQuery($request);
        $format = $period === 'weekly' ? 'IYYY-IW' : 'YYYY-MM';
        $label  = $period === 'weekly' ? 'week' : 'month';

        $trends = (clone $query)
            ->select(DB::raw("TO_CHAR(created_at, '$format') as $label"), DB::raw('count(*) as count'))
            ->groupBy($label)
            ->orderBy($label)
            ->limit(12)
            ->get();

        return response()->json($trends);
    }

    public function referrals(Request $request)
    {
        $query = $this->baseQuery($request)
            ->with(['patient', 'referringFacility', 'receivingFacility', 'referredBy', 'feedback'])
            ->orderBy('created_at', 'desc');

        $perPage = min((int) ($request->per_page ?? 50), 200);
        return response()->json($query->paginate($perPage));
    }

    public function facilities(Request $request)
    {
        $user      = $request->user();
        $facilities = Facility::all();
        $result    = [];

        foreach ($facilities as $facility) {
            $base = Referral::query();
            if ($request->filled('from')) $base->whereDate('created_at', '>=', $request->from);
            if ($request->filled('to'))   $base->whereDate('created_at', '<=', $request->to);

            $sent     = (clone $base)->where('referring_facility_id',  $facility->id)->count();
            $received = (clone $base)->where('receiving_facility_id',  $facility->id)->count();
            $completed= (clone $base)->where('receiving_facility_id',  $facility->id)->where('status', 'completed')->count();
            $cancelled= (clone $base)->where(function($q) use($facility){
                $q->where('referring_facility_id', $facility->id)
                  ->orWhere('receiving_facility_id', $facility->id);
            })->where('status', 'cancelled')->count();

            $fbRate = $received > 0
                ? round(ReferralFeedback::whereIn('referral_id',
                    Referral::where('receiving_facility_id', $facility->id)->pluck('id')
                  )->count() / $received * 100, 1)
                : 0;

            if ($sent + $received > 0) {
                $result[] = [
                    'id'             => $facility->id,
                    'name'           => $facility->name,
                    'type'           => $facility->type,
                    'district'       => $facility->district,
                    'sent'           => $sent,
                    'received'       => $received,
                    'completed'      => $completed,
                    'cancelled'      => $cancelled,
                    'feedback_rate'  => $fbRate,
                ];
            }
        }

        usort($result, fn($a, $b) => ($b['sent'] + $b['received']) <=> ($a['sent'] + $a['received']));
        return response()->json($result);
    }

    public function integrations()
    {
        return response()->json([
            ['name' => 'DHIS2',     'status' => 'stub', 'version' => '2.39', 'note' => 'Integration planned for Phase 2'],
            ['name' => 'OpenMRS',   'status' => 'stub', 'version' => '3.x',  'note' => 'Integration planned for Phase 2'],
            ['name' => 'UgandaEMR', 'status' => 'stub', 'version' => '3.x',  'note' => 'Integration planned for Phase 2'],
        ]);
    }
}
