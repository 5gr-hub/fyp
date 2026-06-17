import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HeartPulse, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center shadow">
            <HeartPulse className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">DRCP</span>
        </div>

        {/* Heading */}
        <div className="mb-7 text-center">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in</h2>
          <p className="text-slate-500 text-sm mt-1">Access your facility dashboard</p>
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
            <label className="label">Email address</label>
            <input
              type="email" required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="input"
              placeholder="you@facility.ug"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="input pr-10"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
            {loading
              ? <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Signing in…</>
              : 'Sign In'}
          </button>
        </form>

        {/* Demo accounts */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Demo Accounts</p>
          <div className="space-y-2">
            {[
              { role: 'System Admin',      email: 'admin@drcp.ug' },
              { role: 'Doctor — Kakumiro', email: 'doctor@kakumiro.ug' },
              { role: 'Doctor — Nsambya',  email: 'doctor@nsambya.ug' },
            ].map(a => (
              <button key={a.email} type="button"
                onClick={() => setForm({ email: a.email, password: 'password' })}
                className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group">
                <p className="text-xs font-semibold text-slate-700 group-hover:text-primary-700">{a.role}</p>
                <p className="text-xs text-slate-400">{a.email}</p>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
