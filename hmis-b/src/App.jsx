import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Users, ClipboardList, FlaskConical, Pill, Activity, Menu, X, Building2, LogIn, LogOut, CheckCircle2, LayoutDashboard } from 'lucide-react';
import Login, { getAuthUser, AUTH_KEY } from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PatientRegistry from './pages/PatientRegistry.jsx';
import ConsultationQueue from './pages/ConsultationQueue.jsx';
import LabRadiology from './pages/LabRadiology.jsx';
import Pharmacy from './pages/Pharmacy.jsx';
import ReferralModal, { getToken, getUser, SESSION_KEY, USER_KEY } from './components/ReferralModal.jsx';
import TrackReferrals from './pages/TrackReferrals.jsx';
import { ActivitySquare } from 'lucide-react';

const NAV = [
  { to: '/dashboard', label: 'Dashboard',            icon: LayoutDashboard },
  { to: '/patients',  label: 'Patient Registry',     icon: Users },
  { to: '/queue',     label: 'Consultation Queue',   icon: ClipboardList },
  { to: '/lab',       label: 'Lab & Radiology',      icon: FlaskConical },
  { to: '/pharmacy',  label: 'Pharmacy / Inventory', icon: Pill },
  { to: '/track-referrals', label: 'Track Referrals',   icon: ActivitySquare },
];

function Sidebar({ mobile, onClose, drcpUser, onDrcpLogin, onDrcpLogout }) {
  return (
    <div className={`flex flex-col h-full bg-slate-900 text-white ${mobile ? 'w-72' : 'w-64'}`}>
      <div className="px-5 py-5 border-b border-slate-700/60 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Activity className="h-5 w-5 text-green-400" />
            <span className="font-bold text-sm text-white tracking-tight">St. Francis Nsambya</span>
          </div>
          <p className="text-xs text-slate-400">Referral Hospital — HMIS</p>
        </div>
        {mobile && (
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X className="h-5 w-5" /></button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} onClick={mobile ? onClose : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-green-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }>
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-700/60 space-y-2">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">DRCP Integration</p>
        {drcpUser ? (
          <div className="rounded-lg bg-emerald-900/40 border border-emerald-700/50 px-3 py-2">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0"/>
              <span className="text-xs font-semibold text-emerald-300">Authenticated</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">{drcpUser.name ?? drcpUser.email}</p>
            <button onClick={onDrcpLogout} className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-red-400 transition-colors">
              <LogOut className="h-3 w-3"/>Sign out
            </button>
          </div>
        ) : (
          <button onClick={onDrcpLogin}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors">
            <Building2 className="h-3.5 w-3.5 text-green-400"/>
            <span>Connect to DRCP</span>
            <LogIn className="h-3 w-3 ml-auto text-slate-500"/>
          </button>
        )}
        <p className="text-[10px] text-slate-600">API: <span className="text-slate-500 font-mono">localhost:4002</span></p>
      </div>
    </div>
  );
}

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drcpUser, setDrcpUser]     = useState(getUser);
  const [showDrcpLogin, setShowDrcpLogin] = useState(false);
  const [authUser, setAuthUser]     = useState(getAuthUser);

  useEffect(() => {
    const sync = () => setDrcpUser(getUser());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const handleDrcpLogin  = () => setShowDrcpLogin(true);
  const handleDrcpLogout = () => { sessionStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(USER_KEY); setDrcpUser(null); };
  const handleDrcpAuthSuccess = () => { setDrcpUser(getUser()); setShowDrcpLogin(false); };

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(USER_KEY);
    setAuthUser(null);
    setDrcpUser(null);
  };

  // Show login if not authenticated
  if (!authUser) {
    return <Login onLogin={setAuthUser} />;
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden">
        {showDrcpLogin && (
          <ReferralModal
            patient={{ full_name:'', id:'', sex:'', date_of_birth:'', district:'', village:'', identifier:'', phone:'', allergies:'' }}
            onClose={handleDrcpAuthSuccess}
          />
        )}

        <div className="hidden md:flex flex-shrink-0">
          <Sidebar drcpUser={drcpUser} onDrcpLogin={handleDrcpLogin} onDrcpLogout={handleDrcpLogout}/>
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <div className="relative z-50">
              <Sidebar mobile onClose={() => setMobileOpen(false)} drcpUser={drcpUser} onDrcpLogin={handleDrcpLogin} onDrcpLogout={handleDrcpLogout}/>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                St. Francis Nsambya Hospital — HMIS Live
              </span>
            </div>
            {drcpUser && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-semibold">
                <CheckCircle2 className="h-3 w-3"/>DRCP: {drcpUser.name ?? drcpUser.email}
              </span>
            )}
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-slate-400 hidden sm:block">
                {new Date().toLocaleDateString('en-UG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-5">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/patients" element={<PatientRegistry />} />
              <Route path="/queue" element={<ConsultationQueue />} />
              <Route path="/lab" element={<LabRadiology />} />
              <Route path="/pharmacy" element={<Pharmacy />} />
              <Route path="/track-referrals" element={<TrackReferrals />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
