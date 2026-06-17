import { useState, useEffect } from 'react';
import { Network, Search, AlertCircle, RefreshCw, FileText, ChevronRight } from 'lucide-react';
import { getToken } from '../components/ReferralModal';

const DRCP = import.meta.env.VITE_DRCP_URL || 'http://localhost:8000/api';

const STATUS_COLORS = {
  submitted: 'bg-amber-100 text-amber-700 border-amber-200',
  acknowledged: 'bg-blue-100 text-blue-700 border-blue-200',
  in_transit: 'bg-violet-100 text-violet-700 border-violet-200',
  received: 'bg-teal-100 text-teal-700 border-teal-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
};

export default function TrackReferrals() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');

  const loadReferrals = async () => {
    const token = getToken();
    if (!token) {
      setError('You are not authenticated with DRCP. Please sign in via the sidebar.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${DRCP}/referrals`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch referrals');
      const data = await res.json();
      setReferrals(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferrals();
  }, []);

  const filtered = referrals.filter(r => 
    r.referral_number?.toLowerCase().includes(search.toLowerCase()) ||
    r.patient?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.receiving_facility?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Track DRCP Referrals</h1>
          <p className="text-sm text-slate-500">Monitor the status of referrals made to and from this facility.</p>
        </div>
        <button onClick={loadReferrals} disabled={loading} className="btn-secondary py-2 flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error ? (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : (
        <div className="card">
          <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by ID, patient, or facility..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input pl-9 bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID / Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Route</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-12 text-center text-slate-500">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 opacity-50" />
                      Loading referrals...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-12 text-center text-slate-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>No referrals found.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono text-sm font-medium text-slate-800">{r.referral_number}</div>
                        <div className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-slate-800">{r.patient?.full_name}</div>
                        <div className="text-xs text-slate-500">{r.patient?.sex} · {r.patient?.phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs">
                          <span className="text-slate-400">From: </span><span className="font-medium text-slate-700">{r.referring_facility?.name}</span>
                        </div>
                        <div className="text-xs mt-0.5">
                          <span className="text-slate-400">To: </span><span className="font-medium text-slate-700">{r.receiving_facility?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border uppercase tracking-wider ${STATUS_COLORS[r.status] || STATUS_COLORS.submitted}`}>
                          {r.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
