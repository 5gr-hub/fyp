import { useState, useEffect } from 'react';
import { FlaskConical, Plus, X, CheckCircle2, Search } from 'lucide-react';

const API = '/api';

/* ── Test panel definitions ─────────────────────────────────────────────── */
export const LAB_PANELS = {
  'Full Blood Count (CBC)': {
    category: 'lab',
    components: [
      { name: 'Haemoglobin (Hb)', unit: 'g/dL', reference: '12.0–17.0' },
      { name: 'Red Blood Cells (RBC)', unit: '×10⁶/μL', reference: '4.2–5.8' },
      { name: 'Haematocrit (HCT)', unit: '%', reference: '37–52' },
      { name: 'MCV', unit: 'fL', reference: '80–100' },
      { name: 'MCH', unit: 'pg', reference: '27–33' },
      { name: 'MCHC', unit: 'g/dL', reference: '32–36' },
      { name: 'RDW', unit: '%', reference: '11.5–14.5' },
      { name: 'White Blood Cells (WBC)', unit: '×10³/μL', reference: '4.0–11.0' },
      { name: 'Neutrophils', unit: '%', reference: '50–70' },
      { name: 'Lymphocytes', unit: '%', reference: '20–40' },
      { name: 'Monocytes', unit: '%', reference: '2–8' },
      { name: 'Eosinophils', unit: '%', reference: '1–4' },
      { name: 'Basophils', unit: '%', reference: '0–1' },
      { name: 'Platelets', unit: '×10³/μL', reference: '150–400' },
      { name: 'MPV', unit: 'fL', reference: '7.5–12.5' },
    ],
  },
  'Liver Function Tests (LFT)': {
    category: 'lab',
    components: [
      { name: 'ALT (SGPT)', unit: 'U/L', reference: '7–56' },
      { name: 'AST (SGOT)', unit: 'U/L', reference: '10–40' },
      { name: 'Alkaline Phosphatase (ALP)', unit: 'U/L', reference: '44–147' },
      { name: 'GGT', unit: 'U/L', reference: '8–61' },
      { name: 'Total Bilirubin', unit: 'μmol/L', reference: '3.4–20.5' },
      { name: 'Direct Bilirubin', unit: 'μmol/L', reference: '0–8.6' },
      { name: 'Albumin', unit: 'g/L', reference: '35–50' },
      { name: 'Total Protein', unit: 'g/L', reference: '60–80' },
      { name: 'Prothrombin Time (PT)', unit: 'seconds', reference: '11–14' },
    ],
  },
  'Renal Function Tests (RFT)': {
    category: 'lab',
    components: [
      { name: 'Creatinine', unit: 'μmol/L', reference: '62–115' },
      { name: 'Urea', unit: 'mmol/L', reference: '2.5–6.7' },
      { name: 'Uric Acid', unit: 'μmol/L', reference: '202–416' },
      { name: 'eGFR', unit: 'mL/min/1.73m²', reference: '>60' },
      { name: 'Sodium (Na⁺)', unit: 'mmol/L', reference: '136–145' },
      { name: 'Potassium (K⁺)', unit: 'mmol/L', reference: '3.5–5.0' },
      { name: 'Chloride (Cl⁻)', unit: 'mmol/L', reference: '98–106' },
      { name: 'Bicarbonate (HCO₃⁻)', unit: 'mmol/L', reference: '22–29' },
    ],
  },
  'Malaria RDT': {
    category: 'lab',
    components: [
      { name: 'P. falciparum Antigen (HRP2)', unit: '', reference: 'Negative' },
      { name: 'Pan-malaria Antigen (pLDH)', unit: '', reference: 'Negative' },
      { name: 'Control Line', unit: '', reference: 'Present' },
      { name: 'Interpretation', unit: '', reference: 'Negative' },
    ],
  },
  'Urinalysis': {
    category: 'lab',
    components: [
      { name: 'Colour', unit: '', reference: 'Pale yellow' },
      { name: 'Clarity', unit: '', reference: 'Clear' },
      { name: 'pH', unit: '', reference: '4.5–8.0' },
      { name: 'Specific Gravity', unit: '', reference: '1.003–1.030' },
      { name: 'Protein', unit: '', reference: 'Negative' },
      { name: 'Glucose', unit: '', reference: 'Negative' },
      { name: 'Ketones', unit: '', reference: 'Negative' },
      { name: 'Blood', unit: '', reference: 'Negative' },
      { name: 'Nitrites', unit: '', reference: 'Negative' },
      { name: 'Leukocyte Esterase', unit: '', reference: 'Negative' },
      { name: 'Bilirubin', unit: '', reference: 'Negative' },
      { name: 'Urobilinogen', unit: 'EU/dL', reference: '0.1–1.0' },
    ],
  },
  'Blood Glucose': {
    category: 'lab',
    components: [
      { name: 'Random Blood Glucose', unit: 'mmol/L', reference: '3.9–11.1' },
      { name: 'Fasting Blood Glucose', unit: 'mmol/L', reference: '3.9–6.1' },
    ],
  },
  'HIV Rapid Test': {
    category: 'lab',
    components: [
      { name: 'Test 1 (Determine)', unit: '', reference: 'Negative' },
      { name: 'Test 2 (Unigold)', unit: '', reference: 'Negative' },
      { name: 'Final Interpretation', unit: '', reference: 'Non-reactive' },
    ],
  },
  'Hepatitis B sAg': {
    category: 'lab',
    components: [
      { name: 'HBsAg', unit: '', reference: 'Non-reactive' },
    ],
  },
  'Widal Test': {
    category: 'lab',
    components: [
      { name: 'S. typhi O antigen', unit: 'titre', reference: '<1:80' },
      { name: 'S. typhi H antigen', unit: 'titre', reference: '<1:80' },
      { name: 'S. paratyphi AH', unit: 'titre', reference: '<1:80' },
      { name: 'S. paratyphi BH', unit: 'titre', reference: '<1:80' },
    ],
  },
  'Sputum AFB (TB)': {
    category: 'lab',
    components: [
      { name: 'AAFB Smear Grade', unit: '', reference: 'Negative' },
      { name: 'MTB Detection (Xpert)', unit: '', reference: 'Not detected' },
      { name: 'Rifampicin Resistance', unit: '', reference: 'Not detected' },
    ],
  },
  'CD4 Count': {
    category: 'lab',
    components: [
      { name: 'CD4 Absolute Count', unit: 'cells/μL', reference: '>500' },
      { name: 'CD4 Percentage', unit: '%', reference: '>29' },
    ],
  },
  'Chest X-Ray': {
    category: 'radiology',
    components: [
      { name: 'Radiologist Report', unit: '', reference: '' },
    ],
  },
  'Abdominal Ultrasound': {
    category: 'radiology',
    components: [
      { name: 'Liver', unit: '', reference: 'Normal' },
      { name: 'Gallbladder', unit: '', reference: 'Normal' },
      { name: 'Spleen', unit: '', reference: 'Normal' },
      { name: 'Kidneys (Right)', unit: '', reference: 'Normal' },
      { name: 'Kidneys (Left)', unit: '', reference: 'Normal' },
      { name: 'Pancreas', unit: '', reference: 'Normal' },
      { name: 'Aorta', unit: '', reference: 'Normal' },
      { name: 'Sonographer Impression', unit: '', reference: '' },
    ],
  },
  'Obstetric Ultrasound': {
    category: 'radiology',
    components: [
      { name: 'Gestational Age', unit: 'weeks', reference: '' },
      { name: 'Foetal Presentation', unit: '', reference: '' },
      { name: 'Foetal Heart Rate', unit: 'bpm', reference: '120–160' },
      { name: 'Placental Position', unit: '', reference: '' },
      { name: 'Amniotic Fluid Index', unit: 'cm', reference: '8–18' },
      { name: 'Estimated Foetal Weight', unit: 'g', reference: '' },
      { name: 'Impression', unit: '', reference: '' },
    ],
  },
};

