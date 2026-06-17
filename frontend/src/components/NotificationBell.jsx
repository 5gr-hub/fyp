import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, X } from 'lucide-react';
import api from '../api/client';

const ACTION_COLORS = {
  created:      'bg-cyan-50 text-cyan-700 border-cyan-200',
  acknowledged: 'bg-sky-50 text-sky-700 border-sky-200',
  in_transit:   'bg-violet-50 text-violet-700 border-violet-200',
  received:     'bg-teal-50 text-teal-700 border-teal-200',
  completed:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled:    'bg-red-50 text-red-700 border-red-200',
  feedback:     'bg-orange-50 text-orange-700 border-orange-200',
};

function relativeTime(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60)  return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const [data, setData]   = useState({ count: 0, items: [] });
  const [open, setOpen]   = useState(false);
  const ref               = useRef(null);
  const navigate          = useNavigate();

  const fetchUnread = () =>
    api.get('/notifications/unread').then(r => setData(r.data)).catch(() => {});

  useEffect(() => {
    fetchUnread();
    const id = setInterval(fetchUnread, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAll = async () => {
    await api.put('/notifications/read-all');
    setData({ count: 0, items: [] });
  };

  const markOne = async (id) => {
    await api.put(`/notifications/${id}/read`);
    setData(d => ({ count: Math.max(0, d.count - 1), items: d.items.filter(n => n.id !== id) }));
  };

  const openReferral = async (n) => {
    await markOne(n.id);
    setOpen(false);
    if (n.data?.referral_id) navigate(`/referrals/${n.data.referral_id}`);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchUnread(); }}
        className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {data.count > 0 && (
          <span className="absolute top-0.5 right-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold ring-2 ring-white">
            {data.count > 9 ? '9+' : data.count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-modal border border-slate-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-slate-500" />
              <span className="font-semibold text-slate-800 text-sm">Notifications</span>
              {data.count > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{data.count}</span>
              )}
            </div>
            {data.count > 0 && (
              <button onClick={markAll} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium">
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
            {data.items.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No new notifications</p>
              </div>
            ) : (
              data.items.map(n => (
                <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 group transition-colors">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openReferral(n)}>
                    {n.data?.action && (
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wide mb-1.5 ${ACTION_COLORS[n.data.action] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {n.data.action.replace('_', ' ')}
                      </span>
                    )}
                    <p className="text-sm text-slate-800 leading-snug">{n.data?.message ?? 'New notification'}</p>
                    {n.data?.referral_number && (
                      <p className="text-xs text-primary-600 mt-0.5 font-semibold">{n.data.referral_number}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">{relativeTime(n.created_at)}</p>
                  </div>
                  <button onClick={() => markOne(n.id)} title="Dismiss"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all flex-shrink-0 mt-0.5">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
