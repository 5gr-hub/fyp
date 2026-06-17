import { useState, useEffect } from 'react';
import { Users, Plus, Search, X, ChevronDown, ChevronUp, Send } from 'lucide-react';
import ReferralModal from '../components/ReferralModal.jsx';

const API = '/api';
const BLANK = { full_name:'', sex:'female', date_of_birth:'', phone:'', district:'', village:'', identifier:'', blood_group:'', allergies:'NKDA', chronic_conditions:'None', next_of_kin_name:'', next_of_kin_phone:'', next_of_kin_relation:'' };
const BLOOD_GROUPS = ['','A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown'];
const RELATIONS = ['','Spouse','Wife','Husband','Mother','Father','Son','Daughter','Brother','Sister','Guardian','Friend','Other'];

function PatientModal({ patient, onClose, onSaved }) {
  const isEdit = !!patient?.id;
  const [form, setForm] = useState(isEdit ? { ...BLANK, ...patient } : { ...BLANK });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [section, setSection] = useState('demographics');

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const save = async e => {
    e.preventDefault(); setErr(''); setSaving(true);
    try {
      const res = await fetch(isEdit ? `${API}/patients/${patient.id}` : `${API}/patients`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? 'Save failed');
      onSaved();
    } catch (e) { setErr(e.message); } finally { setSaving(false); }
  };

  const TABS = [['demographics','Demographics'],['clinical','Clinical Info'],['nok','Next of Kin']];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">{isEdit ? 'Edit Patient' : 'Register New Patient'}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
        </div>
        {/* Section tabs */}
        <div className="flex border-b border-slate-100">
          {TABS.map(([k, l]) => (
            <button key={k} type="button" onClick={() => setSection(k)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${section === k ? 'text-green-600 border-b-2 border-green-600' : 'text-slate-400 hover:text-slate-600'}`}>{l}</button>
          ))}
        </div>
        <form onSubmit={save} className="p-6 space-y-3">
          {err && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>}

          {section === 'demographics' && <>
            <div><label className="lbl">Full Name *</label><input required value={form.full_name} onChange={f('full_name')} className="inp" placeholder="e.g. Aisha Nakato" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="lbl">Sex *</label>
                <select required value={form.sex} onChange={f('sex')} className="inp">
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div><label className="lbl">Date of Birth</label><input type="date" value={form.date_of_birth} onChange={f('date_of_birth')} className="inp" /></div>
              <div><label className="lbl">Phone</label><input value={form.phone} onChange={f('phone')} className="inp" placeholder="+256 700 000 000" /></div>
              <div><label className="lbl">NIN / Identifier</label><input value={form.identifier} onChange={f('identifier')} className="inp" placeholder="National ID / patient ID" /></div>
              <div><label className="lbl">District</label><input value={form.district} onChange={f('district')} className="inp" placeholder="e.g. Kakumiro" /></div>
              <div><label className="lbl">Village / Cell</label><input value={form.village} onChange={f('village')} className="inp" placeholder="e.g. Nkooko" /></div>
            </div>
          </>}

          {section === 'clinical' && <>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="lbl">Blood Group</label>
                <select value={form.blood_group} onChange={f('blood_group')} className="inp">
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg || '— Unknown —'}</option>)}
                </select>
              </div>
              <div><label className="lbl">Allergies</label><input value={form.allergies} onChange={f('allergies')} className="inp" placeholder="NKDA or list drugs…" /></div>
            </div>
            <div><label className="lbl">Chronic Conditions / PMH</label>
              <textarea rows={3} value={form.chronic_conditions} onChange={f('chronic_conditions')} className="inp resize-none" placeholder="Hypertension, Diabetes, Asthma, HIV… or None" />
            </div>
          </>}

          {section === 'nok' && <>
            <div><label className="lbl">Next of Kin Name</label><input value={form.next_of_kin_name} onChange={f('next_of_kin_name')} className="inp" placeholder="Full name…" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="lbl">NOK Phone</label><input value={form.next_of_kin_phone} onChange={f('next_of_kin_phone')} className="inp" placeholder="+256 700 000 000" /></div>
              <div><label className="lbl">Relationship</label>
                <select value={form.next_of_kin_relation} onChange={f('next_of_kin_relation')} className="inp">
                  {RELATIONS.map(r => <option key={r} value={r}>{r || '— Select —'}</option>)}
                </select>
              </div>
            </div>
          </>}

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button type="submit" disabled={saving} className="btn-accent flex-1 justify-center py-2.5">{saving ? 'Saving…' : isEdit ? 'Update Patient' : 'Register Patient'}</button>
            <button type="button" onClick={onClose} className="btn-outline flex-1 justify-center py-2.5">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PatientDetailRow({ patient, onRefer }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setOpen(o => !o)}>
        <td className="px-4 py-3 font-semibold text-slate-800">{patient.full_name}</td>
        <td className="px-4 py-3 font-mono text-xs text-slate-400">{patient.id}</td>
        <td className="px-4 py-3 capitalize text-slate-600">{patient.sex}</td>
        <td className="px-4 py-3 text-slate-600">{patient.date_of_birth}</td>
        <td className="px-4 py-3 text-slate-600">{patient.district}</td>
        <td className="px-4 py-3 text-slate-600">{patient.phone}</td>
        <td className="px-4 py-3">
          <span className={`badge border ${patient.blood_group ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
            {patient.blood_group || '—'}
          </span>
        </td>
        <td className="px-4 py-3 text-slate-400 text-xs">{patient.registered}</td>
        <td className="px-4 py-3 text-right">{open ? <ChevronUp className="h-4 w-4 text-slate-400 inline" /> : <ChevronDown className="h-4 w-4 text-slate-400 inline" />}</td>
      </tr>
      {open && (
        <tr>
          <td colSpan={9} className="px-4 pb-3 bg-slate-50">
            <div className="grid grid-cols-3 gap-4 pt-2 text-xs text-slate-600">
              <div><span className="font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Village</span><p>{patient.village || '—'}</p></div>
              <div><span className="font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Allergies</span><p className="text-red-600 font-medium">{patient.allergies || 'NKDA'}</p></div>
              <div><span className="font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Chronic Conditions</span><p>{patient.chronic_conditions || 'None'}</p></div>
              <div><span className="font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Next of Kin</span><p>{patient.next_of_kin_name || '—'} {patient.next_of_kin_relation ? `(${patient.next_of_kin_relation})` : ''}</p></div>
              <div><span className="font-semibold text-slate-500 uppercase tracking-wide text-[10px]">NOK Phone</span><p>{patient.next_of_kin_phone || '—'}</p></div>
              <div><span className="font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Identifier / NIN</span><p className="font-mono">{patient.identifier || '—'}</p></div>
            </div>
            <div className="pt-2">
              <button onClick={e=>{e.stopPropagation();onRefer(patient);}} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors">
                <Send className="h-3 w-3"/>Refer to DRCP
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function PatientRegistry() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [referralPatient, setReferralPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`${API}/patients`).then(r => r.json()).then(d => setPatients(d.data ?? [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = patients.filter(p =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.district?.toLowerCase().includes(search.toLowerCase()) ||
    p.identifier?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  );

  return (
    <div className="space-y-5">
      {modal !== null && (
        <PatientModal patient={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      )}
      {referralPatient && (
        <ReferralModal patient={referralPatient} onClose={() => setReferralPatient(null)} currentFacilityName="St. Francis Nsambya Hospital" />
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Users className="h-6 w-6 text-green-600" />Patient Registry</h1>
          <p className="text-sm text-slate-500 mt-0.5">St. Francis Nsambya Hospital — {patients.length} registered patients</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-accent"><Plus className="h-4 w-4" />Register Patient</button>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, district, NIN, phone…" className="inp pl-9" />
          </div>
        </div>
        {loading ? <div className="py-16 text-center text-slate-400 text-sm">Loading…</div>
        : filtered.length === 0 ? <div className="py-16 text-center text-slate-400 text-sm">No patients found.</div>
        : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Patient','ID','Sex','DOB','District','Phone','Blood Group','Registered',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => (
                <PatientDetailRow key={p.id} patient={p} onRefer={setReferralPatient}/>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
