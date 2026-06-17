import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../api/client';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';
import { Plus, X, Filter } from 'lucide-react';

const STATUSES = ['', 'scheduled', 'confirmed', 'attended', 'missed', 'cancelled'];

function AppointmentModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ referral_id: '', facility_id: '', scheduled_at: '', department: '', notes: '' });
  const [facilities, setFacilities] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => { api.get('/facilities').then(r => setFacilities(r.data)); }, []);

  const save = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await api.post('/appointments', form);
      onSaved();
    } catch (err) { setError(err.response?.data?.message ?? 'Failed to save.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-modal">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Schedule Appointment</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={save} className="p-6 space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
          <div>
            <label className="label">Referral ID *</label>
            <input required type="number" value={form.referral_id}
              onChange={e => setForm(f => ({ ...f, referral_id: e.target.value }))}
              placeholder="Enter referral ID" className="input" />
          </div>
          <div>
            <label className="label">Facility *</label>
            <select required value={form.facility_id}
              onChange={e => setForm(f => ({ ...f, facility_id: e.target.value }))} className="input">
              <option value="">Select facility…</option>
              {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date &amp; Time *</label>
            <input required type="datetime-local" value={form.scheduled_at}
              onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">Department</label>
            <input type="text" value={form.department}
              onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
              placeholder="e.g. Orthopaedics, Maternity…" className="input" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea rows={2} value={form.notes}
              placeholder="Any special instructions or preparation requirements…"
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="input resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center py-2.5">
              {saving ? 'Saving…' : 'Schedule'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center py-2.5">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ per_page: 200 });
    if (statusFilter) p.set('status', statusFilter);
    api.get(`/appointments?${p}`)
      .then(r => setAppointments(r.data.data ?? r.data ?? []))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    await api.put(`/appointments/${id}`, { status });
    load();
  };

  const colDefs = useMemo(() => [
    {
      field: 'patient', headerName: 'Patient', flex: 1, minWidth: 150,
      valueGetter: ({ data }) => data?.referral?.patient?.full_name ?? `Ref #${data?.referral_id ?? '—'}`,
      cellRenderer: ({ value }) => <span className="font-semibold text-slate-800">{value}</span>,
    },
    {
      field: 'facility', headerName: 'Facility', flex: 1, minWidth: 140,
      valueGetter: ({ data }) => data?.facility?.name ?? '—',
      cellRenderer: ({ value }) => <span className="text-xs text-slate-500">{value}</span>,
    },
    {
      field: 'scheduled_at', headerName: 'Scheduled', width: 170,
      valueFormatter: ({ value }) => value ? new Date(value).toLocaleString() : '—',
      cellRenderer: ({ value }) => (
        <span className="text-slate-700 text-xs">{value ? new Date(value).toLocaleString() : '—'}</span>
      ),
    },
    {
      field: 'department', headerName: 'Department', width: 140,
      valueFormatter: ({ value }) => value ?? '—',
      cellRenderer: ({ value }) => <span className="text-xs text-slate-500">{value ?? '—'}</span>,
    },
    {
      field: 'status', headerName: 'Status', width: 130,
      cellRenderer: ({ value }) => <Badge value={value} />,
    },
    {
      field: 'id', headerName: 'Change Status', width: 150, sortable: false, filter: false,
      cellRenderer: ({ data }) => (
        <select value={data.status}
          onChange={e => { e.stopPropagation(); updateStatus(data.id, e.target.value); }}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
          {['scheduled', 'confirmed', 'attended', 'missed', 'cancelled'].map(s =>
            <option key={s} value={s}>{s}</option>
          )}
        </select>
      ),
    },
  ], []);

  return (
    <div className="space-y-5">
      {showModal && (
        <AppointmentModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage scheduled appointments</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Schedule Appointment
        </button>
      </div>

      {/* Filter */}
      <div className="card p-3 flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Filter className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">Status</span>
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="input py-1.5 text-xs w-auto min-w-[140px]">
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
        {statusFilter && (
          <button onClick={() => setStatusFilter('')}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <DataTable
          rowData={appointments}
          columnDefs={colDefs}
          loading={loading}
          height={520}
          pageSize={25}
          noRowsMessage="No appointments found"
        />
      </div>
    </div>
  );
}
