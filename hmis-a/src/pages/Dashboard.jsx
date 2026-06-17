import { useState, useEffect } from 'react';
import { Users, ClipboardList, FlaskConical, Pill, AlertTriangle, Activity, TrendingUp, Clock } from 'lucide-react';

const API = '/api';

function StatCard({ icon: Icon, label, value, sub, color = 'blue', alert = false }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   icon: 'bg-blue-600',   text: 'text-blue-700' },
    green:  { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-600', text: 'text-emerald-700' },
    amber:  { bg: 'bg-amber-50',  border: 'border-amber-200',  icon: 'bg-amber-500',  text: 'text-amber-700' },
    red:    { bg: 'bg-red-50',    border: 'border-red-200',    icon: 'bg-red-600',    text: 'text-red-700' },
    purple: { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'bg-violet-600', text: 'text-violet-700' },
  };
  const c = colors[color] ?? colors.blue;
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5 flex items-start gap-4 ${alert ? 'ring-2 ring-red-300' : ''}`}>
      <div className={`h-11 w-11 rounded-xl ${c.icon} flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <p className={`text-3xl font-bold ${c.text} leading-tight mt-0.5`}>{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function QueueItem({ entry }) {
  const priorityColor = {
    emergency: 'bg-red-100 text-red-700 border-red-200',
    urgent:    'bg-amber-100 text-amber-700 border-amber-200',
    normal:    'bg-blue-100 text-blue-700 border-blue-200',
  }[entry.priority] ?? 'bg-slate-100 text-slate-600 border-slate-200';

  const statusColor = {
    waiting:         'text-amber-600',
    triaged:         'text-blue-600',
    in_consultation: 'text-violet-600',
    discharged:      'text-emerald-600',
  }[entry.status] ?? 'text-slate-500';

  const arrived = entry.arrived_at
    ? new Date(entry.arrived_at).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${entry.priority === 'emergency' ? 'bg-red-500 animate-pulse' : entry.priority === 'urgent' ? 'bg-amber-400' : 'bg-blue-400'}`} />
      <p className="font-medium text-slate-800 text-sm flex-1 truncate">{entry.patient_name}</p>
      <span className={`text-xs border rounded-full px-2 py-0.5 font-semibold ${priorityColor}`}>{entry.priority}</span>
      <span className={`text-xs font-medium capitalize ${statusColor}`}>{entry.status?.replace('_', ' ')}</span>
      <span className="text-xs text-slate-400 flex-shrink-0 flex items-center gap-1"><Clock className="h-3 w-3" />{arrived}</span>
    </div>
  );
}

function LowStockItem({ item }) {
  const pct = item.min_stock > 0 ? Math.round((item.stock / item.min_stock) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
        <div className="h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
          <div
            className={`h-full rounded-full ${item.stock === 0 ? 'bg-red-500' : 'bg-amber-400'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-bold ${item.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>{item.stock}</p>
        <p className="text-[10px] text-slate-400">{item.unit}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState({ patients: [], queue: [], lab: [], inventory: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/patients`).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`${API}/queue`).then(r => r.json()).catch(() => []),
      fetch(`${API}/lab`).then(r => r.json()).catch(() => []),
      fetch(`${API}/inventory`).then(r => r.json()).catch(() => []),
    ]).then(([pRes, qRes, lRes, iRes]) => {
      setData({
        patients:  pRes.data ?? [],
        queue:     Array.isArray(qRes) ? qRes : [],
        lab:       Array.isArray(lRes) ? lRes : [],
        inventory: Array.isArray(iRes) ? iRes : [],
      });
    }).finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const totalPatients = data.patients.length;
  const todayRegistered = data.patients.filter(p => p.registered === today).length;

  const activeQueue = data.queue.filter(q => q.status !== 'discharged');
  const emergencies = activeQueue.filter(q => q.priority === 'emergency').length;
  const waiting     = activeQueue.filter(q => q.status === 'waiting').length;

  const pendingLabs  = data.lab.filter(l => l.status === 'pending').length;
  const completeLabs = data.lab.filter(l => l.status === 'complete').length;

  const lowStock = data.inventory
    .filter(m => m.stock <= m.min_stock)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6);

  const recentQueue = [...data.queue]
    .filter(q => q.status !== 'discharged')
    .sort((a, b) => {
      const order = { emergency: 0, urgent: 1, normal: 2 };
      return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
    })
    .slice(0, 8);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        <Activity className="h-5 w-5 animate-spin mr-2" /> Loading dashboard…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="h-6 w-6 text-blue-600" /> Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Kakumiro HC III — {new Date().toLocaleDateString('en-UG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users} label="Total Patients" value={totalPatients}
          sub={todayRegistered > 0 ? `+${todayRegistered} today` : 'No new today'}
          color="blue"
        />
        <StatCard
          icon={ClipboardList} label="Active Queue" value={activeQueue.length}
          sub={`${waiting} waiting · ${emergencies} emergency`}
          color={emergencies > 0 ? 'red' : 'green'}
          alert={emergencies > 0}
        />
        <StatCard
          icon={FlaskConical} label="Pending Labs" value={pendingLabs}
          sub={`${completeLabs} completed today`}
          color={pendingLabs > 5 ? 'amber' : 'purple'}
        />
        <StatCard
          icon={Pill} label="Low Stock Items" value={lowStock.length}
          sub={lowStock.length > 0 ? 'Requires restock' : 'All stock OK'}
          color={lowStock.length > 0 ? 'amber' : 'green'}
          alert={lowStock.some(m => m.stock === 0)}
        />
      </div>

      {/* Queue + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Active Queue */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-blue-600" />
              <h2 className="font-semibold text-slate-800 text-sm">Active Consultation Queue</h2>
            </div>
            <span className="text-xs text-slate-400">{activeQueue.length} active</span>
          </div>
          <div className="px-5 py-1 max-h-72 overflow-y-auto">
            {recentQueue.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">Queue is empty</p>
            ) : (
              recentQueue.map(q => <QueueItem key={q.id} entry={q} />)
            )}
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="h-4 w-4 text-amber-500" />
              <h2 className="font-semibold text-slate-800 text-sm">Low / Out of Stock</h2>
            </div>
            <span className="text-xs text-slate-400">{lowStock.length} items</span>
          </div>
          <div className="px-5 py-1 max-h-72 overflow-y-auto">
            {lowStock.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">All inventory levels are OK</p>
            ) : (
              lowStock.map(m => <LowStockItem key={m.id} item={m} />)
            )}
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">In Consultation</p>
          <p className="text-2xl font-bold text-violet-600">{activeQueue.filter(q => q.status === 'in_consultation').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Triaged</p>
          <p className="text-2xl font-bold text-blue-600">{activeQueue.filter(q => q.status === 'triaged').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Discharged Today</p>
          <p className="text-2xl font-bold text-emerald-600">
            {data.queue.filter(q => q.status === 'discharged' && q.seen_at?.startsWith(today)).length}
          </p>
        </div>
      </div>
    </div>
  );
}
