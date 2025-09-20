// FRONTEND/src/pages/worker/WorkerDashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Sweet, Toast } from '@/utils/sweet';
import {
  Languages, Bell, CheckCircle2, Leaf, ClipboardList, Send, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
    sendNotice: 'Send a special notice',
    subject: 'Subject',
    message: 'Message',
    send: 'Send',
    lang: 'Language',
    refresh: 'Refresh',
  },
  si: {
    title: 'කම්කරුවන්ගේ උපුටාගත් පුවරුව',
    hello: 'ආයුබෝවන්',
    today: 'අද',
    plucked: 'අද කොයල දමාගත්ත (කි.ග්‍රැ.)',
    tasksToday: 'අද කටයුතු',
    noTasks: 'දැනට කටයුතු නැත.',
    notices: 'නිවේදන',
    noNotices: 'පෙන්වීමට නිවේදන නොමැත.',
    sendNotice: 'විශේෂ දැන්වීමක් එවන්න',
    subject: 'මාතෘකාව',
    message: 'පණිවිඩය',
    send: 'යවන්න',
    lang: 'භාෂාව',
    refresh: 'නවතම කරන්න',
  },
  ta: {
    title: 'தொழிலாளர் பலகை',
    hello: 'வணக்கம்',
    today: 'இன்று',
    plucked: 'இன்று பறித்த இலை (கிலோ)',
    tasksToday: 'இன்றைய பணிகள்',
    noTasks: 'இன்னும் பணிகள் இல்லை.',
    notices: 'அறிவிப்புகள்',
    noNotices: 'காண்பிக்க அறிவிப்புகள் இல்லை.',
    sendNotice: 'சிறப்பு அறிவிப்பு அனுப்பு',
    subject: 'தலைப்பு',
    message: 'செய்தி',
    send: 'அனுப்பு',
    lang: 'மொழி',
    refresh: 'புதுப்பி',
  },
};

export default function WorkerDashboard() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const T = STR[lang] || STR.en;

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    worker: { id: '', name: '' },
    pluckedKg: 0,
    tasks: [],
    notices: []
  });

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const refresh = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/api/worker/summary?date=${date}`, { headers: authHeader });
      setData({
        worker: data.worker || {},
        pluckedKg: Number(data.pluckedKg || 0),
        tasks: Array.isArray(data.tasks) ? data.tasks : [],
        notices: Array.isArray(data.notices) ? data.notices : [],
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

  const sendNotice = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      return Toast.error('Type a message first');
    }
    try {
      await axios.post(`${API}/api/worker/notify`, { title: subject || 'Worker notice', content: message }, {
        headers: { ...authHeader, 'Content-Type': 'application/json' }
      });
      setSubject('');
      setMessage('');
      Sweet.success('Sent to admin');
    } catch (e) {
      console.error('[notify]', e?.response?.status, e?.response?.data);
      Sweet.error(e?.response?.data?.message || 'Failed to send');
    }
  };

  const onLangChange = (v) => {
    setLang(v);
    localStorage.setItem('lang', v);
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-5xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Leaf className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-extrabold">{T.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="join">
              <span className="btn btn-ghost join-item"><Languages className="w-4 h-4 mr-2" /> {T.lang}</span>
              <select
                className="select select-bordered join-item"
                value={lang}
                onChange={(e) => onLangChange(e.target.value)}
              >
                <option value="en">English</option>
                <option value="si">සිංහල</option>
                <option value="ta">தமிழ்</option>
              </select>
            </div>
            <button className="btn" onClick={refresh} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {T.refresh}
            </button>
          </div>
        </div>

        {/* Greeting + date */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xl">
            {T.hello}, <span className="font-semibold">{data.worker?.name || user?.name || ''}</span>
            <span className="opacity-70"> ({data.worker?.id || user?.empId || ''})</span>
          </div>
          <input
            type="date"
            className="input input-bordered text-lg"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label={T.today}
          />
        </div>

        {/* KPIs */}
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="rounded-2xl bg-base-100 p-5 border shadow">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Leaf className="w-5 h-5 text-primary" /> {T.plucked}
            </div>
            <div className="text-4xl font-extrabold mt-2">{data.pluckedKg}</div>
          </div>

          <div className="rounded-2xl bg-base-100 p-5 border shadow md:col-span-2">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <ClipboardList className="w-5 h-5 text-primary" /> {T.tasksToday}
            </div>
            {data.tasks.length === 0 ? (
              <div className="mt-3 opacity-70">{T.noTasks}</div>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.tasks.map(t => (
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

        {/* Notices + Send */}
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <div className="rounded-2xl bg-base-100 p-5 border shadow">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Bell className="w-5 h-5 text-primary" /> {T.notices}
            </div>
            {data.notices.length === 0 ? (
              <div className="mt-3 opacity-70">{T.noNotices}</div>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.notices.map(n => (
                  <li key={n._id} className="p-3 rounded-xl border">
                    <div className="font-semibold">{n.title || 'Notice'}</div>
                    <div className="text-sm opacity-70">
                      {new Date(n.createdAt).toLocaleString()} {n.author ? `• ${n.author}` : ''}
                    </div>
                    <div className="mt-1">{n.content}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl bg-base-100 p-5 border shadow">
            <div className="text-lg font-semibold">{T.sendNotice}</div>
            <form className="mt-3 space-y-3" onSubmit={sendNotice}>
              <input
                className="input input-bordered w-full text-lg"
                placeholder={T.subject}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <textarea
                className="textarea textarea-bordered w-full text-lg"
                rows={4}
                placeholder={T.message}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button className="btn btn-primary text-lg" type="submit">
                <Send className="w-4 h-4 mr-1" /> {T.send}
              </button>
            </form>
          </div>
        </div>

        {/* Back link (optional) */}
        <div className="mt-8">
          <Link className="btn btn-ghost" to="/">
            ← Home
          </Link>
        </div>
      </div>
    </div>
  );
}
