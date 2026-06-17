import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, 'data.json');

const app = express();
app.use(cors());
app.use(express.json());


const loadData = () => JSON.parse(readFileSync(DATA_FILE, 'utf8'));
const saveData = (d) => writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', system: 'Kakumiro HC III HMIS', version: '2.0' });
});

// ── DRCP Proxy (server-side, avoids browser CORS completely) ──────────────────
const DRCP_BACKEND = process.env.DRCP_API_URL || 'https://drcp-backend-4538.onrender.com/api';

// Health check for the proxy itself
app.get('/drcp-proxy', (req, res) => res.json({ proxy: 'ok', backend: DRCP_BACKEND }));

// app.use('/drcp-proxy') — req.url is relative to the mount point (e.g. /auth/login)
app.use('/drcp-proxy', async (req, res) => {
  const url = `${DRCP_BACKEND}${req.url}`;

  const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
  if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;

  try {
    const opts = { method: req.method, headers };
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      opts.body = JSON.stringify(req.body);
    }
    const upstream = await fetch(url, opts);
    const ct       = upstream.headers.get('content-type') ?? '';
    const body     = ct.includes('application/json') ? await upstream.json() : await upstream.text();
    res.status(upstream.status).json(body);
  } catch (err) {
    res.status(502).json({ message: 'DRCP proxy error', error: err.message, target: url });
  }
});

// ── Patients ──────────────────────────────────────────────────────────────────
// GET /patients?identifier=X&identifier_type=name|nin|patient_id
// Returns enriched data (last encounter, last vitals, recent labs) for DRCP lookup
app.get('/api/patients', (req, res) => {
  const { identifier, identifier_type } = req.query;
  const db = loadData();

  let list = identifier
    ? (() => {
        const q = identifier.toLowerCase();
        if (identifier_type === 'nin') return db.patients.filter(p => p.identifier?.toLowerCase().includes(q));
        if (identifier_type === 'patient_id') return db.patients.filter(p => p.id?.toLowerCase() === q);
        return db.patients.filter(p => p.full_name?.toLowerCase().includes(q));
      })()
    : db.patients;

  const enriched = list.map(p => {
    const encounters = (db.encounters || []).filter(e => e.patient_id === p.id);
    const lastEnc = encounters[encounters.length - 1] ?? null;
    const triages = (db.triage || []).filter(t => t.patient_id === p.id);
    const lastTriage = triages[triages.length - 1] ?? null;
    const labs = (db.lab_requests || []).filter(l => l.patient_id === p.id && l.status === 'complete');
    const recentLabs = labs.slice(-3).map(l => ({
      test_type: l.test_type, result_summary: l.result_summary ?? '', date: l.requested_at
    }));
    return {
      ...p,
      dob: p.date_of_birth,
      last_encounter: lastEnc ? {
        diagnosis: lastEnc.assessment?.diagnosis ?? '',
        chief_complaint: lastEnc.subjective?.chief_complaint ?? '',
        treatment: lastEnc.plan?.treatment ?? '',
        allergies: lastEnc.subjective?.allergies ?? p.allergies ?? '',
        current_medications: lastEnc.subjective?.current_medications ?? '',
        investigations: lastEnc.plan?.investigations ?? '',
        examination_findings: lastEnc.objective?.examination_findings ?? '',
        clinical_history: lastEnc.subjective?.history ?? '',
        date: lastEnc.created_at,
      } : null,
      last_vitals: lastTriage ? lastTriage.vitals : null,
      recent_labs: recentLabs,
    };
  });

  res.json({ data: enriched });
});

app.post('/api/patients', (req, res) => {
  const db = loadData();
  const nextNum = db.patients.length + 1;
  const patient = {
    id: `KAK-${String(nextNum).padStart(3, '0')}`,
    full_name: req.body.full_name ?? '',
    sex: req.body.sex ?? 'unknown',
    date_of_birth: req.body.date_of_birth ?? '',
    identifier: req.body.identifier ?? `CM${Date.now()}KAK`,
    phone: req.body.phone ?? '',
    district: req.body.district ?? '',
    village: req.body.village ?? '',
    blood_group: req.body.blood_group ?? '',
    allergies: req.body.allergies ?? 'NKDA',
    chronic_conditions: req.body.chronic_conditions ?? 'None',
    next_of_kin_name: req.body.next_of_kin_name ?? '',
    next_of_kin_phone: req.body.next_of_kin_phone ?? '',
    next_of_kin_relation: req.body.next_of_kin_relation ?? '',
    registered: new Date().toISOString().split('T')[0],
    active: true,
  };
  db.patients.push(patient);
  saveData(db);
  res.status(201).json(patient);
});

