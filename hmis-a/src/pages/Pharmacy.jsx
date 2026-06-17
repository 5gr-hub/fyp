import { useState, useEffect } from 'react';
import { Pill, X, AlertTriangle, Plus, PackagePlus, RefreshCw } from 'lucide-react';

const API = '/api';
const CATS = ['tablet','capsule','syrup','injection','fluid','cream','drops','inhaler','suppository','other'];

function DispenseModal({ inventory, patients, onClose, onSaved }) {
  const [form, setForm] = useState({ patient_id:'', patient_name:'', medication_id:'', quantity:1, dispensed_by:'Pharm. Ssekandi', dosage_instructions:'', notes:'' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const f = k => e => {
    const v = e.target.value;
    if (k==='patient_id') { const p=patients.find(p=>p.id===v); setForm(prev=>({...prev,patient_id:v,patient_name:p?.full_name??''})); }
    else setForm(prev=>({...prev,[k]:v}));
  };
  const selected = inventory.find(m => m.id === form.medication_id);
  const save = async e => {
    e.preventDefault(); setErr(''); setSaving(true);
    try {
      const res = await fetch(`${API}/dispensing`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,quantity:parseInt(form.quantity)})});
      if (!res.ok) throw new Error((await res.json()).message??'Failed');
      onSaved();
    } catch(e){ setErr(e.message); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Dispense Medication</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400"/></button>
        </div>
        <form onSubmit={save} className="p-6 space-y-3">
          {err && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>}
          <div><label className="lbl">Patient *</label>
            <select required value={form.patient_id} onChange={f('patient_id')} className="inp">
              <option value="">Select patient…</option>
              {patients.map(p=><option key={p.id} value={p.id}>{p.full_name} ({p.id})</option>)}
            </select>
          </div>
          <div><label className="lbl">Medication *</label>
            <select required value={form.medication_id} onChange={f('medication_id')} className="inp">
              <option value="">Select medication…</option>
              {inventory.map(m=><option key={m.id} value={m.id}>{m.name} — {m.stock} {m.unit} in stock</option>)}
            </select>
          </div>
          {selected && (
            <div className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${selected.stock<=selected.min_stock?'bg-red-50 text-red-700 border border-red-200':'bg-slate-50 text-slate-600 border border-slate-200'}`}>
              {selected.stock<=selected.min_stock&&<AlertTriangle className="h-3.5 w-3.5 flex-shrink-0"/>}
              Available: {selected.stock} {selected.unit} {selected.stock<=selected.min_stock?'— LOW STOCK':''}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="lbl">Quantity *</label>
              <input required type="number" min={1} max={selected?.stock??999} value={form.quantity} onChange={f('quantity')} className="inp"/>
            </div>
            <div><label className="lbl">Dispensed By</label>
              <input value={form.dispensed_by} onChange={f('dispensed_by')} className="inp"/>
            </div>
          </div>
          <div><label className="lbl">Dosage Instructions</label>
            <input value={form.dosage_instructions} onChange={f('dosage_instructions')} className="inp" placeholder="e.g. 1 tab BD × 5 days after food"/>
          </div>
          <div><label className="lbl">Notes</label>
            <textarea rows={2} value={form.notes} onChange={f('notes')} className="inp resize-none" placeholder="Additional notes…"/>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="btn-accent flex-1 justify-center py-2.5">{saving?'Dispensing…':'Dispense'}</button>
            <button type="button" onClick={onClose} className="btn-outline flex-1 justify-center py-2.5">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddItemModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name:'', category:'tablet', unit:'Tablets', stock:0, min_stock:10 });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));
  const save = async e => {
    e.preventDefault(); setErr(''); setSaving(true);
    try {
      const res = await fetch(`${API}/inventory`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,stock:parseInt(form.stock),min_stock:parseInt(form.min_stock)})});
      if (!res.ok) throw new Error((await res.json()).message??'Failed');
      onSaved();
    } catch(e){ setErr(e.message); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2"><PackagePlus className="h-4 w-4 text-blue-600"/>Add New Item to Inventory</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400"/></button>
        </div>
        <form onSubmit={save} className="p-6 space-y-3">
          {err && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>}
          <div><label className="lbl">Drug / Item Name *</label>
            <input required value={form.name} onChange={f('name')} className="inp" placeholder="e.g. Ciprofloxacin 500mg"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="lbl">Category</label>
              <select value={form.category} onChange={f('category')} className="inp">
                {CATS.map(c=><option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
            <div><label className="lbl">Dispensing Unit</label>
              <input value={form.unit} onChange={f('unit')} className="inp" placeholder="Tablets / Vials / Bottles…"/>
            </div>
            <div><label className="lbl">Opening Stock *</label>
              <input required type="number" min={0} value={form.stock} onChange={f('stock')} className="inp"/>
            </div>
            <div><label className="lbl">Minimum Stock Level</label>
              <input type="number" min={0} value={form.min_stock} onChange={f('min_stock')} className="inp"/>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="btn-accent flex-1 justify-center py-2.5">{saving?'Adding…':'Add Item'}</button>
            <button type="button" onClick={onClose} className="btn-outline flex-1 justify-center py-2.5">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RestockModal({ item, onClose, onSaved }) {
  const [qty, setQty] = useState(100);
  const [saving, setSaving] = useState(false);
  const save = async e => {
    e.preventDefault(); setSaving(true);
    await fetch(`${API}/inventory/${item.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({restock:parseInt(qty)})});
    onSaved(); setSaving(false);
  };
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2"><RefreshCw className="h-4 w-4 text-blue-600"/>Restock</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400"/></button>
        </div>
        <form onSubmit={save} className="p-6 space-y-4">
          <p className="text-sm text-slate-700 font-medium">{item.name}</p>
          <p className="text-xs text-slate-500">Current stock: <span className="font-semibold text-slate-700">{item.stock} {item.unit}</span></p>
          <div><label className="lbl">Quantity to Add *</label>
            <input required type="number" min={1} value={qty} onChange={e=>setQty(e.target.value)} className="inp"/>
          </div>
          <p className="text-xs text-slate-400">New stock will be: <strong>{item.stock + parseInt(qty||0)} {item.unit}</strong></p>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-accent flex-1 justify-center py-2.5">{saving?'Updating…':'Confirm Restock'}</button>
            <button type="button" onClick={onClose} className="btn-outline flex-1 justify-center py-2.5">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Pharmacy() {
  const [inventory, setInventory] = useState([]);
  const [dispensing, setDispensing] = useState([]);
  const [patients, setPatients] = useState([]);
  const [modal, setModal] = useState(null); // 'dispense'|'add'|{item}
  const [tab, setTab] = useState('stock');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/inventory`).then(r=>r.json()),
      fetch(`${API}/dispensing`).then(r=>r.json()),
      fetch(`${API}/patients`).then(r=>r.json()),
    ]).then(([inv,disp,p])=>{ setInventory(Array.isArray(inv)?inv:[]); setDispensing(Array.isArray(disp)?disp:[]); setPatients(p.data??[]); }).finally(()=>setLoading(false));
  };

  useEffect(()=>{ load(); },[]);

  const lowStock = inventory.filter(m=>m.stock<=m.min_stock);
  const filteredInv = inventory.filter(m=>m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      {modal==='dispense' && <DispenseModal inventory={inventory} patients={patients} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load();}}/>}
      {modal==='add'     && <AddItemModal onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load();}}/>}
      {modal?.id        && <RestockModal item={modal} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load();}}/>}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Pill className="h-6 w-6 text-blue-600"/>Pharmacy &amp; Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">{inventory.length} items · {lowStock.length} low stock</p>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setModal('add')} className="btn-outline"><PackagePlus className="h-4 w-4"/>Add Item</button>
          <button onClick={()=>setModal('dispense')} className="btn-accent"><Pill className="h-4 w-4"/>Dispense</button>
        </div>
      </div>

      {lowStock.length>0 && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"/>
          <div>
            <p className="text-sm font-semibold text-red-800">Low Stock Alert — {lowStock.length} item(s)</p>
            <p className="text-xs text-red-600 mt-0.5">{lowStock.map(m=>m.name).join(', ')}</p>
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {[['stock','Drug Stock'],['history','Dispensing History']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${tab===k?'bg-white shadow-sm text-slate-900':'text-slate-500 hover:text-slate-700'}`}>{l}</button>
        ))}
      </div>

      {tab==='stock' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search drug name…" className="inp max-w-xs"/>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Medication</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Unit</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Stock</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Min</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInv.map(m=>(
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{m.name}</td>
                  <td className="px-4 py-3 text-slate-500 capitalize">{m.category}</td>
                  <td className="px-4 py-3 text-slate-500">{m.unit}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${m.stock<=m.min_stock?'text-red-600':'text-slate-800'}`}>{m.stock}</td>
                  <td className="px-4 py-3 text-right text-slate-400">{m.min_stock}</td>
                  <td className="px-4 py-3">
                    <span className={`badge border ${m.stock<=m.min_stock?'bg-red-50 text-red-700 border-red-200':'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                      {m.stock<=m.min_stock?'Low':'OK'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={()=>setModal(m)} className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      <RefreshCw className="h-3 w-3"/>Restock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab==='history' && (
        <div className="card divide-y divide-slate-100">
          {loading ? <div className="py-12 text-center text-slate-400 text-sm">Loading…</div>
          : dispensing.length===0 ? <div className="py-12 text-center text-slate-400 text-sm">No dispensing records yet.</div>
          : [...dispensing].reverse().map(d=>(
            <div key={d.id} className="px-5 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{d.medication_name} <span className="font-normal text-slate-500">× {d.quantity} {d.unit}</span></p>
                <p className="text-xs text-slate-500">Patient: {d.patient_name} · By: {d.dispensed_by}</p>
                {d.dosage_instructions && <p className="text-xs text-slate-400 mt-0.5 italic">{d.dosage_instructions}</p>}
              </div>
              <p className="text-xs text-slate-400 flex-shrink-0">{new Date(d.dispensed_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
