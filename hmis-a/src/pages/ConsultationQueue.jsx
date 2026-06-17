import { useState, useEffect } from 'react';
import { ClipboardList, Plus, X, CheckCircle2, Clock, AlertCircle, Stethoscope, Activity, ChevronRight, User, FlaskConical, Pill, Send } from 'lucide-react';
import ReferralModal from '../components/ReferralModal.jsx';

const API = '/api';

const PRIORITY_STYLE = { emergency:'bg-red-100 text-red-700 border-red-200', urgent:'bg-orange-100 text-orange-700 border-orange-200', normal:'bg-slate-100 text-slate-600 border-slate-200' };
const TRIAGE_STYLE   = { emergency:'bg-red-600 text-white', urgent:'bg-orange-500 text-white', 'semi-urgent':'bg-yellow-500 text-white', 'non-urgent':'bg-emerald-600 text-white' };
const STATUS_LABEL   = { waiting:'Waiting', triaged:'Triaged', in_consultation:'In Consultation', orders:'Orders & Review', discharged:'Discharged' };

function elapsed(dt) {
  const m = Math.floor((Date.now() - new Date(dt)) / 60000);
  return m < 60 ? `${m}m ago` : `${Math.floor(m/60)}h ${m%60}m ago`;
}

/* ── Walk-in registration modal ── */
function WalkinModal({ patients, onClose, onSaved }) {
  const [form, setForm] = useState({ patient_id:'', patient_name:'', complaint:'', priority:'normal' });
  const [saving, setSaving] = useState(false);
  const f = k => e => {
    const v = e.target.value;
    if (k === 'patient_id') { const p = patients.find(x => x.id === v); setForm(prev => ({...prev, patient_id:v, patient_name:p?.full_name??''})); }
    else setForm(prev => ({...prev, [k]:v}));
  };
  const save = async e => { e.preventDefault(); setSaving(true); await fetch(`${API}/queue`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}); onSaved(); setSaving(false); };
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Walk-in Registration</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400"/></button>
        </div>
        <form onSubmit={save} className="p-6 space-y-4">
          <div><label className="lbl">Patient *</label>
            <select required value={form.patient_id} onChange={f('patient_id')} className="inp">
              <option value="">Select patient…</option>
              {patients.map(p=><option key={p.id} value={p.id}>{p.full_name} ({p.id})</option>)}
            </select>
          </div>
          <div><label className="lbl">Presenting Complaint *</label>
            <textarea required rows={2} value={form.complaint} onChange={f('complaint')} className="inp resize-none" placeholder="Chief complaint…"/>
          </div>
          <div><label className="lbl">Initial Priority</label>
            <div className="flex gap-2">{['normal','urgent','emergency'].map(p=>(
              <button key={p} type="button" onClick={()=>setForm(prev=>({...prev,priority:p}))}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border capitalize transition-colors ${form.priority===p?PRIORITY_STYLE[p]+' ring-1 ring-current':'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{p}</button>
            ))}</div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="btn-accent flex-1 justify-center py-2.5">{saving?'Registering…':'Register & Queue'}</button>
            <button type="button" onClick={onClose} className="btn-outline flex-1 justify-center py-2.5">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Triage Modal ── */
function TriageModal({ entry, onClose, onSaved }) {
  const [vitals, setVitals] = useState({ bp_systolic:'', bp_diastolic:'', heart_rate:'', temperature:'', resp_rate:'', spo2:'', weight:'', height:'', muac:'' });
  const [category, setCategory] = useState('non-urgent');
  const [triagedBy, setTriagedBy] = useState('Nurse Akello');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const v = k => e => setVitals(p => ({...p, [k]: e.target.value}));

  const bmi = vitals.weight && vitals.height ? (parseFloat(vitals.weight) / Math.pow(parseFloat(vitals.height)/100, 2)).toFixed(1) : null;
  const pp  = vitals.bp_systolic && vitals.bp_diastolic ? parseInt(vitals.bp_systolic) - parseInt(vitals.bp_diastolic) : null;

  const save = async e => {
    e.preventDefault(); setSaving(true);
    await fetch(`${API}/triage`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ queue_id: entry.id, patient_id: entry.patient_id, patient_name: entry.patient_name, vitals: { ...vitals, bmi, pulse_pressure: pp }, triage_category: category, triaged_by: triagedBy, notes }) });
    onSaved(); setSaving(false);
  };

  const CATS = [['emergency','🔴 Emergency'],['urgent','🟠 Urgent'],['semi-urgent','🟡 Semi-urgent'],['non-urgent','🟢 Non-urgent']];
  const VIT = [['bp_systolic','Systolic BP','mmHg'],['bp_diastolic','Diastolic BP','mmHg'],['heart_rate','Heart Rate','bpm'],['temperature','Temperature','°C'],['resp_rate','Resp Rate','/min'],['spo2','SpO₂','%'],['weight','Weight','kg'],['height','Height','cm'],['muac','MUAC','cm']];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 overflow-y-auto flex items-start justify-center p-4 pt-8">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800 flex items-center gap-2"><Activity className="h-4 w-4 text-blue-600"/>Triage — {entry.patient_name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Complaint: {entry.complaint}</p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400"/></button>
        </div>
        <form onSubmit={save} className="p-6 space-y-5">
          {/* Vitals */}
          <div>
            <p className="lbl mb-2">Vital Signs</p>
            <div className="grid grid-cols-3 gap-3">
              {VIT.map(([k,label,unit])=>(
                <div key={k}>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">{label} <span className="font-normal">({unit})</span></label>
                  <input type="number" step="any" value={vitals[k]} onChange={v(k)} className="inp text-sm" placeholder="—"/>
                </div>
              ))}
            </div>
            {(bmi || pp) && (
              <div className="mt-2 flex gap-4 text-xs text-slate-500">
                {bmi && <span>BMI: <strong className="text-slate-700">{bmi}</strong></span>}
                {pp  && <span>Pulse Pressure: <strong className="text-slate-700">{pp} mmHg</strong></span>}
              </div>
            )}
          </div>
          {/* Triage category */}
          <div>
            <p className="lbl mb-2">Triage Category</p>
            <div className="grid grid-cols-2 gap-2">
              {CATS.map(([k,l])=>(
                <button key={k} type="button" onClick={()=>setCategory(k)}
                  className={`py-2.5 px-3 rounded-lg text-sm font-semibold border-2 transition-all ${category===k?TRIAGE_STYLE[k]+' border-transparent shadow-md':'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="lbl">Triaged By</label><input value={triagedBy} onChange={e=>setTriagedBy(e.target.value)} className="inp"/></div>
            <div><label className="lbl">Notes</label><input value={notes} onChange={e=>setNotes(e.target.value)} className="inp" placeholder="Any observations…"/></div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-accent flex-1 justify-center py-2.5">{saving?'Saving…':'Complete Triage'}</button>
            <button type="button" onClick={onClose} className="btn-outline flex-1 justify-center py-2.5">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Clinical Note (SOAP) Modal ── */
function ConsultModal({ entry, triageData, onClose, onSaved }) {
  const [tab, setTab] = useState('S');
  const [saving, setSaving] = useState(false);
  const [subj, setSubj] = useState({ chief_complaint: entry.complaint??'', history:'', past_medical_history:'', surgical_history:'', family_history:'', social_history:'', current_medications:'', allergies:'' });
  const [obj, setObj] = useState({ general_appearance:'', cvs:'', rs:'', git:'', cns:'', msk:'', examination_findings:'', vitals_summary:'' });
  const [assess, setAssess] = useState({ diagnosis:'', icd_code:'', differential:'' });
  const [plan, setPlan] = useState({ treatment:'', investigations:'', medications_prescribed:'', follow_up:'', referral_needed: false, notes:'' });
  const [clinician, setClinician] = useState('Dr. Mukasa');

  const s = k => e => setSubj(p=>({...p,[k]:e.target.value}));
  const o = k => e => setObj(p=>({...p,[k]:e.target.value}));
  const a = k => e => setAssess(p=>({...p,[k]:e.target.value}));
  const pl = k => e => setPlan(p=>({...p,[k]:typeof e === 'boolean'?e:e.target.value}));

  const save = async e => {
    e.preventDefault(); setSaving(true);
    await fetch(`${API}/encounters`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ patient_id:entry.patient_id, patient_name:entry.patient_name, queue_id:entry.id, triage_id:entry.triage_id, subjective:subj, objective:{...obj, examination_findings:[obj.cvs&&`CVS: ${obj.cvs}`,obj.rs&&`RS: ${obj.rs}`,obj.git&&`GIT: ${obj.git}`,obj.cns&&`CNS: ${obj.cns}`,obj.msk&&`MSK: ${obj.msk}`,obj.general_appearance&&`General: ${obj.general_appearance}`].filter(Boolean).join('\n')}, assessment:assess, plan:{...plan,investigations:plan.investigations}, clinician })});
    onSaved(); setSaving(false);
  };

  const TABS = [['S','Subjective'],['O','Objective'],['A','Assessment'],['P','Plan']];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 overflow-y-auto flex items-start justify-center p-4 pt-8">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800 flex items-center gap-2"><Stethoscope className="h-4 w-4 text-blue-600"/>Clinical Note — {entry.patient_name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{triageData ? `Triage: ${triageData.triage_category} · BP ${triageData.vitals?.bp_systolic}/${triageData.vitals?.bp_diastolic} · HR ${triageData.vitals?.heart_rate} · Temp ${triageData.vitals?.temperature}°C` : 'No triage recorded'}</p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400"/></button>
        </div>

        {/* SOAP tabs */}
        <div className="flex border-b border-slate-100">
          {TABS.map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab===k?'text-blue-600 border-b-2 border-blue-600':'text-slate-400 hover:text-slate-600'}`}>
              <span className="font-mono mr-1">{k}</span>{l}
            </button>
          ))}
        </div>

        <form onSubmit={save} className="p-6">
          {/* Subjective */}
          {tab==='S' && <div className="space-y-3">
            <div><label className="lbl">Chief Complaint *</label><textarea required rows={2} value={subj.chief_complaint} onChange={s('chief_complaint')} className="inp resize-none" placeholder="Patient's main complaint in their own words…"/></div>
            <div><label className="lbl">History of Presenting Illness</label><textarea rows={3} value={subj.history} onChange={s('history')} className="inp resize-none" placeholder="Duration, onset, character, aggravating/relieving factors, associated symptoms…"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="lbl">Past Medical History</label><textarea rows={2} value={subj.past_medical_history} onChange={s('past_medical_history')} className="inp resize-none" placeholder="HTN, DM, Asthma, TB, HIV…"/></div>
              <div><label className="lbl">Surgical History</label><textarea rows={2} value={subj.surgical_history} onChange={s('surgical_history')} className="inp resize-none" placeholder="Previous operations…"/></div>
              <div><label className="lbl">Family History</label><textarea rows={2} value={subj.family_history} onChange={s('family_history')} className="inp resize-none" placeholder="Similar conditions in family…"/></div>
              <div><label className="lbl">Social History</label><textarea rows={2} value={subj.social_history} onChange={s('social_history')} className="inp resize-none" placeholder="Occupation, smoking, alcohol, living conditions…"/></div>
              <div><label className="lbl">Current Medications</label><textarea rows={2} value={subj.current_medications} onChange={s('current_medications')} className="inp resize-none" placeholder="Drug name, dose, frequency…"/></div>
              <div><label className="lbl">Allergies</label><textarea rows={2} value={subj.allergies} onChange={s('allergies')} className="inp resize-none" placeholder="Drug/food allergies or NKDA…"/></div>
            </div>
          </div>}

          {/* Objective */}
          {tab==='O' && <div className="space-y-3">
            <div><label className="lbl">General Appearance</label><input value={obj.general_appearance} onChange={o('general_appearance')} className="inp" placeholder="Conscious, alert, well/ill-looking, pale, jaundiced, dehydrated…"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="lbl">Cardiovascular (CVS)</label><textarea rows={2} value={obj.cvs} onChange={o('cvs')} className="inp resize-none" placeholder="S1S2 normal, no murmurs, peripheral pulses…"/></div>
              <div><label className="lbl">Respiratory (RS)</label><textarea rows={2} value={obj.rs} onChange={o('rs')} className="inp resize-none" placeholder="Chest clear, equal air entry, no wheeze/crepitations…"/></div>
              <div><label className="lbl">Gastrointestinal (GIT)</label><textarea rows={2} value={obj.git} onChange={o('git')} className="inp resize-none" placeholder="Abdomen soft, non-tender, bowel sounds normal…"/></div>
              <div><label className="lbl">Central Nervous System (CNS)</label><textarea rows={2} value={obj.cns} onChange={o('cns')} className="inp resize-none" placeholder="GCS 15/15, pupils equal and reactive…"/></div>
              <div><label className="lbl">Musculoskeletal (MSK)</label><textarea rows={2} value={obj.msk} onChange={o('msk')} className="inp resize-none" placeholder="No joint swelling, full ROM, no deformity…"/></div>
              <div><label className="lbl">Other Findings</label><textarea rows={2} value={obj.examination_findings} onChange={o('examination_findings')} className="inp resize-none" placeholder="Skin, lymph nodes, HEENT…"/></div>
            </div>
          </div>}

          {/* Assessment */}
          {tab==='A' && <div className="space-y-3">
            <div><label className="lbl">Primary Diagnosis *</label><input required value={assess.diagnosis} onChange={a('diagnosis')} className="inp" placeholder="e.g. Malaria — Plasmodium falciparum"/></div>
            <div><label className="lbl">ICD-10 Code</label><input value={assess.icd_code} onChange={a('icd_code')} className="inp" placeholder="e.g. B50.9"/></div>
            <div><label className="lbl">Differential Diagnoses</label><textarea rows={3} value={assess.differential} onChange={a('differential')} className="inp resize-none" placeholder="1. Typhoid fever\n2. Bacterial meningitis\n3. …"/></div>
          </div>}

          {/* Plan */}
          {tab==='P' && <div className="space-y-3">
            <div><label className="lbl">Treatment Plan *</label><textarea rows={3} value={plan.treatment} onChange={pl('treatment')} className="inp resize-none" placeholder="IV fluids, monitoring, wound care, O2 therapy…"/></div>
            <div><label className="lbl">Investigations Ordered</label><textarea rows={2} value={plan.investigations} onChange={pl('investigations')} className="inp resize-none" placeholder="CBC, LFT, Blood culture, CXR…"/></div>
            <div><label className="lbl">Medications Prescribed</label><textarea rows={3} value={plan.medications_prescribed} onChange={pl('medications_prescribed')} className="inp resize-none" placeholder="1. ALU 80/480mg stat + 5 days\n2. Paracetamol 1g TDS x 3 days\n…"/></div>
            <div><label className="lbl">Follow-up Plan</label><input value={plan.follow_up} onChange={pl('follow_up')} className="inp" placeholder="Review in 3 days / RCH booking / Specialist referral…"/></div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={plan.referral_needed} onChange={e=>setPlan(p=>({...p,referral_needed:e.target.checked}))} className="h-4 w-4 rounded accent-blue-600"/>
              <span className="text-sm font-medium text-slate-700">Patient requires referral to another facility</span>
            </label>
          </div>}

          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
            <div className="flex-1"><label className="lbl">Clinician</label><input value={clinician} onChange={e=>setClinician(e.target.value)} className="inp"/></div>
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={()=>setTab(t=>({S:'O',O:'A',A:'P',P:'P'}[t]??'P'))} className="btn-outline">Next →</button>
              <button type="submit" disabled={saving} className="btn-accent">{saving?'Saving…':'Save Note'}</button>
              <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Orders & Review panel ── */
function OrdersPanel({ entry, encounters, labRequests, dispensing, onDischarge, onClose }) {
  const enc = encounters.find(e => e.id === entry.encounter_id);
  const labs = labRequests.filter(l => l.patient_id === entry.patient_id);
  const meds = dispensing.filter(d => d.patient_id === entry.patient_id);
  const [discharging, setDischarging] = useState(false);

  const discharge = async () => {
    setDischarging(true);
    await fetch(`${API}/encounters/${entry.encounter_id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status:'complete'}) });
    onDischarge();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 overflow-y-auto flex items-start justify-center p-4 pt-8">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Orders & Review — {entry.patient_name}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400"/></button>
        </div>
        <div className="p-6 space-y-5">
          {enc && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 space-y-1">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Diagnosis</p>
              <p className="font-semibold text-slate-800">{enc.assessment?.diagnosis}</p>
              {enc.assessment?.icd_code && <p className="text-xs text-slate-500">ICD-10: {enc.assessment.icd_code}</p>}
              <p className="text-sm text-slate-600 mt-1">{enc.plan?.treatment}</p>
            </div>
          )}
          <div>
            <p className="lbl flex items-center gap-1.5 mb-2"><FlaskConical className="h-3.5 w-3.5"/>Lab & Radiology Requests</p>
            {labs.length === 0 ? <p className="text-sm text-slate-400">No requests.</p> : labs.map(l=>(
              <div key={l.id} className="flex items-center justify-between py-2 border-b border-slate-100">
                <div><p className="text-sm font-medium text-slate-800">{l.test_type}</p><p className="text-xs text-slate-400">{l.category} · {l.status}</p></div>
                <span className={`badge border text-xs ${l.status==='complete'?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>{l.status}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="lbl flex items-center gap-1.5 mb-2"><Pill className="h-3.5 w-3.5"/>Medications Dispensed</p>
            {meds.length === 0 ? <p className="text-sm text-slate-400">None dispensed.</p> : meds.map(d=>(
              <div key={d.id} className="py-2 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-800">{d.medication_name} × {d.quantity} {d.unit}</p>
                <p className="text-xs text-slate-400">{d.dosage_instructions}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={discharge} disabled={discharging} className="btn-accent flex-1 justify-center py-2.5 bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle2 className="h-4 w-4"/> {discharging?'Discharging…':'Discharge Patient'}
            </button>
            <button onClick={onClose} className="btn-outline flex-1 justify-center py-2.5">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function ConsultationQueue() {
  const [queue, setQueue] = useState([]);
  const [patients, setPatients] = useState([]);
  const [triage, setTriage] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [labRequests, setLabRequests] = useState([]);
  const [dispensing, setDispensing] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showWalkin, setShowWalkin]   = useState(false);
  const [triageEntry, setTriageEntry] = useState(null);
  const [consultEntry, setConsultEntry] = useState(null);
  const [ordersEntry, setOrdersEntry] = useState(null);
  const [referralTarget, setReferralTarget] = useState(null);
  const [filterStatus, setFilterStatus] = useState('active');

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/queue`).then(r=>r.json()),
      fetch(`${API}/patients`).then(r=>r.json()),
      fetch(`${API}/triage`).then(r=>r.json()),
      fetch(`${API}/encounters`).then(r=>r.json()),
      fetch(`${API}/lab`).then(r=>r.json()),
      fetch(`${API}/dispensing`).then(r=>r.json()),
    ]).then(([q,p,t,e,l,d])=>{
      setQueue(Array.isArray(q)?q:[]);
      setPatients(p.data??[]);
      setTriage(Array.isArray(t)?t:[]);
      setEncounters(Array.isArray(e)?e:[]);
      setLabRequests(Array.isArray(l)?l:[]);
      setDispensing(Array.isArray(d)?d:[]);
    }).finally(()=>setLoading(false));
  };

  useEffect(()=>{ load(); },[]);

  const filtered = filterStatus === 'active'
    ? queue.filter(q => q.status !== 'discharged')
    : filterStatus === 'all' ? queue : queue.filter(q => q.status === filterStatus);

  const counts = {
    waiting: queue.filter(q=>q.status==='waiting').length,
    triaged: queue.filter(q=>q.status==='triaged').length,
    in_consultation: queue.filter(q=>q.status==='in_consultation').length,
    discharged: queue.filter(q=>q.status==='discharged').length,
  };

  const getTriageForEntry = (entry) => triage.find(t => t.id === entry.triage_id);

  const actionBtn = (entry) => {
    if (entry.status === 'waiting') return <button onClick={()=>setTriageEntry(entry)} className="btn-accent text-xs py-1.5">Triage</button>;
    if (entry.status === 'triaged') return <button onClick={()=>setConsultEntry(entry)} className="btn-accent text-xs py-1.5"><Stethoscope className="h-3.5 w-3.5"/>Consult</button>;
    if (entry.status === 'in_consultation') return <button onClick={()=>setOrdersEntry(entry)} className="btn-outline text-xs py-1.5"><ChevronRight className="h-3.5 w-3.5"/>Orders</button>;
    if (entry.status === 'orders') return <button onClick={()=>setOrdersEntry(entry)} className="btn-outline text-xs py-1.5">Review</button>;
    return <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5"/>Done</span>;
  };

  const STATUS_COLOR = { waiting:'border-l-yellow-400', triaged:'border-l-blue-400', in_consultation:'border-l-purple-400', orders:'border-l-orange-400', discharged:'border-l-emerald-400' };

  const openReferral = (entry) => {
    const patient = patients.find(p => p.id === entry.patient_id);
    const encounter = encounters.find(e => e.id === entry.encounter_id);
    const labs = labRequests.filter(l => l.patient_id === entry.patient_id);
    setReferralTarget({ patient, encounter, labs });
  };

  return (
    <div className="space-y-5">
      {showWalkin && <WalkinModal patients={patients} onClose={()=>setShowWalkin(false)} onSaved={()=>{setShowWalkin(false);load();}}/>}
      {triageEntry && <TriageModal entry={triageEntry} onClose={()=>setTriageEntry(null)} onSaved={()=>{setTriageEntry(null);load();}}/>}
      {consultEntry && <ConsultModal entry={consultEntry} triageData={getTriageForEntry(consultEntry)} onClose={()=>setConsultEntry(null)} onSaved={()=>{setConsultEntry(null);load();}}/>}
      {ordersEntry && <OrdersPanel entry={ordersEntry} encounters={encounters} labRequests={labRequests} dispensing={dispensing} onDischarge={()=>{setOrdersEntry(null);load();}} onClose={()=>setOrdersEntry(null)}/>}
      {referralTarget?.patient && <ReferralModal patient={referralTarget.patient} encounter={referralTarget.encounter} labResults={referralTarget.labs} onClose={()=>setReferralTarget(null)}/>}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><ClipboardList className="h-6 w-6 text-blue-600"/>Consultation Queue</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kakumiro HC III — clinical workflow</p>
        </div>
        <button onClick={()=>setShowWalkin(true)} className="btn-accent"><Plus className="h-4 w-4"/>Walk-in</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[['waiting','Waiting',Clock,'text-yellow-600 bg-yellow-50 border-yellow-200'],['triaged','Triaged',Activity,'text-blue-600 bg-blue-50 border-blue-200'],['in_consultation','Consulting',Stethoscope,'text-purple-600 bg-purple-50 border-purple-200'],['discharged','Discharged',CheckCircle2,'text-emerald-600 bg-emerald-50 border-emerald-200']].map(([k,l,Icon,c])=>(
          <div key={k} className={`card p-3 border ${c.split(' ').slice(1).join(' ')} cursor-pointer hover:shadow-md transition-shadow`} onClick={()=>setFilterStatus(k)}>
            <Icon className={`h-4 w-4 ${c.split(' ')[0]} mb-1.5`}/>
            <p className="text-xl font-bold text-slate-800">{counts[k]??0}</p>
            <p className="text-xs text-slate-500 font-medium">{l}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {[['active','Active'],['all','All Today'],['waiting','Waiting'],['triaged','Triaged'],['in_consultation','Consulting'],['discharged','Discharged']].map(([k,l])=>(
          <button key={k} onClick={()=>setFilterStatus(k)} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${filterStatus===k?'bg-white shadow-sm text-slate-900':'text-slate-500 hover:text-slate-700'}`}>{l}</button>
        ))}
      </div>

      <div className="card divide-y divide-slate-100">
        {loading ? <div className="py-12 text-center text-slate-400 text-sm">Loading…</div>
        : filtered.length === 0 ? <div className="py-12 text-center text-slate-400 text-sm">No patients in queue.</div>
        : filtered.map(entry => {
          const t = getTriageForEntry(entry);
          return (
            <div key={entry.id} className={`px-5 py-4 flex items-center gap-4 border-l-4 ${STATUS_COLOR[entry.status]??'border-l-slate-200'}`}>
              <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-slate-400"/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="font-semibold text-slate-800">{entry.patient_name}</p>
                  <span className={`badge border text-[10px] ${PRIORITY_STYLE[entry.priority]??PRIORITY_STYLE.normal} capitalize`}>{entry.priority}</span>
                  {t && <span className={`badge text-[10px] px-2 ${TRIAGE_STYLE[t.triage_category]}`}>{t.triage_category}</span>}
                  <span className="text-[10px] font-medium text-slate-400">{STATUS_LABEL[entry.status]}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{entry.complaint}</p>
                {t && <p className="text-[10px] text-slate-400 mt-0.5">BP {t.vitals?.bp_systolic}/{t.vitals?.bp_diastolic} · HR {t.vitals?.heart_rate} · Temp {t.vitals?.temperature}°C · SpO₂ {t.vitals?.spo2}%</p>}
                <p className="text-[10px] text-slate-400">{elapsed(entry.arrived_at)}</p>
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                {actionBtn(entry)}
                {(entry.status==='in_consultation'||entry.status==='orders'||entry.status==='discharged') && (
                  <button onClick={()=>openReferral(entry)} className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                    <Send className="h-3 w-3"/>Refer
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
