import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  ClipboardList,
  Languages,
  Leaf,
  LogOut,
  Ticket,
  RefreshCw
} from 'lucide-react';
import { Sweet } from '@/utils/sweet';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const STR = {
  en: {
    title: 'Worker Dashboard',
    hello: 'Hello',
    today: 'Today',
    plucked: 'Leaves plucked (kg)',
    tasksToday: 'Tasks today',
    noTasks: 'No tasks assigned yet.',
    notices: 'Notices',
    noNotices: 'No notices to show.',
    tickets: 'Support Tickets',
    noTickets: 'No support tickets submitted yet.',
    lang: 'Language',
    refresh: 'Refresh',
    logout: 'Logout',
    newTicket: 'Create ticket',
  },
};

export default function WorkerDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [lang] = useState('en');
  const T = STR[lang];

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    worker: { id: '', name: '' },
    pluckedKg: 0,
    tasks: [],
    notices: [],
    notifications: [],
    tickets: [],
  });

  const refresh = async () => {
    try {
      setLoading(true);
      const [summaryRes, notifRes] = await Promise.all([
        axios.get(`${API}/api/worker/summary?date=${date}`, { headers: authHeader }),
        axios.get(`${API}/api/notifications`, { headers: authHeader }),
      ]);
      const ticketsRes = await axios.get(`${API}/api/tickets/my`, { headers: authHeader }).catch(() => ({ data: { tickets: [] } }));
      setData({
        worker: summaryRes.data.worker || {},
        pluckedKg: Number(summaryRes.data.pluckedKg || 0),
        tasks: Array.isArray(summaryRes.data.tasks) ? summaryRes.data.tasks : [],
        notices: Array.isArray(summaryRes.data.notices) ? summaryRes.data.notices : [],
        notifications: Array.isArray(notifRes.data.items) ? notifRes.data.items : [],
        tickets: Array.isArray(ticketsRes.data?.tickets) ? ticketsRes.data.tickets : [],
      });
    } catch (e) {
      console.error('[worker summary]', e?.response?.status, e?.response?.data);
      Sweet.error(e?.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const logout = async () => {
    const ok = await Sweet.confirm('Log out?');
    if (!ok) return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    await Sweet.success('Signed out');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-5xl p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Leaf className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-extrabold">{T.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="btn btn-ghost join-item"><Languages className="w-4 h-4 mr-2" /> {T.lang}</span>
            <button className="btn" onClick={refresh} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {T.refresh}
            </button>
            <button className="btn btn-ghost text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" /> {T.logout}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xl">
            {T.hello}, <span className="font-semibold">{data.worker?.name || user?.name || ''}</span>
            <span className="opacity-70"> ({data.worker?.id || user?.empId || ''})</span>
          </div>
          <input type="date" className="input input-bordered text-lg" value={date} onChange={(e) => setDate(e.target.value)} aria-label={T.today} />
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="rounded-2xl bg-base-100 p-5 border shadow">
            <div className="flex items-center gap-2 text-lg font-semibold"><Leaf className="w-5 h-5 text-primary" /> {T.plucked}</div>
            <div className="text-4xl font-extrabold mt-2">{data.pluckedKg}</div>
          </div>

          <div className="rounded-2xl bg-base-100 p-5 border shadow md:col-span-2">
            <div className="flex items-center gap-2 text-lg font-semibold"><ClipboardList className="w-5 h-5 text-primary" /> {T.tasksToday}</div>
            {data.tasks.length === 0 ? (
              <div className="mt-3 opacity-70">{T.noTasks}</div>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.tasks.map((t) => (
                  <li key={t._id} className="p-3 rounded-xl border flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg">{t.taskType === 'other' ? (t.customTask || 'Other') : t.taskType}</div>
                      <div className="text-sm opacity-70">
                        {t.field ? `Field: ${t.field} • ` : ''} Due: {t.dueTime || '—'} • Priority: {t.priority || 'normal'}
                      </div>
                    </div>
                    <div className="badge badge-success gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {t.status || 'assigned'}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-base-100 p-5 border shadow">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Bell className="w-5 h-5 text-primary" /> Notifications
            </div>
            {data.notifications.length === 0 ? (
              <div className="mt-3 opacity-70">{T.noNotices}</div>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.notifications.map((n) => (
                  <li key={n._id} className="p-3 rounded-xl border">
                    <div className="font-semibold">{n.title || 'Notification'}</div>
                    <div className="text-sm opacity-70">{new Date(n.createdAt).toLocaleString()}</div>
                    <div className="mt-1 whitespace-pre-wrap leading-relaxed">{n.content}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl bg-base-100 p-5 border shadow">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Ticket className="w-5 h-5 text-primary" /> {T.tickets}
              <Link to="/worker/tickets" className="btn btn-xs btn-primary ml-auto">{T.newTicket}</Link>
            </div>
            {data.tickets.length === 0 ? (
              <div className="mt-3 opacity-70">{T.noTickets}</div>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.tickets.slice(0, 3).map((ticket) => (
                  <li key={ticket._id} className="p-3 rounded-xl border">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{ticket.subject || 'Untitled ticket'}</div>
                      <span className="badge badge-outline capitalize">{ticket.status}</span>
                    </div>
                    <div className="text-xs opacity-70">{new Date(ticket.createdAt).toLocaleString()}</div>
                    <div className="mt-1 text-sm line-clamp-2">{ticket.description}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
