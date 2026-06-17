import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../api/client';
import { Plus, X, Building2, Pencil } from 'lucide-react';
import DataTable from '../../components/DataTable';

const LEVELS = ['HC_II','HC_III','HC_IV','District_Hospital','Regional_Referral','National_Referral'];

function FacilityModal({ facility, onClose, onSaved }) {
  const isEdit = !!facility?.id;
  const [form, setForm] = useState(facility
    ? { name:facility.name, code:facility.code??'', level:facility.level, district:facility.district, region:facility.region??'', phone:facility.phone??'', email:facility.email??'', address:facility.address??'', active:facility.active }
    : { name:'', code:'', level:'HC_III', district:'', region:'', phone:'', email:'', address:'', active:true }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const save = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      if (isEdit) await api.put(`/facilities/${facility.id}`, form);
      else        await api.post('/facilities', form);
      onSaved();
    } catch(err) { setError(err.response?.data?.message ?? 'Save failed.'); }
    finally { setSaving(false); }
  };

  const field = (label, key, type = 'text', required = false, ph = '') => (
    <div key={key}>
      <label className="label">{label}</label>
      <input type={type} required={required} value={form[key]}
        placeholder={ph}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="input" />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-modal">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">{isEdit ? 'Edit Facility' : 'New Facility'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={save} className="p-6 space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">{field('Facility Name *', 'name', 'text', true, 'e.g. Kakumiro General Hospital')}</div>
            {field('Code', 'code', 'text', false, 'e.g. KAK-001')}
            <div>
              <label className="label">Level *</label>
              <select required value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))} className="input">
                {LEVELS.map(l => <option key={l} value={l}>{l.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            {field('District *', 'district', 'text', true, 'e.g. Kakumiro')}
            {field('Region', 'region', 'text', false, 'e.g. Western')}
            {field('Phone', 'phone', 'tel', false, '+256 700 000 000')}
            <div className="col-span-2">{field('Email', 'email', 'email', false, 'info@facility.ug')}</div>
            <div className="col-span-2">
              <label className="label">Address</label>
              <textarea rows={2} value={form.address}
                placeholder="Physical address or location description…"
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="input resize-none" />
            </div>
            {isEdit && (
              <div className="col-span-2 flex items-center gap-3">
                <input type="checkbox" id="fac-active" checked={form.active}
                  onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 accent-primary-600" />
                <label htmlFor="fac-active" className="text-sm text-slate-700 font-medium">Facility active</label>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center py-2.5">
              {saving ? 'Saving…' : isEdit ? 'Update Facility' : 'Create Facility'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center py-2.5">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminFacilities() {
  const [facilities, setFacilities] = useState([]);
  const [modal, setModal]           = useState(null);
  const [loading, setLoading]       = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/facilities').then(r => setFacilities(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const colDefs = useMemo(() => [
    {
      field: 'name', headerName: 'Facility Name', flex: 1, minWidth: 180,
      cellRenderer: ({ value, data }) => (
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-3.5 w-3.5 text-primary-600" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 text-xs leading-tight truncate">{value}</p>
            <p className="text-[11px] text-slate-400 leading-tight">{data.code ?? '—'}</p>
          </div>
        </div>
      ),
    },
    {
      field: 'level', headerName: 'Level', width: 160,
      cellRenderer: ({ value }) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          {value?.replace(/_/g, ' ')}
        </span>
      ),
    },
    { field: 'district', headerName: 'District', width: 130 },
    { field: 'region',   headerName: 'Region',   width: 130, valueFormatter: ({ value }) => value ?? '—' },
    { field: 'phone',    headerName: 'Phone',    width: 130, valueFormatter: ({ value }) => value ?? '—' },
    {
      field: 'active', headerName: 'Status', width: 100,
      cellRenderer: ({ value }) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
          value ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${value ? 'bg-emerald-500' : 'bg-red-400'}`} />
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      field: 'id', headerName: 'Actions', width: 80, sortable: false, filter: false,
      cellRenderer: ({ data }) => (
        <button onClick={e => { e.stopPropagation(); setModal(data); }}
          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-semibold">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
      ),
    },
  ], []);

  return (
    <div className="space-y-5">
      {modal && (
        <FacilityModal
          facility={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Facilities</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage healthcare facilities</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary">
          <Plus className="h-4 w-4" /> New Facility
        </button>
      </div>

      <div className="card overflow-hidden">
        <DataTable
          rowData={facilities}
          columnDefs={colDefs}
          loading={loading}
          height={480}
          pageSize={25}
          noRowsMessage="No facilities yet"
        />
      </div>
    </div>
  );
}
