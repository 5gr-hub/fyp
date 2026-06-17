import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Send, Users, Building2, Calendar,
  BarChart3, LogOut, Menu, X, UserCircle, ChevronRight, Network,
} from 'lucide-react';
import NotificationBell from './NotificationBell';

const navItems = [
  { to: '/dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/referrals',      label: 'Referrals',      icon: Send },
  { to: '/patients',       label: 'Patients',       icon: UserCircle },
  { to: '/appointments',   label: 'Appointments',   icon: Calendar },
  { to: '/reports',        label: 'Reports',        icon: BarChart3 },
  { to: '/integrations',   label: 'Integrations',   icon: Network },
];

const adminItems = [
  { to: '/admin/users',      label: 'Users',       icon: Users },
  { to: '/admin/facilities', label: 'Facilities',  icon: Building2 },
];

function NavItem({ to, label, icon: Icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`h-4 w-4 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
          {label}
        </>
      )}
    </NavLink>
  );
}

function Sidebar({ user, onClose, onLogout }) {
  const initials = user?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() ?? '?';

  return (
    <div className="flex flex-col h-full bg-navy-900">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="h-9 w-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-sm flex-shrink-0 text-white font-bold text-sm select-none">
          DR
        </div>
        <div>
          <p className="text-white font-bold text-sm tracking-wide leading-tight">DRCP Uganda</p>
          <p className="text-slate-400 text-[11px] mt-0.5 leading-tight">Digital Referral Platform</p>
        </div>
        <button onClick={onClose} className="ml-auto lg:hidden text-slate-400 hover:text-white p-1">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-2">Main Menu</p>
        {navItems.map(item => (
          <NavItem key={item.to} {...item} onClick={onClose} />
        ))}

        {user?.role === 'admin' && (
          <>
            <div className="pt-5 pb-2 px-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Administration</p>
            </div>
            {adminItems.map(item => (
              <NavItem key={item.to} {...item} onClick={onClose} />
            ))}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="px-3 pb-4 pt-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg bg-white/5">
          <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-slate-400 text-[11px] truncate capitalize">{user?.facility?.name ?? 'System Admin'}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

function Breadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  const label = (s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
  return (
    <nav className="hidden sm:flex items-center gap-1.5 text-sm text-slate-400">
      {segments.map((seg, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
          <span className={i === segments.length - 1 ? 'text-slate-700 font-semibold' : ''}>{label(seg)}</span>
        </span>
      ))}
    </nav>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col flex-shrink-0 shadow-xl">
        <Sidebar user={user} onClose={() => {}} onLogout={handleLogout} />
      </aside>

      {/* Sidebar mobile */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar user={user} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 h-14 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
              <Menu className="h-5 w-5" />
            </button>
            <Breadcrumb />
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() ?? '?'}
              </div>
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.name}</p>
                <p className="text-xs text-slate-400 leading-tight">{user?.facility?.name ?? 'System Admin'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
