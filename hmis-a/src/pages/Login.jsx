import { useState } from 'react';
import { Activity, Eye, EyeOff, AlertCircle } from 'lucide-react';

const DEMO_USERS = [
  { role: 'Administrator',  email: 'admin@kakumiro.ug',  password: 'password', name: 'Admin Kakumiro' },
  { role: 'Doctor',         email: 'doctor@kakumiro.ug', password: 'password', name: 'Dr. Mukasa' },
  { role: 'Nurse',          email: 'nurse@kakumiro.ug',  password: 'password', name: 'Nurse Nalwoga' },
];

export const AUTH_KEY = 'hmis_a_auth';

export function getAuthUser() {
  try { return JSON.parse(sessionStorage.getItem(AUTH_KEY)); } catch { return null; }
}

export default function Login({ onLogin }) {
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 500)); // simulate network
    const user = DEMO_USERS.find(u => u.email === form.email && u.password === form.password);
    if (user) {
      sessionStorage.setItem(AUTH_KEY, JSON.stringify(user));
      onLogin(user);
    } else {
      setError('Invalid email or password. Please try again.');
    }
    setLoading(false);
  };

  const fill = (u) => setForm({ email: u.email, password: u.password });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-base leading-tight">Kakumiro HC III</p>
            <p className="text-slate-400 text-xs">Health Management System</p>
          </div>
        </div>

        {/* Heading */}
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in</h1>
          <p className="text-slate-500 text-sm mt-1">Access your HMIS dashboard</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email address</label>
            <input
              type="email" required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@kakumiro.ug"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2.5 pr-10 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors mt-2"
          >
            {loading
              ? <><span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in…</>
              : 'Sign In'}
          </button>
        </form>

        {/* Demo accounts */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Demo Accounts</p>
          <div className="space-y-2">
            {DEMO_USERS.map(u => (
              <button key={u.email} type="button" onClick={() => fill(u)}
                className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                <p className="text-xs font-semibold text-slate-700 group-hover:text-blue-700">{u.role} — {u.name}</p>
                <p className="text-xs text-slate-400">{u.email}</p>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