app.put('/api/patients/:id', (req, res) => {
  const db = loadData();
  const idx = db.patients.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  db.patients[idx] = { ...db.patients[idx], ...req.body, id: db.patients[idx].id };
  saveData(db);
  res.json(db.patients[idx]);
});

// ── Queue ─────────────────────────────────────────────────────────────────────
app.get('/api/queue', (req, res) => res.json(loadData().queue));

app.post('/api/queue', (req, res) => {
  const db = loadData();
  const entry = {
    id: uid('Q'),
    patient_id: req.body.patient_id,
    patient_name: req.body.patient_name,
    complaint: req.body.complaint ?? '',
    priority: req.body.priority ?? 'normal',
    status: 'waiting',     // waiting | triaged | in_consultation | orders | discharged
    arrived_at: new Date().toISOString(),
    triage_id: null,
    encounter_id: null,
    seen_at: null,
    clinician: null,
  };
  db.queue.push(entry);
  saveData(db);
  res.status(201).json(entry);
});

app.put('/api/queue/:id', (req, res) => {
  const db = loadData();
  const idx = db.queue.findIndex(q => q.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  db.queue[idx] = { ...db.queue[idx], ...req.body };
  saveData(db);
  res.json(db.queue[idx]);
});

// ── Triage ────────────────────────────────────────────────────────────────────
app.get('/api/triage', (req, res) => res.json(loadData().triage ?? []));

app.post('/api/triage', (req, res) => {
  const db = loadData();
  if (!db.triage) db.triage = [];
  const entry = {
    id: uid('TRG'),
    queue_id: req.body.queue_id,
    patient_id: req.body.patient_id,
    patient_name: req.body.patient_name,
    vitals: req.body.vitals ?? {},
    triage_category: req.body.triage_category ?? 'non-urgent',
    triaged_by: req.body.triaged_by ?? 'Nurse',
    triaged_at: new Date().toISOString(),
    notes: req.body.notes ?? '',
  };
  db.triage.push(entry);
  // Update queue status
  const qi = db.queue.findIndex(q => q.id === req.body.queue_id);
  if (qi !== -1) { db.queue[qi].status = 'triaged'; db.queue[qi].triage_id = entry.id; db.queue[qi].priority = req.body.triage_category === 'emergency' ? 'emergency' : req.body.triage_category === 'urgent' ? 'urgent' : 'normal'; }
  saveData(db);
  res.status(201).json(entry);
});

// ── Encounters (Clinical Notes) ───────────────────────────────────────────────
app.get('/api/encounters', (req, res) => res.json(loadData().encounters ?? []));

app.get('/api/encounters/:patientId', (req, res) => {
  const db = loadData();
  res.json((db.encounters ?? []).filter(e => e.patient_id === req.params.patientId));
});

app.post('/api/encounters', (req, res) => {
  const db = loadData();
  if (!db.encounters) db.encounters = [];
  const entry = {
    id: uid('ENC'),
    patient_id: req.body.patient_id,
    patient_name: req.body.patient_name,
    queue_id: req.body.queue_id ?? null,
    triage_id: req.body.triage_id ?? null,
    subjective: req.body.subjective ?? {},
    objective: req.body.objective ?? {},
    assessment: req.body.assessment ?? {},
    plan: req.body.plan ?? {},
    clinician: req.body.clinician ?? 'Dr. Mukasa',
    created_at: new Date().toISOString(),
  };
  db.encounters.push(entry);
  // Update queue status
  const qi = db.queue.findIndex(q => q.id === req.body.queue_id);
  if (qi !== -1) { db.queue[qi].status = 'in_consultation'; db.queue[qi].encounter_id = entry.id; }
  saveData(db);
  res.status(201).json(entry);
});

app.put('/api/encounters/:id', (req, res) => {
  const db = loadData();
  if (!db.encounters) db.encounters = [];
  const idx = db.encounters.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  db.encounters[idx] = { ...db.encounters[idx], ...req.body, id: db.encounters[idx].id };
  // Update queue to discharged if plan.status === 'complete'
  if (req.body.status === 'complete') {
    const qi = db.queue.findIndex(q => q.encounter_id === req.params.id);
    if (qi !== -1) { db.queue[qi].status = 'discharged'; db.queue[qi].seen_at = new Date().toISOString(); }
  }
  saveData(db);
  res.json(db.encounters[idx]);
});

// ── Lab Requests ──────────────────────────────────────────────────────────────
app.get('/api/lab', (req, res) => res.json(loadData().lab_requests ?? []));

app.post('/api/lab', (req, res) => {
  const db = loadData();
  const entry = {
    id: uid('LAB'),
    patient_id: req.body.patient_id,
    patient_name: req.body.patient_name,
    test_type: req.body.test_type,
    category: req.body.category ?? 'lab',
    components: req.body.components ?? [],
    requested_by: req.body.requested_by ?? 'Clinician',
    status: 'pending',
    requested_at: new Date().toISOString(),
    result_summary: '',
    notes: req.body.notes ?? '',
  };
  db.lab_requests.push(entry);
  saveData(db);
  res.status(201).json(entry);
});

app.put('/api/lab/:id', (req, res) => {
  const db = loadData();
  const idx = db.lab_requests.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  db.lab_requests[idx] = { ...db.lab_requests[idx], ...req.body };
  saveData(db);
  res.json(db.lab_requests[idx]);
});

// ── Inventory ─────────────────────────────────────────────────────────────────
app.get('/api/inventory', (req, res) => res.json(loadData().inventory ?? []));

app.post('/api/inventory', (req, res) => {
  const db = loadData();
  const existing = db.inventory.find(m => m.name.toLowerCase() === (req.body.name ?? '').toLowerCase());
  if (existing) return res.status(409).json({ message: 'Item already exists. Use PUT /inventory/:id to restock.' });
  const item = {
    id: `MED-${String(db.inventory.length + 1).padStart(3, '0')}-${Date.now().toString().slice(-4)}`,
    name: req.body.name,
    category: req.body.category ?? 'tablet',
    unit: req.body.unit ?? 'Tablets',
    stock: parseInt(req.body.stock ?? 0),
    min_stock: parseInt(req.body.min_stock ?? 10),
  };
  db.inventory.push(item);
  saveData(db);
  res.status(201).json(item);
});

app.put('/api/inventory/:id', (req, res) => {
  const db = loadData();
  const idx = db.inventory.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  if (req.body.restock) {
    db.inventory[idx].stock += parseInt(req.body.restock);
  } else {
    db.inventory[idx] = { ...db.inventory[idx], ...req.body, id: db.inventory[idx].id };
  }
  saveData(db);
  res.json(db.inventory[idx]);
});

// ── Dispensing ────────────────────────────────────────────────────────────────
app.get('/api/dispensing', (req, res) => res.json(loadData().dispensing ?? []));

app.post('/api/dispensing', (req, res) => {
  const db = loadData();
  const med = db.inventory.find(m => m.id === req.body.medication_id);
  if (!med) return res.status(404).json({ message: 'Medication not found' });
  const qty = parseInt(req.body.quantity ?? 1);
  if (med.stock < qty) return res.status(400).json({ message: `Insufficient stock. Available: ${med.stock}` });
  med.stock -= qty;
  const record = {
    id: uid('DISP'),
    patient_id: req.body.patient_id,
    patient_name: req.body.patient_name,
    medication_id: req.body.medication_id,
    medication_name: med.name,
    quantity: qty,
    unit: med.unit,
    dispensed_by: req.body.dispensed_by ?? 'Pharmacist',
    dispensed_at: new Date().toISOString(),
    dosage_instructions: req.body.dosage_instructions ?? '',
    notes: req.body.notes ?? '',
  };
  db.dispensing.push(record);
  saveData(db);
  res.status(201).json(record);
});

const PORT = process.env.PORT || 4001;

// Serve built Vite frontend in production
import { existsSync } from 'fs';
const distPath = join(__dirname, 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(join(distPath, 'index.html')));
}

app.listen(PORT, () => console.log(`Kakumiro HC III HMIS API v2 on http://localhost:${PORT}`));
