import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../api/client';
import { Plus, X, Search, Pencil } from 'lucide-react';
import DataTable from '../../components/DataTable';

const ROLES = ['admin','doctor','nurse','clinical_officer','referral_officer','records_officer'];

function UserModal({ user, facilities, onClose, onSaved }) {
  const isEdit = !!user?.id;
  const [form, setForm] = useState(user
    ? { name: user.name, email: user.email, role: user.role, facility_id: user.facility_id ?? '', phone: user.phone ?? '', active: user.active, password: '' }
    : { name:'', email:'', role:'clinical_officer', facility_id:'', phone:'', active:true, password:'' }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const save = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (!payload.facility_id) payload.facility_id = null;
      if (isEdit) await api.put(`/users/${user.id}`, payload);
      else        await api.post('/users', payload);
      onSaved();
    } catch(err) { setError(err.response?.data?.message ?? 'Save failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-modal">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">{isEdit ? 'Edit User' : 'New User'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={save} className="p-6 space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Full Name *</label>
              <input required value={form.name} placeholder="e.g. Dr. Jane Namukasa" onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="input" />
            </div>
            <div className="col-span-2">
              <label className="label">Email *</label>
              <input required type="email" value={form.email} placeholder="user@facility.ug" onChange={e=>setForm(f=>({...f,email:e.target.value}))} className="input" />
            </div>
            <div>
              <label className="label">Role *</label>
              <select required value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} className="input">
                {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Facility</label>
              <select value={form.facility_id} onChange={e=>setForm(f=>({...f,facility_id:e.target.value}))} className="input">
                <option value="">None (Admin)</option>
                {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="tel" value={form.phone} placeholder="+256 700 000 000" onChange={e=>setForm(f=>({...f,phone:e.target.value}))} className="input" />
            </div>
            <div>
              <label className="label">{isEdit ? 'New Password' : 'Password *'}</label>
              <input type="password" required={!isEdit} value={form.password}
                onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                placeholder={isEdit ? 'Leave blank to keep current password' : 'Min. 8 characters'} className="input" />
            </div>
            {isEdit && (
              <div className="col-span-2 flex items-center gap-3">
                <input type="checkbox" id="active" checked={form.active}
                  onChange={e=>setForm(f=>({...f,active:e.target.checked}))}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 accent-primary-600" />
                <label htmlFor="active" className="text-sm text-slate-700 font-medium">Account active</label>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center py-2.5">
              {saving ? 'Saving…' : isEdit ? 'Update User' : 'Create User'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center py-2.5">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers]           = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [search, setSearch]         = useState('');
  const [modal, setModal]           = useState(null);
  const [loading, setLoading]       = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/users').then(r => setUsers(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    api.get('/facilities').then(r => setFacilities(r.data));
  }, [load]);

  const colDefs = useMemo(() => [
    {
      field: 'name', headerName: 'Name', flex: 1, minWidth: 150,
      cellRenderer: ({ value }) => <span className="font-semibold text-slate-800">{value}</span>,
    },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 180,
      cellRenderer: ({ value }) => <span className="text-xs text-slate-500">{value}</span> },
    {
      field: 'role', headerName: 'Role', width: 160,
      cellRenderer: ({ value }) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200 capitalize">
          {value?.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      field: 'facility', headerName: 'Facility', flex: 1, minWidth: 140,
      valueGetter: ({ data }) => data?.facility?.name ?? '—',
      cellRenderer: ({ value }) => <span className="text-xs text-slate-500">{value}</span>,
    },
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
        <UserModal
          user={modal === 'new' ? null : modal}
          facilities={facilities}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage system users and roles</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary">
          <Plus className="h-4 w-4" /> New User
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…" className="input pl-9" />
      </div>

      <div className="card overflow-hidden">
        <DataTable
          rowData={users}
          columnDefs={colDefs}
          loading={loading}
          height={480}
          pageSize={25}
          quickFilter={search}
          noRowsMessage="No users found"
        />
      </div>
    </div>
  );
}