const ALL_TESTS = Object.keys(LAB_PANELS);
const STATUS_STYLE = {
  pending:    'bg-yellow-50 text-yellow-700 border-yellow-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  complete:   'bg-emerald-50 text-emerald-700 border-emerald-200',
};

/* ── Request modal ────────────────────────────────────────────────────────── */
function RequestModal({ patients, onClose, onSaved }) {
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [testType, setTestType] = useState('');
  const [requestedBy, setRequestedBy] = useState('Dr. Mukasa');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const panel = testType ? LAB_PANELS[testType] : null;
  const filtered = ALL_TESTS.filter(t => t.toLowerCase().includes(search.toLowerCase()));

  const save = async e => {
    e.preventDefault(); setSaving(true);
    const components = panel ? panel.components.map(c => ({ ...c, value: '' })) : [];
    await fetch(`${API}/lab`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patient_id: patientId, patient_name: patientName, test_type: testType, category: panel?.category ?? 'lab', components, requested_by: requestedBy, notes }) });
    onSaved(); setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">New Test Request</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
        </div>
        <form onSubmit={save} className="p-6 space-y-4">
          <div>
            <label className="lbl">Patient *</label>
            <select required value={patientId} onChange={e => { setPatientId(e.target.value); setPatientName(patients.find(p => p.id === e.target.value)?.full_name ?? ''); }} className="inp">
              <option value="">Select patient…</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.id})</option>)}
            </select>
          </div>
          <div>
            <label className="lbl">Test Panel *</label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search test…" className="inp pl-8 text-sm" />
            </div>
            <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
              {filtered.map(t => (
                <button key={t} type="button" onClick={() => { setTestType(t); setSearch(''); }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${testType === t ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'}`}>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${LAB_PANELS[t].category === 'radiology' ? 'bg-purple-400' : 'bg-blue-400'}`} />
                  {t}
                </button>
              ))}
            </div>
            {testType && (
              <p className="text-xs text-slate-500 mt-1.5">
                {panel?.components.length} components · {panel?.category}
              </p>
            )}
          </div>
          <div>
            <label className="lbl">Requested By</label>
            <input value={requestedBy} onChange={e => setRequestedBy(e.target.value)} className="inp" />
          </div>
          <div>
            <label className="lbl">Clinical Notes</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className="inp resize-none" placeholder="Relevant clinical information…" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving || !testType} className="btn-accent flex-1 justify-center py-2.5">{saving ? 'Requesting…' : 'Submit Request'}</button>
            <button type="button" onClick={onClose} className="btn-outline flex-1 justify-center py-2.5">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Result entry modal ───────────────────────────────────────────────────── */
function ResultModal({ request, onClose, onSaved }) {
  const [components, setComponents] = useState(
    (request.components ?? []).length > 0
      ? request.components.map(c => ({ ...c }))
      : [{ name: 'Result', unit: '', reference: '', value: '' }]
  );
  const [saving, setSaving] = useState(false);

  const setVal = (i, v) => setComponents(prev => prev.map((c, idx) => idx === i ? { ...c, value: v } : c));

  const save = async e => {
    e.preventDefault(); setSaving(true);
    const result_summary = components.map(c => `${c.name}: ${c.value || '—'}${c.unit ? ' ' + c.unit : ''}`).join(' | ');
    await fetch(`${API}/lab/${request.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ components, result_summary, status: 'complete' }) });
    onSaved(); setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800">Enter Results — {request.test_type}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Patient: {request.patient_name}</p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
        </div>
        <form onSubmit={save} className="p-6 space-y-3">
          <div className="grid grid-cols-1 gap-2">
            {components.map((c, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <p className="text-sm font-medium text-slate-700">{c.name}</p>
                  {c.reference && <p className="text-[10px] text-slate-400">Ref: {c.reference} {c.unit}</p>}
                </div>
                <div className="col-span-5">
                  <input value={c.value ?? ''} onChange={e => setVal(i, e.target.value)} className="inp text-sm" placeholder="Enter value…" />
                </div>
                <div className="col-span-2 text-xs text-slate-400 truncate">{c.unit}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-accent flex-1 justify-center py-2.5">{saving ? 'Saving…' : 'Save Results'}</button>
            <button type="button" onClick={onClose} className="btn-outline flex-1 justify-center py-2.5">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── View results modal ───────────────────────────────────────────────────── */
function ViewModal({ request, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800">{request.test_type} — Results</h2>
            <p className="text-xs text-slate-400 mt-0.5">Patient: {request.patient_name} · {new Date(request.requested_at).toLocaleString()}</p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
        </div>
        <div className="p-6">
          {(request.components ?? []).length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Parameter</th>
                  <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Result</th>
                  <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Unit</th>
                  <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {request.components.map((c, i) => (
                  <tr key={i}>
                    <td className="py-1.5 font-medium text-slate-700">{c.name}</td>
                    <td className="py-1.5 font-semibold text-slate-900">{c.value || '—'}</td>
                    <td className="py-1.5 text-slate-400 text-xs">{c.unit}</td>
                    <td className="py-1.5 text-slate-400 text-xs">{c.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-slate-500 text-sm">{request.result_summary || 'No results recorded.'}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function LabRadiology() {
  const [requests, setRequests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [resultFor, setResultFor] = useState(null);
  const [viewFor, setViewFor] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/lab`).then(r => r.json()),
      fetch(`${API}/patients`).then(r => r.json()),
    ]).then(([lab, p]) => {
      setRequests(Array.isArray(lab) ? lab : []);
      setPatients(p.data ?? []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? requests
    : filter === 'lab' || filter === 'radiology' ? requests.filter(r => r.category === filter)
    : requests.filter(r => r.status === filter);

  return (
    <div className="space-y-5">
      {showAdd && <RequestModal patients={patients} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
      {resultFor && <ResultModal request={resultFor} onClose={() => setResultFor(null)} onSaved={() => { setResultFor(null); load(); }} />}
      {viewFor && <ViewModal request={viewFor} onClose={() => setViewFor(null)} />}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-blue-600" /> Lab &amp; Radiology
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {requests.filter(r => r.status === 'pending').length} pending · {requests.filter(r => r.status === 'complete').length} complete
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-accent"><Plus className="h-4 w-4" /> New Request</button>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit flex-wrap">
        {[['all','All'],['pending','Pending'],['complete','Complete'],['lab','Lab'],['radiology','Radiology']].map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${filter===k?'bg-white shadow-sm text-slate-900':'text-slate-500 hover:text-slate-700'}`}>{l}</button>
        ))}
      </div>

      <div className="card divide-y divide-slate-100">
        {loading ? <div className="py-12 text-center text-slate-400 text-sm">Loading…</div>
        : filtered.length === 0 ? <div className="py-12 text-center text-slate-400 text-sm">No requests found.</div>
        : filtered.map(r => (
          <div key={r.id} className="px-5 py-4 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-semibold text-slate-800">{r.test_type}</span>
                <span className={`badge border capitalize ${r.category==='radiology'?'bg-purple-50 text-purple-700 border-purple-200':'bg-blue-50 text-blue-700 border-blue-200'}`}>{r.category}</span>
                <span className={`badge border ${STATUS_STYLE[r.status]??''} capitalize`}>{r.status}</span>
                {r.components?.length > 0 && <span className="text-[10px] text-slate-400">{r.components.length} parameters</span>}
              </div>
              <p className="text-sm text-slate-600">Patient: <span className="font-medium">{r.patient_name}</span></p>
              <p className="text-xs text-slate-400 mt-0.5">Requested by {r.requested_by} · {new Date(r.requested_at).toLocaleString()}</p>
              {r.result_summary && (
                <p className="text-xs text-slate-500 mt-1 bg-slate-50 rounded p-2 border border-slate-100 line-clamp-2">{r.result_summary}</p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {r.status !== 'complete' && (
                <button onClick={() => setResultFor(r)} className="btn-accent text-xs py-1.5">Enter Results</button>
              )}
              {r.status === 'complete' && (
                <button onClick={() => setViewFor(r)} className="btn-outline text-xs py-1.5">View</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
