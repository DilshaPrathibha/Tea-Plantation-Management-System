// Copied from NEWPAGES
// ...existing code from NEWPAGES/FRONTEND/src/pages/FNIPage.jsx...


import React, { useState, useEffect } from 'react';
import { Download, Printer } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Navbar from '@/components/Navbar';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { listItems, deleteItem } from '@/api/fni';
import FNIAdjustModal from '@/components/FNIAdjustModal';

const CEYLONLEAF_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
     fill="none" stroke="#22C55E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
</svg>
`;

const svgToPngDataUrl = (svgMarkup, targetPx = 28) =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
    img.decoding = 'async';
    img.onload = () => {
      const scale = targetPx / (img.width || 28);
      const w = Math.max(1, Math.round((img.width || 28) * scale));
      const h = Math.max(1, Math.round((img.height || 28) * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgMarkup);
    img.src = svgDataUrl;
  });

export default function FNIPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const navigate = useNavigate();

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category) params.category = category;
      if (search) params.q = search;
      const res = await listItems(params);
      setItems(res.data);
    } catch (err) {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [category, search]);

  const handleDelete = async (item) => {
    if (item.qtyOnHand > 0) {
      return toast.error('Cannot delete: qtyOnHand > 0');
    }
    if (!window.confirm('Delete this item?')) return;
    try {
      await deleteItem(item._id);
      toast.success('Item deleted');
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // Export CSV
  const exportCSV = () => {
    const rows = [
      ['Name', 'Category', 'Unit', 'Qty On Hand', 'Min Qty', 'Note'],
      ...items.map(i => [
        i.name,
        i.category,
        i.unit,
        i.qtyOnHand,
        i.minQty,
        i.note
      ])
    ];
    const csv = rows.map(r => r.map(x => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fni_items.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export PDF
  const exportPDF = async () => {
    const win = window.open('', '_blank');
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const left = 40;
      const right = pageWidth - 40;

      // Header: Logo + "CeylonLeaf" + date/time
      const logoPng = await svgToPngDataUrl(CEYLONLEAF_SVG, 18);
      const logoW = 20;
      const logoH = 20;
      const headerTop = 48;
      const brandBaselineY = headerTop;
      doc.addImage(
        logoPng,
        'PNG',
        left,
        brandBaselineY - logoH * 0.75,
        logoW,
        logoH
      );
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(34, 197, 94);
      doc.text('CeylonLeaf', left + logoW + 8, brandBaselineY);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      const dateStr = `Generated on ${new Date().toLocaleString()}`;
      const dateWidth = doc.getTextWidth(dateStr);
      doc.text(dateStr, right - dateWidth, brandBaselineY - 8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      const reportTitle = 'FNI Inventory Report';
      const titleWidth = doc.getTextWidth(reportTitle);
      const titleY = headerTop + 20;
      doc.text(reportTitle, (pageWidth - titleWidth) / 2, titleY);

      // Table
      const body = (Array.isArray(items) ? items : []).map(i => [
        i.name || '-',
        i.category || '-',
        i.unit || '-',
        i.qtyOnHand ?? '-',
        i.minQty ?? '-',
        i.note || ''
      ]);
      if (body.length === 0) body.push(['-', '-', '-', '-', '-', '-']);

      autoTable(doc, {
        head: [['Name', 'Category', 'Unit', 'Qty On Hand', 'Min Qty', 'Note']],
        body,
        startY: titleY + 16,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [34, 197, 94], textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [240, 253, 244] },
        margin: { left: 40, right: 40 },
        didParseCell: function (data) {
          // Qty On Hand column index is 3
          if (data.section === 'body' && data.column.index === 3) {
            const qty = Number(data.cell.raw);
            const minQty = Number(data.row.raw[4]);
            if (!isNaN(qty) && !isNaN(minQty) && qty < minQty) {
              data.cell.styles.textColor = [220, 38, 38]; // Tailwind red-600
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });

      const url = doc.output('bloburl');
      if (win) win.location.href = url;
      else window.open(url, '_blank');
    } catch (e) {
      console.error(e);
      if (win) win.document.body.innerHTML = '<p style="font-family:sans-serif">Failed to generate PDF.</p>';
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      <div className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
          <input
            className="input input-bordered w-full md:w-64"
            placeholder="Search FNI items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="select select-bordered w-full md:w-40" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="fertilizer">Fertilizer</option>
            <option value="insecticide">Insecticide</option>
          </select>
          <button className="btn btn-outline gap-2" onClick={exportCSV}><Download size={16}/> Export CSV</button>
          <button className="btn btn-outline gap-2" onClick={exportPDF}><Printer size={16}/> Export PDF</button>
          <button className="btn btn-primary ml-auto" onClick={() => navigate('/fni/create')}>+ New</button>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => {
              const isLow = Number(item.qtyOnHand) < Number(item.minQty);
              return (
                <div
                  key={item._id}
                  className={`card shadow-md p-4 ${isLow ? 'bg-red-900/70 border border-red-700' : 'bg-base-100'}`}
                >
                  <div className="font-bold text-lg mb-1">{item.name}</div>
                  <div className="mb-1 text-base-content/70">{item.category} &bull; {item.unit}</div>
                  <div className="mb-1">
                    Qty on hand: <span className={`font-semibold ${isLow ? 'text-red-600' : ''}`}>{item.qtyOnHand}</span>
                  </div>
                  {item.minQty > 0 && (
                    <div className="mb-1">Min Qty: <span className="font-semibold">{item.minQty}</span></div>
                  )}
                  <div className="mb-2 text-sm text-base-content/70">{item.note}</div>
                  <div className="flex gap-2">
                    <button className="btn btn-sm btn-neutral" onClick={() => { setAdjustItem(item); setAdjustOpen(true); }}>Adjust</button>
                    <button className="btn btn-sm btn-warning" onClick={() => navigate(`/fni/${item._id}/edit`)}>Edit</button>
                    <button className="btn btn-sm btn-error" onClick={() => handleDelete(item)}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <FNIAdjustModal
          open={adjustOpen}
          onClose={() => setAdjustOpen(false)}
          item={adjustItem}
          onDone={fetchItems}
        />
      </div>
    </div>
  );
}
