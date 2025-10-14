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

  const exportTaskAssignmentPDF = () => {
    const w = window.open('', '_blank');
    if (!w) {
      Sweet.error('Please allow popups to export.');
      return;
    }

    const escapeHTML = (s) =>
      String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const style = `
      <style>
        * { font-family: Arial, Helvetica, sans-serif; }
        body { margin: 0; padding: 20px; background: #ffffff; }
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
          margin-bottom: 30px; 
          border-bottom: 3px solid #22C55E;
          padding-bottom: 20px;
        }
        .logo-section { 
          display: flex; 
          align-items: center; 
        }
        .leaf-icon { 
          width: 24px; 
          height: 24px; 
          margin-right: 10px; 
          display: inline-block;
          color: #22C55E;
        }
        .company-name { 
          font-size: 24px; 
          font-weight: bold; 
          color: #22C55E; 
          margin: 0; 
        }
        .generation-info { 
          text-align: right; 
          font-size: 11px; 
          color: #666; 
          line-height: 1.4;
        }
        .report-title { 
          font-size: 20px; 
          font-weight: bold; 
          color: #000; 
          text-align: center; 
          margin: 30px 0; 
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        .details-section {
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          padding: 15px;
        }
        .details-title {
          font-size: 16px;
          font-weight: bold;
          color: #22C55E;
          margin-bottom: 10px;
          border-bottom: 1px solid #dee2e6;
          padding-bottom: 5px;
        }
        .detail-item {
          margin-bottom: 8px;
          font-size: 14px;
        }
        .detail-label {
          font-weight: bold;
          color: #495057;
        }
        .detail-value {
          color: #212529;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #22C55E;
          margin: 30px 0 15px 0;
          border-bottom: 2px solid #22C55E;
          padding-bottom: 8px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          font-size: 12px; 
          margin-bottom: 20px;
        }
        th { 
          background: #22C55E; 
          color: #fff; 
          font-weight: bold; 
          padding: 12px 8px; 
          text-align: left;
          border: 1px solid #1a9c4a;
        }
        td { 
          padding: 10px 8px; 
          border: 1px solid #dee2e6; 
          background: #fff;
        }
        tr:nth-child(even) td {
          background: #f8f9fa;
        }
        .summary-box {
          background: #fff3cd;
          border: 2px solid #ffc107;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
        .summary-title {
          font-size: 16px;
          font-weight: bold;
          color: #856404;
          margin-bottom: 10px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 15px;
        }
        .summary-item {
          text-align: center;
        }
        .summary-value {
          font-size: 18px;
          font-weight: bold;
          color: #856404;
        }
        .summary-label {
          font-size: 12px;
          color: #6c757d;
        }
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status-assigned { background: #dbeafe; color: #1e40af; }
        .status-in-progress { background: #fef3c7; color: #92400e; }
        .status-completed { background: #d1fae5; color: #065f46; }
        .priority-high { background: #fecaca; color: #991b1b; }
        .priority-medium { background: #fef3c7; color: #92400e; }
        .priority-low { background: #d1fae5; color: #065f46; }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #22C55E;
          text-align: center;
          font-size: 11px;
          color: #6c757d;
        }
        .footer-company {
          font-weight: bold;
          color: #22C55E;
          margin-bottom: 5px;
        }
        .footer-address {
          margin-bottom: 5px;
        }
        .footer-slogan {
          font-style: italic;
          margin-bottom: 10px;
        }
        .page-number {
          font-weight: bold;
        }
      </style>
    `;

    const getStatusClass = (status) => {
      switch(status) {
        case 'assigned': return 'status-assigned';
        case 'in-progress': return 'status-in-progress';
        case 'completed': return 'status-completed';
        default: return 'status-assigned';
      }
    };

    const getPriorityClass = (priority) => {
      switch(priority) {
        case 'high': return 'priority-high';
        case 'medium': return 'priority-medium';
        case 'low': return 'priority-low';
        default: return 'priority-medium';
      }
    };

    const filteredTasksForPDF = tasks.filter(t => {
      const matchesSearch = !search || [t.workerId, t.workerName, t.taskType, t.customTask]
        .some(val => val?.toString().toLowerCase().includes(search.toLowerCase()));
      const matchesField = !fieldName || t.field === fieldName;
      return matchesSearch && matchesField;
    });

    const taskStats = {
      total: filteredTasksForPDF.length,
      assigned: filteredTasksForPDF.filter(t => t.status === 'assigned').length,
      inProgress: filteredTasksForPDF.filter(t => t.status === 'in-progress').length,
      completed: filteredTasksForPDF.filter(t => t.status === 'completed').length,
      high: filteredTasksForPDF.filter(t => t.priority === 'high').length,
      medium: filteredTasksForPDF.filter(t => t.priority === 'medium').length,
      low: filteredTasksForPDF.filter(t => t.priority === 'low').length
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Task Assignment Report - ${date}</title>
        ${style}
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <div class="logo-section">
            <div class="leaf-icon">🍃</div>
            <div class="company-name">CeylonLeaf Tea Estate</div>
          </div>
          <div class="generation-info">
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
            <div><strong>Report Date:</strong> ${date}</div>
            <div><strong>Generated By:</strong> Field Supervisor</div>
          </div>
        </div>

        <!-- Report Title -->
        <div class="report-title">TASK ASSIGNMENT REPORT</div>

        <!-- Report Information Grid -->
        <div class="details-grid">
          <div class="details-section">
            <div class="details-title">REPORT INFORMATION</div>
            <div class="detail-item">
              <span class="detail-label">Report Date:</span>
              <span class="detail-value"> ${date}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Field Filter:</span>
              <span class="detail-value"> ${fieldName || 'All Fields'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Search Filter:</span>
              <span class="detail-value"> ${search || 'None'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Weather Location:</span>
              <span class="detail-value"> ${wx.loc || 'N/A'}</span>
            </div>
          </div>
          
          <div class="details-section">
            <div class="details-title">WEATHER CONDITIONS</div>
            <div class="detail-item">
              <span class="detail-label">Current Temperature:</span>
              <span class="detail-value"> ${wx.temp || 'N/A'}°C</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Rain Probability:</span>
              <span class="detail-value"> ${wx.rain || 'N/A'}%</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Wind Speed:</span>
              <span class="detail-value"> ${wx.wind || 'N/A'} km/h</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Last Updated:</span>
              <span class="detail-value"> ${wx.time || 'N/A'}</span>
            </div>
          </div>
        </div>

        <!-- Task Statistics -->
        <div class="summary-box">
          <div class="summary-title">TASK STATISTICS</div>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">${taskStats.total}</div>
              <div class="summary-label">Total Tasks</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${taskStats.assigned}</div>
              <div class="summary-label">Assigned</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${taskStats.inProgress}</div>
              <div class="summary-label">In Progress</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${taskStats.completed}</div>
              <div class="summary-label">Completed</div>
            </div>
          </div>
        </div>

        <!-- Priority Statistics -->
        <div class="summary-box">
          <div class="summary-title">PRIORITY DISTRIBUTION</div>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">${taskStats.high}</div>
              <div class="summary-label">High Priority</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${taskStats.medium}</div>
              <div class="summary-label">Medium Priority</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${taskStats.low}</div>
              <div class="summary-label">Low Priority</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${Math.round((taskStats.completed / taskStats.total) * 100) || 0}%</div>
              <div class="summary-label">Completion Rate</div>
            </div>
          </div>
        </div>

        <!-- Task Details Table -->
        <div class="section-title">TASK ASSIGNMENTS (${filteredTasksForPDF.length})</div>
        
        ${filteredTasksForPDF.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Worker Name</th>
                <th>Employee ID</th>
                <th>Task Description</th>
                <th>Due Time</th>
                <th>Priority</th>
                <th>Field</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTasksForPDF.map(task => `
                <tr>
                  <td>${escapeHTML(task.workerName || 'N/A')}</td>
                  <td>${escapeHTML(task.workerId || 'N/A')}</td>
                  <td>${escapeHTML(task.taskType === 'other' ? (task.customTask || 'Other') : task.taskType)}</td>
                  <td style="text-align: center;">${asTime(task.dueTime)}</td>
                  <td style="text-align: center;">
                    <span class="status-badge ${getPriorityClass(task.priority)}">${task.priority || 'medium'}</span>
                  </td>
                  <td>${escapeHTML(task.field || 'N/A')}</td>
                  <td style="text-align: center;">
                    <span class="status-badge ${getStatusClass(task.status)}">${task.status || 'assigned'}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `
          <div class="no-data" style="text-align: center; color: #6c757d; font-style: italic; padding: 20px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px;">
            No tasks found for the selected criteria
          </div>
        `}

        <!-- Footer -->
        <div class="footer">
          <div class="footer-company">CeylonLeaf Plantations</div>
          <div class="footer-address">No. 123, Tea Estate Road, Nuwara Eliya, Sri Lanka</div>
          <div class="footer-slogan">Cultivating excellence in every leaf.</div>
          <div class="page-number">Page 1</div>
        </div>
      </body>
      </html>
    `;
    
    w.document.open(); 
    w.document.write(html); 
    w.document.close();
    w.onload = () => { w.focus(); w.print(); };
  };

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
  onClick={exportTaskAssignmentPDF}
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
