import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sweet, Toast } from '@/utils/sweet';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const CEYLONLEAF_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
     fill="none" stroke="#22C55E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
</svg>
`;

const svgToPngDataUrl = (svgMarkup, targetPx = 26) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const scale = targetPx / (img.width || 28);
      const w = Math.max(1, Math.round((img.width || 28) * scale));
      const h = Math.max(1, Math.round((img.height || 28) * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = reject;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgMarkup);
  });

export default function AttendanceList() {
  const token = localStorage.getItem('token');
  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [limit] = useState(50);
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const load = async () => {
    try {
      setLoading(true);
      setErr('');
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      params.set('limit', String(limit));

      const { data } = await axios.get(`${API}/api/attendance?${params.toString()}`, { headers: authHeader });
      setRows(data.items || []);
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || 'Load failed';
      setErr(msg);
      Toast.fire({ icon: 'error', title: msg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, dateFrom, dateTo, limit]);

  const deleteRow = async (id) => {
    const first = await Sweet.fire({
      title: 'Delete this attendance record?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    });
    if (!first.isConfirmed) return;

    const second = await Sweet.fire({
      title: 'Are you absolutely sure?',
      text: 'Deleting will permanently remove this record.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete permanently',
      cancelButtonText: 'No',
    });
    if (!second.isConfirmed) return;

    try {
      await axios.delete(`${API}/api/attendance/${id}`, { headers: authHeader });
      setRows((r) => r.filter((x) => x._id !== id));
      Toast.fire({ icon: 'success', title: 'Attendance record deleted' });
    } catch (e) {
      const msg = e?.response?.data?.message || 'Delete failed';
      console.error(e);
      Sweet.fire({ icon: 'error', title: 'Failed to delete', text: msg });
    }
  };

  const showNote = (note, workerName, date) => {
    if (!note) return;
    Sweet.fire({
      icon: 'info',
      title: `${workerName || 'Worker'} (${date || 'date unknown'})`,
      text: note,
      confirmButtonText: 'Close',
    });
  };

  const exportPdf = async () => {
    if (!rows.length) return;
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 48;
      const marginY = 42;

      const logoDataUrl = await svgToPngDataUrl(CEYLONLEAF_SVG, 30);
      const generatedAt = new Date();

      const totalRecords = rows.length;
      const presentCount = rows.filter(r => String(r.status).toLowerCase() === 'present').length;
      const lateCount = rows.filter(r => String(r.status).toLowerCase() === 'late').length;

      const renderHeader = () => {
        const brandBaseline = marginY + 18;
        const logoSize = 28;
        if (logoDataUrl) {
          doc.addImage(logoDataUrl, 'PNG', marginX, marginY - 6, logoSize, logoSize);
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(34, 197, 94);
        doc.text('CeylonLeaf', marginX + logoSize + 8, brandBaseline);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.text(`Generated on ${generatedAt.toLocaleString()}`, pageWidth - marginX, marginY, { align: 'right' });
        doc.text(`Records: ${totalRecords}`, pageWidth - marginX, marginY + 12, { align: 'right' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(17, 24, 39);
        doc.text('Attendance Report', pageWidth / 2, marginY + 32, { align: 'center' });
      };

      const renderFooter = (pageNumber) => {
        const footerTop = pageHeight - 72;
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(marginX, footerTop, pageWidth - marginX, footerTop);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(34, 197, 94);
        doc.text('CeylonLeaf Plantations', pageWidth / 2, footerTop + 18, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('No. 123, Tea Estate Road, Nuwara Eliya, Sri Lanka', pageWidth / 2, footerTop + 32, { align: 'center' });
        doc.text('Cultivating excellence in every leaf.', pageWidth / 2, footerTop + 46, { align: 'center' });

        doc.setFontSize(8);
        doc.text(`Page ${pageNumber}`, pageWidth - marginX, footerTop + 46, { align: 'right' });
      };

      renderHeader();

      autoTable(doc, {
        body: [[
          { content: `Total Records: ${totalRecords}`, styles: { textColor: [30, 41, 59], fontStyle: 'bold' } },
          { content: `Present: ${presentCount}`, styles: { textColor: [34, 197, 94], fontStyle: 'bold' } },
          { content: `Late: ${lateCount}`, styles: { textColor: [234, 179, 8], fontStyle: 'bold' } },
        ]],
        theme: 'plain',
        styles: { fontSize: 11 },
        margin: { left: marginX, right: marginX },
        startY: marginY + 46,
      });

      let tableStartY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : marginY + 66;

      const activeFilters = [];
      if (q) activeFilters.push(`Search: "${q}"`);
      if (status) activeFilters.push(`Status: ${status}`);
      if (dateFrom) activeFilters.push(`From: ${dateFrom}`);
      if (dateTo) activeFilters.push(`To: ${dateTo}`);
      if (activeFilters.length) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(94, 104, 118);
        doc.text(`Filters • ${activeFilters.join(' | ')}`, marginX, tableStartY);
        tableStartY += 16;
      }

      const body = rows.map((r) => {
        const rawStatus = (r.status || '').replace(/_/g, ' ').trim();
        const normalizedStatus = rawStatus.toLowerCase();
        const displayStatus = rawStatus
          ? rawStatus.replace(/\w/g, (ch) => ch.toUpperCase())
          : '-';
        return [
          r.date || '-',
          r.workerId || '-',
          r.workerName || '-',
          r.field || '-',
          r.checkInTime || '-',
          r.checkOutTime || r.expectedOutTime || '-',
          { content: displayStatus, statusValue: normalizedStatus }
        ];
      });

      autoTable(doc, {
        head: [['Date', 'Employee ID', 'Worker Name', 'Field', 'Check-In', 'Expected Out', 'Status']],
        body: body.length
          ? body
          : [[
              '-', '-', '-', '-', '-', '-',
              { content: '-', statusValue: '' }
            ]],
        startY: tableStartY,
        margin: { top: marginY + 60, left: marginX, right: marginX, bottom: 90 },
        styles: { fontSize: 10, cellPadding: 6, lineWidth: 0.2, lineColor: [226, 232, 240] },
        headStyles: { fillColor: [34, 197, 94], textColor: [17, 24, 39], fontSize: 11, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 6) {
            const statusValue = typeof data.cell.raw === 'object'
              ? String(data.cell.raw.statusValue || '').toLowerCase()
              : String(data.cell.raw || '').toLowerCase();
            if (statusValue === 'present') {
              data.cell.styles.textColor = [34, 197, 94];
              data.cell.styles.fontStyle = 'bold';
            } else if (statusValue === 'late') {
              data.cell.styles.textColor = [234, 179, 8];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [30, 41, 59];
            }
          }
        },
        didDrawPage: (data) => {
          renderHeader();
          renderFooter(data.pageNumber);
        },
      });

      const blobUrl = doc.output('bloburl');
      window.open(blobUrl, '_blank');
      Toast.fire({ icon: 'success', title: 'Attendance report ready' });
    } catch (error) {
      console.error('[attendance pdf] error', error);
      Toast.fire({ icon: 'error', title: 'Failed to generate PDF' });
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-7xl p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-bold">Attendance</h1>
          <div className="flex gap-2">
            <Link className="btn btn-primary" to="/supervisor/attendance/new">New</Link>
            <Link className="btn" to="/supervisor/attendance/scan">Scan</Link>
            <button className="btn btn-outline" onClick={exportPdf} disabled={rows.length === 0}>Export PDF</button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3 bg-base-100 border rounded-xl p-4">
          <input
            className="input input-bordered"
            placeholder="Search EmpID / Name / Field"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="select select-bordered" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All status</option>
            <option value="present">present</option>
            <option value="absent">absent</option>
            <option value="leave">leave</option>
            <option value="late">late</option>
          </select>
          <input
          type="date"
          className="input input-bordered"
          value={dateFrom}
          max={today}
          onChange={(e) => {
            const value = e.target.value;
            setDateFrom(value && value > today ? today : value);
          }}
          />
          <input
          type="date"
          className="input input-bordered"
          value={dateTo}
          max={today}
          onChange={(e) => {
            const value = e.target.value;
            setDateTo(value && value > today ? today : value);
          }}
          />
          <button className="btn" onClick={load} disabled={loading}>Apply</button>
        </div>

        {err && <div className="alert alert-error mt-4"><span>{err}</span></div>}

        <div className="mt-4 overflow-x-auto rounded-xl border bg-base-100">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>EmpID</th>
                <th>Name</th>
                <th>Field</th>
                <th>In</th>
                <th>Expected Out</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8}>Loading…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={8}>No records</td></tr>
              )}
              {!loading && rows.map((r) => {
                const edited = Boolean(r.notes && String(r.notes).trim().length);
                return (
                  <tr
                    key={r._id}
                    className={`transition-colors ${edited ? 'bg-amber-900/10 hover:bg-amber-900/20' : 'hover:bg-base-200/50'}`}
                  >
                    <td>{r.date}</td>
                    <td>{r.workerId}</td>
                    <td>{r.workerName}</td>
                    <td>{r.field}</td>
                    <td>{r.checkInTime}</td>
                    <td>{r.expectedOutTime || '-'}</td>
                    <td className="capitalize">
                      {r.status}
                      {edited && <span className="badge badge-warning badge-sm ml-2">Edited</span>}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        {edited && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => showNote(r.notes, r.workerName, r.date)}
                          >
                            View reason
                          </button>
                        )}
                        <Link
                          className="btn btn-sm border-0 bg-amber-300 hover:bg-amber-200 text-amber-900 shadow-sm"
                          to={`/supervisor/attendance/${r._id}`}
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
