import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  ClipboardList,
  Languages,
  Leaf,
  LogOut,
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
    lang: 'Language',
    refresh: 'Refresh',
    logout: 'Logout',
    notificationsTitle: 'Notifications',
    notificationFallback: 'Notification',
    taskField: 'Field',
    taskDue: 'Due',
    taskPriority: 'Priority',
    taskOther: 'Other',
    priorityLabels: { low: 'low', normal: 'normal', high: 'high', urgent: 'urgent' },
    statusLabels: { assigned: 'assigned', completed: 'completed', in_progress: 'in progress' },
    failedLoad: 'Failed to load',
    logoutConfirm: 'Log out?',
    logoutSuccess: 'Signed out',
  },
  si: {
    title: 'කම්කරු පුවරුව',
    hello: 'ආයුබෝවන්',
    today: 'අද',
    plucked: 'කපන ලද කොළ (කි.ග්‍රැ.)',
    tasksToday: 'අද කටයුතු',
    noTasks: 'තවමත් කාර්යයන් පවරා නොමැත.',
    notices: 'දැනුම්දීම්',
    noNotices: 'පෙන්වීමට දැනුම්දීම් නොමැත.',
    lang: 'භාෂාව',
    refresh: 'නවකරණය',
    logout: 'පිටවීම',
    notificationsTitle: 'දැනුම්දීම්',
    notificationFallback: 'දැනුම්දීම',
    taskField: 'ක්ෂේත්‍රය',
    taskDue: 'නියමිත වේලාව',
    taskPriority: 'ප්‍රමුඛතාව',
    taskOther: 'වෙනත්',
    priorityLabels: { low: 'අවම', normal: 'සාමාන්‍ය', high: 'ඉහළ', urgent: 'ඉතා ප්‍රමුඛ' },
    statusLabels: { assigned: 'පවරා ඇත', completed: 'සම්පූර්ණයි', in_progress: 'සංවර්ධනයේ' },
    failedLoad: 'පූරණය අසාර්ථක විය',
    logoutConfirm: 'පිටවීමටද?',
    logoutSuccess: 'පිටවීය',
  },
  ta: {
    title: 'தொழிலாளி கட்டுப்பாடு பலகை',
    hello: 'வணக்கம்',
    today: 'இன்று',
    plucked: 'பறிக்கப்பட்ட இலைகள் (கிலோ)',
    tasksToday: 'இன்றைய பணிகள்',
    noTasks: 'பணிகள் இன்னும் ஒப்படைக்கப்படவில்லை.',
    notices: 'அறிவிப்புகள்',
    noNotices: 'காட்ட அறிவிப்புகள் இல்லை.',
    lang: 'மொழி',
    refresh: 'புதுப்பிக்க',
    logout: 'வெளியேறு',
    notificationsTitle: 'அறிவிப்புகள்',
    notificationFallback: 'அறிவிப்பு',
    taskField: 'பயிர் பகுதி',
    taskDue: 'நியமிக்கப்பட்ட நேரம்',
    taskPriority: 'முக்கியத்துவம்',
    taskOther: 'மற்றவை',
    priorityLabels: { low: 'குறைந்த', normal: 'சாதாரணம்', high: 'அதிகம்', urgent: 'மிக அவசரம்' },
    statusLabels: { assigned: 'ஒதுக்கப்பட்டது', completed: 'முடிந்தது', in_progress: 'நடப்பில்' },
    failedLoad: 'ஏற்ற முடியவில்லை',
    logoutConfirm: 'வெளியேறவா?',
    logoutSuccess: 'வெளியேறப்பட்டது',
  },
};

const LANG_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'සිංහල' },
  { code: 'ta', label: 'தமிழ்' },
];

export default function WorkerDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [lang, setLang] = useState(() => {
    const stored = localStorage.getItem('workerLang');
    return stored && STR[stored] ? stored : 'en';
  });
  const T = STR[lang] || STR.en;

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    worker: { id: '', name: '' },
    pluckedKg: 0,
    tasks: [],
    notices: [],
    notifications: [],
  });

  const refresh = async () => {
    try {
      setLoading(true);
      const [summaryRes, notifRes] = await Promise.all([
        axios.get(`${API}/api/worker/summary?date=${date}`, { headers: authHeader }),
        axios.get(`${API}/api/notifications`, { headers: authHeader }),
      ]);
      setData({
        worker: summaryRes.data.worker || {},
        pluckedKg: Number(summaryRes.data.pluckedKg || 0),
        tasks: Array.isArray(summaryRes.data.tasks) ? summaryRes.data.tasks : [],
        notices: Array.isArray(summaryRes.data.notices) ? summaryRes.data.notices : [],
        notifications: Array.isArray(notifRes.data.items) ? notifRes.data.items : [],
      });
    } catch (e) {
      console.error('[worker summary]', e?.response?.status, e?.response?.data);
      Sweet.error(e?.response?.data?.message || T.failedLoad);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  useEffect(() => {
    localStorage.setItem('workerLang', lang);
  }, [lang]);

  const changeLanguage = (nextLang) => {
    if (nextLang === lang) return;
    if (STR[nextLang]) {
      setLang(nextLang);
      setTimeout(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }, 50);
    }
  };

  const formatPriority = (value) => {
    const key = (value || 'normal').toLowerCase();
    return T.priorityLabels?.[key] || value || T.priorityLabels?.normal || 'normal';
  };

  const formatStatus = (value) => {
    const key = (value || 'assigned').toLowerCase();
    return T.statusLabels?.[key] || value || T.statusLabels?.assigned || 'assigned';
  };

  const logout = async () => {
    const ok = await Sweet.confirm(T.logoutConfirm);
    if (!ok) return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    await Sweet.success(T.logoutSuccess);
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
            <div className="dropdown dropdown-end">
              <button
                type="button"
                tabIndex={0}
                className="btn btn-ghost join-item"
                aria-label={T.lang}
                aria-haspopup="listbox"
              >
                <Languages className="w-4 h-4 mr-2" /> {T.lang}
              </button>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-2 p-2 shadow bg-base-100 rounded-box w-36 border border-base-content/10 z-[60]">
                {LANG_OPTIONS.map((option) => (
                  <li key={option.code}>
                    <button
                      type="button"
                      className={`justify-between ${option.code === lang ? 'active text-primary font-semibold' : ''}`}
                      onClick={() => changeLanguage(option.code)}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
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
                      <div className="font-semibold text-lg">{t.taskType === 'other' ? (t.customTask || T.taskOther) : t.taskType}</div>
                      <div className="text-sm opacity-70">
                        {t.field ? `${T.taskField}: ${t.field} • ` : ''}{T.taskDue}: {t.dueTime || '-'} • {T.taskPriority}: {formatPriority(t.priority)}
                      </div>
                    </div>
                    <div className="badge badge-success gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {formatStatus(t.status)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="rounded-2xl bg-base-100 p-5 border shadow">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Bell className="w-5 h-5 text-primary" /> {T.notificationsTitle}
            </div>
            {data.notifications.length === 0 ? (
              <div className="mt-3 opacity-70">{T.noNotices}</div>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.notifications.map((n) => (
                  <li key={n._id} className="p-3 rounded-xl border">
                    <div className="font-semibold">{n.title || T.notificationFallback}</div>
                    <div className="text-sm opacity-70">{new Date(n.createdAt).toLocaleString()}</div>
                    <div className="mt-1 whitespace-pre-wrap leading-relaxed">{n.content}</div>
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

