// FRONTEND/src/pages/supervisor/TaskAssign.jsx
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, CloudSun, Clock, MapPin,
  UserCheck, CheckCircle2, Pencil, Trash2, Save, X
} from 'lucide-react';
import { Sweet, Toast } from '@/utils/sweet';
import jsPDF from "jspdf";
import "jspdf-autotable";

// CeylonLeaf SVG logo constant
const CEYLONLEAF_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
     fill="none" stroke="#22C55E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
</svg>`;

// Utility: Convert SVG string to PNG Data URL for jsPDF
async function svgToPngDataUrl(svg, size = 24) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const svg64 = btoa(unescape(encodeURIComponent(svg)));
    const image64 = 'data:image/svg+xml;base64,' + svg64;
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = image64;
  });
}


const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const todayStr = () => new Date().toISOString().slice(0, 10);
const asTime = (s) => (s && /^\d{2}:\d{2}$/.test(s) ? s : '17:30');

export default function TaskAssign() {
  const token = localStorage.getItem('token');
  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [date, setDate] = useState(todayStr());
  const [fields, setFields] = useState([]);
  const [fieldName, setFieldName] = useState('');

  const [eligible, setEligible] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [loadingLists, setLoadingLists] = useState(false);

  // search bar
  const [search, setSearch] = useState('');

  // assign form
  const [pickedWorker, setPickedWorker] = useState(null);
  const [taskType, setTaskType] = useState('');
  const [customTask, setCustomTask] = useState('');
  const [dueTime, setDueTime] = useState('17:30');
  const [priority, setPriority] = useState('normal');
  const [notes, setNotes] = useState('');

  // edit form
  const [editing, setEditing] = useState(null); // task being edited
  const [editData, setEditData] = useState({ taskType: '', customTask: '', dueTime: '17:30', priority: 'normal', notes: '', status: 'assigned' });

  // weather
  const [wx, setWx] = useState({ loading: false, rows: [], now: null, loc: 'Awissawella', advisory: '' });

  /* load fields once */
  useEffect(() => {
    (async () => {
      try {
        setLoadingFields(true);
        const r = await axios.get(`${API}/api/fields`, { headers: authHeader });
        const items = Array.isArray(r.data?.items) ? r.data.items : (r.data || []);
        const mapped = items.map(x => ({ _id: x._id || x.id, name: x.name || '' })).filter(x => x.name);
        setFields(mapped);
      } catch (e) {
        console.error('[fields]', e);
        Toast.error('Failed to load fields');
      } finally {
        setLoadingFields(false);
      }
    })();
  }, []); // eslint-disable-line

  /* lists */
  const loadLists = async () => {
    try {
      setLoadingLists(true);
      const params = new URLSearchParams();
      if (date) params.set('date', date);
      if (fieldName) params.set('field', fieldName);

      const [el, td] = await Promise.all([
        axios.get(`${API}/api/tasks/eligible-workers?${params.toString()}`, { headers: authHeader }),
        axios.get(`${API}/api/tasks/today?${params.toString()}`, { headers: authHeader }),
      ]);

      setEligible(Array.isArray(el.data?.items) ? el.data.items : []);
      setTasks(Array.isArray(td.data?.items) ? td.data.items : []);
    } catch (e) {
      console.error('[eligible/today]', e);
      Toast.error('Failed to load workers/tasks');
    } finally {
      setLoadingLists(false);
    }
  };

  useEffect(() => {
    loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, fieldName]);

    // add this state near wx
  const [nowTime, setNowTime] = useState(new Date());

  // keep clock ticking every second
  useEffect(() => {
    const timer = setInterval(() => setNowTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // weather (Awissawella) + advisory
  useEffect(() => {
    let timer;
    const fetchWeather = async () => {
      try {
        setWx(w => ({ ...w, loading: true }));
        const lat = 6.9566, lon = 80.1997;
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&hourly=temperature_2m,precipitation_probability,precipitation,wind_speed_10m&timezone=auto`;
        const r = await fetch(url);
        const j = await r.json();
        const rows = (j?.hourly?.time || []).slice(0, 8).map((t, i) => ({
          time: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          temp: j.hourly.temperature_2m?.[i],
          rainp: j.hourly.precipitation_probability?.[i],
          rain: j.hourly.precipitation?.[i],
          wind: j.hourly.wind_speed_10m?.[i],
        }));
        const now = rows[0] || null;
        const avgRain = rows.length ? Math.round(rows.slice(0, 6).reduce((a, b) => a + (b.rainp || 0), 0) / Math.min(6, rows.length)) : 0;
        let advisory = 'Low rain chance — plucking & fertilizing are fine.';
        if (avgRain >= 50) advisory = 'High rain chance — prefer pruning/weeding; avoid fertilizing.';
        else if (avgRain >= 25) advisory = 'Moderate rain chance — schedule critical tasks earlier.';
        setWx({ loading: false, rows, now, loc: 'Awissawella', advisory });
      } catch {
        setWx({ loading: false, rows: [], now: null, loc: 'Awissawella', advisory: '' });
      }
    };

    fetchWeather();
    // refresh weather every 5 minutes
    timer = setInterval(fetchWeather, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);


  /* pick worker for assign */
  const pick = (w) => {
    setEditing(null);
    setPickedWorker(w);
    setTaskType('');
    setCustomTask('');
    setDueTime('17:30');
    setPriority('normal');
    setNotes('');
  };

  /* assign */
  const assign = async () => {
    if (!pickedWorker) return;
    const effectiveTask = taskType === 'other' ? (customTask || '').trim() : taskType;
    if (!effectiveTask) return Toast.error('Pick a task');

    try {
      const payload = {
        date,
        field: fieldName || pickedWorker.field || '',
        workerId: pickedWorker.workerId,
        workerName: pickedWorker.workerName || '',
        taskType: taskType === 'other' ? 'other' : effectiveTask,
        customTask: taskType === 'other' ? effectiveTask : '',
        dueTime: asTime(dueTime),
        priority,
        notes,
      };
      const { data } = await axios.post(`${API}/api/tasks`, payload, {
        headers: { ...authHeader, 'Content-Type': 'application/json' },
      });

      Toast.success('Task assigned');
      setEligible(list => list.filter(x => String(x.workerId) !== String(pickedWorker.workerId)));
      setTasks(list => [data.item, ...list]);

      setPickedWorker(null);
      setTaskType(''); setCustomTask(''); setNotes('');
    } catch (e) {
      console.error('[assign]', e);
      Sweet.error(e?.response?.data?.message || 'Assign failed');
    }
  };

  /* start editing */
  const startEdit = (t) => {
    setPickedWorker(null);
    setEditing(t);
    setEditData({
      taskType: t.taskType,
      customTask: t.customTask || '',
      dueTime: asTime(t.dueTime || '17:30'),
      priority: t.priority || 'normal',
      notes: t.notes || '',
      status: t.status || 'assigned',
    });
  };

  const cancelEdit = () => { setEditing(null); };

  const saveEdit = async () => {
    try {
      const payload = { ...editData };
      if (payload.taskType !== 'other') payload.customTask = '';
      const { data } = await axios.patch(`${API}/api/tasks/${editing._id}`, payload, {
        headers: { ...authHeader, 'Content-Type': 'application/json' },
      });
      Toast.success('Task updated');
      setTasks(list => list.map(x => (String(x._id) === String(editing._id) ? data.item : x)));
      setEditing(null);
    } catch (e) {
      console.error('[update]', e);
      Sweet.error(e?.response?.data?.message || 'Update failed');
    }
  };

  const removeTask = async (id) => {
    const ok = await Sweet.confirm('Delete this task?');
    if (!ok) return;
    try {
      await axios.delete(`${API}/api/tasks/${id}`, { headers: authHeader });
      Toast.success('Task deleted');
      setTasks(list => list.filter(x => String(x._id) !== String(id)));
    } catch (e) {
      console.error('[delete]', e);
      Sweet.error(e?.response?.data?.message || 'Delete failed');
    }
  };

  const refresh = () => loadLists();

  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-7xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/supervisor" className="btn btn-ghost">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold">Task Assignment</h1>
          </div>

          <button className="btn btn-ghost" onClick={refresh}>
            <RefreshCw className={`w-4 h-4 ${loadingLists ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* seach bar + Export PDF */}
<div className="relative w-full flex gap-2 items-start">
  <div className="flex-1 relative">
    <input
      type="text"
      placeholder="Search by EmpID, Worker name, or Task"
      value={search}
      onChange={e => setSearch(e.target.value)}
      className="input input-bordered w-full mt-2"
    />

    {search && (
      <ul className="absolute bg-base-100 border rounded-lg w-full mt-1 max-h-48 overflow-y-auto z-10">
        {tasks
          .filter(t =>
            [t.workerId, t.workerName, t.taskType, t.customTask]
              .some(val =>
                val?.toString().toLowerCase().includes(search.toLowerCase())
              )
          )
          .slice(0, 5) // limit to 5 suggestions
          .map(t => (
            <li
              key={t._id || `${t.workerId}-${t.date}-${t.taskType}`}
              className="p-2 hover:bg-base-200 cursor-pointer"
              onClick={() =>
                setSearch(
                  t.workerName || t.workerId || t.taskType || t.customTask
                )
              }
            >
              {t.workerName} ({t.workerId}) —{" "}
              {t.taskType === "other" ? t.customTask : t.taskType}
            </li>
          ))}

        {tasks.filter(t =>
          [t.workerId, t.workerName, t.taskType, t.customTask]
            .some(val =>
              val?.toString().toLowerCase().includes(search.toLowerCase())
            )
        ).length === 0 && (
          <li className="p-2 opacity-60">No results</li>
        )}
      </ul>
    )}
  </div>

{/* Export PDF button */}
<button
  className="btn btn-secondary mt-2"
  onClick={async () => {
    const doc = new jsPDF();

  // --- Header layout values ---
  const brandFontSize = 22;
  const logoH = 8; // display size
  const logoW = 8;
  const left = 14;
  const top = 16;
  const now = new Date().toLocaleString();
  // --- Draw logo ---
  // Render SVG at 3x size for sharpness
  const logoPng = await svgToPngDataUrl(CEYLONLEAF_SVG, logoH * 3);
  // Align logo and text with date row (y = top + 6)
  const headerY = top + 6;
  doc.addImage(logoPng, 'PNG', left, headerY - logoH + 2, logoW, logoH);

  // --- Brand text (aligned with logo and date) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(brandFontSize);
  doc.setTextColor('#22C55E');
  doc.text('CeylonLeaf', left + logoW + 2, headerY);

    // --- Date/time top right ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor('#000');
  doc.text(`Generated on ${now}`, doc.internal.pageSize.getWidth() - 14, headerY, { align: 'right' });

    // --- Report title center ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor('#000');
    doc.text('Daily Task Report', doc.internal.pageSize.getWidth() / 2, top + 28, { align: 'center' });

    // --- Field and date info below title ---
    doc.setFontSize(12);
    doc.text(`Field: ${fieldName || "All"}`, doc.internal.pageSize.getWidth() - 14, top + 36, { align: 'right' });
    doc.text(`Date: ${date}`, left, top + 36);

    // --- Table ---
    const tableData = tasks.map(t => [
      t.workerName || "-",
      t.workerId || "-",
      t.taskType === "other" ? (t.customTask || "other") : t.taskType,
      asTime(t.dueTime),
      t.priority || "normal",
      t.field || "-",
      t.status || "assigned",
    ]);


    doc.autoTable({
      head: [["Name", "EmpID", "Task", "Due", "Priority", "Field", "Status"]],
      body: tableData,
      startY: top + 44,
      headStyles: {
        fillColor: [34, 197, 94], // #22C55E
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 12,
      },
    });

    doc.save(`Daily_Tasks_${date}.pdf`);
  }}
>
  Export PDF
</button>
</div>

        {/* Filters + Weather */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-base-100 p-4 border">
            <label className="form-control mb-3">
              <span className="label-text">Date</span>
              <input type="date" className="input input-bordered" 
              value={date} 
                min={todayStr()}
                max={todayStr()}
              onChange={e => setDate(e.target.value)} />
            </label>

            <label className="form-control">
              <span className="label-text">Field</span>
              <select
                className="select select-bordered"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                disabled={loadingFields}
              >
                <option value="">All fields</option>
                {fields.map((f) => (
                  <option key={f._id} value={f.name}>{f.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-2xl bg-base-100 p-4 border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-semibold"><CloudSun className="w-4 h-4" /> Weather</div>
              <div className="text-xs opacity-70"><MapPin className="w-3 h-3 inline mr-1" />{wx.loc}</div>
            </div>

            {wx.loading ? (
              <div className="text-sm opacity-70">Loading weather…</div>
            ) : (
              <>
                {wx.now ? (
                  <>

                      <div className="rounded-xl border p-3">
                        <div className="opacity-70">Now</div>
                        <div className="text-xl font-semibold">{wx.now?.temp}°C</div>
                        <div className="text-xs opacity-70">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {nowTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </div>

                      <div className="rounded-xl border p-3">
                        <div className="opacity-70">Rain</div>
                        <div className="text-xl font-semibold">{wx.now.rainp ?? 0}%</div>
                        <div className="text-xs opacity-70">{wx.now.rain ?? 0} mm</div>
                      </div>
                      <div className="rounded-xl border p-3">
                        <div className="opacity-70">Wind</div>
                        <div className="text-xl font-semibold">{wx.now.wind ?? 0} km/h</div>
                      </div>
                  
                    {wx.advisory && (
                      <div className="mt-2 text-sm alert alert-info">
                        <span><b>Advisory:</b> {wx.advisory}</span>
                      </div>
                    )}
                    <div className="mt-3 overflow-x-auto">
                      <table className="table text-sm">
                        <thead>
                          <tr>
                            <th>Time</th><th>Temp</th><th>Rain %</th><th>Rain mm</th><th>Wind</th>
                          </tr>
                        </thead>
                        <tbody>
                          {wx.rows.map((r, idx) => (
                            <tr key={`${r.time}-${idx}`}>
                              <td>{r.time}</td>
                              <td>{r.temp}°C</td>
                              <td>{r.rainp ?? 0}%</td>
                              <td>{r.rain ?? 0}</td>
                              <td>{r.wind ?? 0} km/h</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="text-sm opacity-70">No weather data</div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Lists + form */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Eligible workers */}
          <div className="rounded-2xl bg-base-100 p-4 border">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <UserCheck className="w-4 h-4" /> Eligible workers
            </div>
            <div className="text-xs opacity-70 mb-2">Only today’s attendees are listed. Once assigned, a worker is removed.</div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr><th>Name</th><th>EmpID</th><th>Field</th><th /></tr>
                </thead>
                <tbody>
                  {eligible.map(w => (
                    <tr key={`${w.workerId}-${w.field || ''}`}>
                      <td>{w.workerName || '-'}</td>
                      <td><code>{w.workerId || '-'}</code></td>
                      <td>{w.field || '-'}</td>
                      <td className="text-right">
                        <button className="btn btn-sm" onClick={() => pick(w)}>Select</button>
                      </td>
                    </tr>
                  ))}
                  {eligible.length === 0 && (
                    <tr><td colSpan={4} className="opacity-60">No eligible workers</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right panel: Assign OR Edit */}
          <div className="rounded-2xl bg-base-100 p-4 border">
            {!editing && (
              <div className="flex items-center gap-2 font-semibold mb-2">
                <CheckCircle2 className="w-4 h-4" /> Assign task
              </div>
            )}
            {editing && (
              <div className="flex items-center gap-2 font-semibold mb-2">
                <Pencil className="w-4 h-4" /> Edit task
              </div>
            )}

            {/* ASSIGN */}
            {!editing && !pickedWorker && (
              <div className="alert">Select a worker from the list to start.</div>
            )}

            {!editing && pickedWorker && (
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium">
                    {pickedWorker.workerName || '-'} &nbsp;•&nbsp;
                    <code>{pickedWorker.workerId}</code>
                  </div>
                  <div className="opacity-70">Field: {fieldName || pickedWorker.field || '-'}</div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <label className="form-control">
                    <span className="label-text">Task</span>
                    <select className="select select-bordered" value={taskType} onChange={e => setTaskType(e.target.value)}>
                      <option value="">Pick task</option>
                      <option value="tea plucking">Tea plucking</option>
                      <option value="weeding">Weeding</option>
                      <option value="fertilizing">Fertilizing</option>
                      <option value="pruning">Pruning / cutting</option>
                      <option value="other">Other (custom)</option>
                    </select>
                  </label>
                  <label className="form-control">
                    <span className="label-text">Due (HH:mm)</span>
                    <input type="time" className="input input-bordered" value={dueTime} step="300" onChange={e => setDueTime(e.target.value)} />
                  </label>
                </div>

                {taskType === 'other' && (
                  <label className="form-control">
                    <span className="label-text">Custom task</span>
                    <input className="input input-bordered" value={customTask} onChange={e => setCustomTask(e.target.value)} />
                  </label>
                )}

                <div className="grid md:grid-cols-2 gap-3">
                  <label className="form-control">
                    <span className="label-text">Priority</span>
                    <select className="select select-bordered" value={priority} onChange={e => setPriority(e.target.value)}>
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </select>
                  </label>

                  <label className="form-control">
                    <span className="label-text">Notes (optional)</span>
                    <input className="input input-bordered" value={notes} onChange={e => setNotes(e.target.value)} />
                  </label>
                </div>

                <div className="flex gap-2">
                  <button className="btn btn-primary" onClick={assign}>Assign</button>
                  <button className="btn" onClick={() => setPickedWorker(null)}>Cancel</button>
                </div>
              </div>
            )}

            {/* EDIT */}
            {editing && (
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium">
                    {editing.workerName || '-'} &nbsp;•&nbsp; <code>{editing.workerId}</code>
                  </div>
                  <div className="opacity-70">Field: {editing.field || '-'}</div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <label className="form-control">
                    <span className="label-text">Task</span>
                    <select className="select select-bordered" value={editData.taskType} onChange={e => setEditData(p => ({ ...p, taskType: e.target.value }))}>
                      <option value="tea plucking">Tea plucking</option>
                      <option value="weeding">Weeding</option>
                      <option value="fertilizing">Fertilizing</option>
                      <option value="pruning">Pruning / cutting</option>
                      <option value="other">Other (custom)</option>
                    </select>
                  </label>
                  <label className="form-control">
                    <span className="label-text">Due (HH:mm)</span>
                    <input type="time" className="input input-bordered" value={editData.dueTime} step="300" onChange={e => setEditData(p => ({ ...p, dueTime: e.target.value }))} />
                  </label>
                </div>

                {editData.taskType === 'other' && (
                  <label className="form-control">
                    <span className="label-text">Custom task</span>
                    <input className="input input-bordered" value={editData.customTask} onChange={e => setEditData(p => ({ ...p, customTask: e.target.value }))} />
                  </label>
                )}

                <div className="grid md:grid-cols-2 gap-3">
                  <label className="form-control">
                    <span className="label-text">Priority</span>
                    <select className="select select-bordered" value={editData.priority} onChange={e => setEditData(p => ({ ...p, priority: e.target.value }))}>
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </select>
                  </label>
                  <label className="form-control">
                    <span className="label-text">Status</span>
                    <select className="select select-bordered" value={editData.status} onChange={e => setEditData(p => ({ ...p, status: e.target.value }))}>
                      <option value="assigned">Assigned</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </label>
                </div>

                <label className="form-control">
                  <span className="label-text">Notes</span>
                  <input className="input input-bordered" value={editData.notes} onChange={e => setEditData(p => ({ ...p, notes: e.target.value }))} />
                </label>

                <div className="flex gap-2">
                  <button className="btn btn-primary" onClick={saveEdit}><Save className="w-4 h-4 mr-1" /> Save</button>
                  <button className="btn" onClick={cancelEdit}><X className="w-4 h-4 mr-1" /> Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Today’s tasks */}
        <div className="rounded-2xl bg-base-100 p-4 border">
          <h3 className="font-semibold mb-2">Today’s tasks</h3>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Worker</th><th>EmpID</th><th>Task</th><th>Due</th><th>Priority</th><th>Field</th><th>Status</th><th />
                </tr>
              </thead>

              <tbody>
              {tasks
                .filter(t =>
                  [t.workerId, t.workerName, t.taskType, t.customTask]
                    .some(val =>
                      val?.toString().toLowerCase().includes(search.toLowerCase())
                    )
                )
                .map(t => (
                  <tr key={t._id || `${t.workerId}-${t.date}-${t.taskType}`}>
                    <td>{t.workerName || '-'}</td>
                    <td><code>{t.workerId || '-'}</code></td>
                    <td>{t.taskType === 'other' ? (t.customTask || 'other') : t.taskType}</td>
                    <td>{asTime(t.dueTime)}</td>
                    <td className="capitalize">{t.priority || 'normal'}</td>
                    <td>{t.field || '-'}</td>
                    <td className="capitalize">{t.status || 'assigned'}</td>
                    <td className="text-right">
                      <button
                        className="btn btn-sm mr-2"
                        style={{ backgroundColor: '#FFC107', color: '#111', borderRadius: '2em', border: 'none', fontWeight: 600, minWidth: 90 }}
                        onClick={() => startEdit(t)}
                      >
                        <Pencil className="w-4 h-4" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>

            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
