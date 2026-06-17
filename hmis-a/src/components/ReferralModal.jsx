import { useState, useEffect } from 'react';
import { X, Send, LogIn, AlertCircle, CheckCircle2, Building2, Lock } from 'lucide-react';

const DRCP = '/drcp-proxy';
export const SESSION_KEY = 'drcp_token';
export const USER_KEY    = 'drcp_user';

export const getToken = () => sessionStorage.getItem(SESSION_KEY);
export const getUser  = () => { try { return JSON.parse(sessionStorage.getItem(USER_KEY)); } catch { return null; } };
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

function LoginPanel({ onSuccess }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState('');

  const login = async e => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      const res = await fetch(`${DRCP}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Login failed');
      sessionStorage.setItem(SESSION_KEY, data.token ?? data.access_token);
      sessionStorage.setItem(USER_KEY, JSON.stringify(data.user ?? { email }));
      onSuccess();
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <Lock className="h-4 w-4 text-blue-600 flex-shrink-0" />
        <p className="text-sm text-blue-700">Sign in with your <strong>DRCP account</strong> to submit referrals directly to the platform.</p>
      </div>
      {err && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4 flex-shrink-0"/>{err}</div>}
      <form onSubmit={login} className="space-y-3">
        <div><label className="lbl">DRCP Email</label><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="inp" placeholder="you@hospital.ug"/></div>
        <div><label className="lbl">Password</label><input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="inp" placeholder="••••••••"/></div>
        <button type="submit" disabled={loading} className="btn-accent w-full justify-center py-2.5 mt-1">
          <LogIn className="h-4 w-4"/>{loading?'Signing in…':'Sign In to DRCP'}
        </button>
      </form>
    </div>
  );
}

function ReferralForm({ patient, encounter, labResults, onClose, onSuccess, currentFacilityName = '' }) {
  const [facilities, setFacilities] = useState([]);
  const [form, setForm] = useState({ receiving_facility_id:'', urgency:'routine', reason_for_referral:'', additional_notes:'' });
  const [clinical, setClinical] = useState({
    presenting_complaint:   encounter?.subjective?.chief_complaint    ?? '',
    clinical_history:       encounter?.subjective?.history             ?? '',
    examination_findings:   encounter?.objective?.examination_findings ?? '',
    diagnosis:              encounter?.assessment?.diagnosis           ?? '',
    treatment_given:        encounter?.plan?.treatment                 ?? '',
    allergies:              encounter?.subjective?.allergies           ?? patient?.allergies ?? '',
    current_medications:    encounter?.subjective?.current_medications ?? '',
    investigations_summary: labResults.length > 0
      ? labResults.map(l => `${l.test_type}: ${l.result_summary||'pending'}`).join('\n')
      : encounter?.plan?.investigations ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');

  useEffect(() => {
    fetch(`${DRCP}/facilities`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        const all = Array.isArray(d) ? d : (d.data ?? []);
        const filtered = currentFacilityName
          ? all.filter(f => !f.name?.toLowerCase().includes(currentFacilityName.toLowerCase()))
          : all;
        setFacilities(filtered);
      })
      .catch(() => {});
  }, [currentFacilityName]);

  const f  = k => e => setForm(p    => ({ ...p, [k]: e.target.value }));
  const cf = k => e => setClinical(p => ({ ...p, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (!form.receiving_facility_id) { setErr('Please select a receiving facility.'); return; }
    setErr(''); setLoading(true);
    try {
      // Try to match or create patient in DRCP
      let patientId = null;
      try {
        const sr = await fetch(`${DRCP}/patients?search=${encodeURIComponent(patient.identifier ?? patient.full_name)}`, { headers: authHeaders() });
        const sd = await sr.json();
        const list = Array.isArray(sd) ? sd : (sd.data ?? []);
        const match = list.find(p => p.identifier === patient.identifier || p.full_name === patient.full_name);
        if (match) patientId = match.id;
      } catch {}

      if (!patientId) {
        const cp = await fetch(`${DRCP}/patients`, {
          method: 'POST', headers: authHeaders(),
          body: JSON.stringify({ full_name:patient.full_name, sex:patient.sex, date_of_birth:patient.date_of_birth, phone:patient.phone, district:patient.district, village:patient.village, identifier:patient.identifier, next_of_kin_name:patient.next_of_kin_name, next_of_kin_phone:patient.next_of_kin_phone }),
        });
        if (!cp.ok) throw new Error('Could not register patient in DRCP. ' + (await cp.json()).message);
        patientId = (await cp.json()).id;
      }

      const res = await fetch(`${DRCP}/referrals`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ patient_id:patientId, receiving_facility_id:form.receiving_facility_id, urgency:form.urgency, reason_for_referral:form.reason_for_referral, additional_notes:form.additional_notes, clinical }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? 'Referral submission failed');
      onSuccess(await res.json());
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
      {err && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4 flex-shrink-0"/>{err}</div>}

      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Referring Patient</p>
        <p className="font-semibold text-slate-800">{patient.full_name}</p>
        <p className="text-xs text-slate-500">{patient.sex} · DOB {patient.date_of_birth} · {patient.district}{patient.village?`, ${patient.village}`:''}</p>
        <p className="text-xs text-slate-400 mt-0.5">ID: {patient.id} · NIN: {patient.identifier} · Phone: {patient.phone}</p>
        {patient.allergies && patient.allergies!=='NKDA' && <p className="text-xs text-red-600 mt-1 font-medium">⚠ Allergies: {patient.allergies}</p>}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Referral Details</p>
        <div><label className="lbl">Receiving Facility *</label>
          <select required value={form.receiving_facility_id} onChange={f('receiving_facility_id')} className="inp">
            <option value="">Select receiving facility…</option>
            {facilities.map(fac=><option key={fac.id} value={fac.id}>{fac.name}</option>)}
          </select>
        </div>
        <div><label className="lbl">Urgency</label>
          <div className="flex gap-2">
            {[['routine','Routine'],['urgent','Urgent'],['emergency','Emergency']].map(([k,l])=>(
              <button key={k} type="button" onClick={()=>setForm(p=>({...p,urgency:k}))}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border capitalize transition-colors ${form.urgency===k?(k==='emergency'?'bg-red-600 text-white border-red-600':k==='urgent'?'bg-orange-500 text-white border-orange-500':'bg-blue-600 text-white border-blue-600'):'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{l}</button>
            ))}
          </div>
        </div>
        <div><label className="lbl">Reason for Referral *</label>
          <textarea required rows={2} value={form.reason_for_referral} onChange={f('reason_for_referral')} className="inp resize-none" placeholder="State why patient requires referral to a higher facility…"/>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Clinical Information <span className="text-[10px] font-normal text-slate-400">(pre-filled — review &amp; edit)</span></p>
        <div><label className="lbl">Presenting Complaint</label><textarea rows={2} value={clinical.presenting_complaint} onChange={cf('presenting_complaint')} className="inp resize-none"/></div>
        <div><label className="lbl">Clinical History</label><textarea rows={2} value={clinical.clinical_history} onChange={cf('clinical_history')} className="inp resize-none"/></div>
        <div><label className="lbl">Examination Findings</label><textarea rows={2} value={clinical.examination_findings} onChange={cf('examination_findings')} className="inp resize-none"/></div>
        <div><label className="lbl">Diagnosis</label><input value={clinical.diagnosis} onChange={cf('diagnosis')} className="inp"/></div>
        <div><label className="lbl">Treatment Given</label><textarea rows={2} value={clinical.treatment_given} onChange={cf('treatment_given')} className="inp resize-none"/></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="lbl">Allergies</label><input value={clinical.allergies} onChange={cf('allergies')} className="inp"/></div>
          <div><label className="lbl">Current Medications</label><input value={clinical.current_medications} onChange={cf('current_medications')} className="inp"/></div>
        </div>
        <div><label className="lbl">Investigations Summary</label><textarea rows={3} value={clinical.investigations_summary} onChange={cf('investigations_summary')} className="inp resize-none"/></div>
        <div><label className="lbl">Additional Notes</label><textarea rows={2} value={form.additional_notes} onChange={f('additional_notes')} className="inp resize-none" placeholder="Any other information for receiving facility…"/></div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-accent flex-1 justify-center py-2.5">
          <Send className="h-4 w-4"/>{loading?'Submitting…':'Submit Referral to DRCP'}
        </button>
        <button type="button" onClick={onClose} className="btn-outline flex-1 justify-center py-2.5">Cancel</button>
      </div>
    </form>
  );
}

function SuccessPanel({ referral, onClose }) {
  return (
    <div className="p-8 flex flex-col items-center text-center gap-4">
      <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-600"/>
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">Referral Submitted!</h3>
        <p className="text-sm text-slate-600">Successfully created in DRCP.</p>
        {referral?.id && <p className="text-xs text-slate-400 mt-2 font-mono">Referral ID: {referral.id}</p>}
        {referral?.reference_number && <p className="text-xs text-slate-400 font-mono">Ref #: {referral.reference_number}</p>}
      </div>
      <button onClick={onClose} className="btn-accent px-8 py-2.5">Close</button>
    </div>
  );
}

export default function ReferralModal({ patient, encounter, labResults = [], onClose, currentFacilityName = '' }) {
  const [authed, setAuthed] = useState(!!getToken());
  const [success, setSuccess] = useState(null);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600"/>
            <div>
              <h2 className="font-bold text-slate-800">Refer to DRCP</h2>
              <p className="text-xs text-slate-400">{authed?`Signed in as ${getUser()?.name??getUser()?.email??'DRCP user'}`:'Authentication required'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {authed && <button onClick={()=>{sessionStorage.removeItem(SESSION_KEY);sessionStorage.removeItem(USER_KEY);setAuthed(false);}} className="text-xs text-slate-400 hover:text-red-500 transition-colors">Sign out</button>}
            <button onClick={onClose}><X className="h-5 w-5 text-slate-400"/></button>
          </div>
        </div>
        {success  ? <SuccessPanel referral={success} onClose={onClose}/> :
         !authed  ? <LoginPanel onSuccess={()=>setAuthed(true)}/> :
                    <ReferralForm patient={patient} encounter={encounter} labResults={labResults} onClose={onClose} onSuccess={setSuccess} currentFacilityName={currentFacilityName}/>}
      </div>
    </div>
  );
}
