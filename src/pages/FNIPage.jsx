import React, { useState, useEffect } from 'react';
import { Download, Printer, CandlestickChart, Pencil, Trash, Package, Leaf, Bug, TrendingDown, DollarSign } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sweet, Toast } from '../utils/sweet';
import { useNavigate } from 'react-router-dom';
import { listItems, deleteItem } from '../api/fni';
import FNIAdjustModal from '../components/FNIAdjustModal';

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
  // Summary metrics (after items is defined)
  const totalItems = items.length;
  const lowStockCount = items.filter(i => Number(i.qtyOnHand) < Number(i.minQty)).length;
  const sumTotalValue = items.reduce((sum, i) => {
    if (Array.isArray(i.batches) && i.batches.length > 0) {
      return sum + i.batches.reduce((s, b) => s + (b.qty * b.unitCost), 0);
    }
    return sum;
  }, 0);

  // Calculate fertilizer and insecticide quantities by unit
  const fertilizerKg = items.filter(i => i.category === 'fertilizer' && i.unit === 'kg').reduce((sum, i) => sum + (Number(i.qtyOnHand) || 0), 0);
  const fertilizerL = items.filter(i => i.category === 'fertilizer' && i.unit === 'L').reduce((sum, i) => sum + (Number(i.qtyOnHand) || 0), 0);
  const insecticideKg = items.filter(i => i.category === 'insecticide' && i.unit === 'kg').reduce((sum, i) => sum + (Number(i.qtyOnHand) || 0), 0);
  const insecticideL = items.filter(i => i.category === 'insecticide' && i.unit === 'L').reduce((sum, i) => sum + (Number(i.qtyOnHand) || 0), 0);
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
      Toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [category, search]);

  const handleDelete = async (item) => {
    if (item.qtyOnHand > 0) {
      return Sweet.error('You cannot delete this item while there is stock remaining.');
    }
    const ok = await Sweet.confirm('Delete this item?');
    if (!ok) return;
    try {
      await deleteItem(item._id);
      Toast.success('Item deleted');
      fetchItems();
    } catch (err) {
      Toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // Export CSV
  const exportCSV = () => {
    const rows = [
      ['Name', 'Category', 'Unit', 'Qty On Hand', 'Min Qty', 'Avg Cost', 'Total Value', 'Note'],
      ...items.map(i => {
        let avgCost = 0, totalValue = 0, totalQty = 0;
        if (Array.isArray(i.batches) && i.batches.length > 0) {
          totalValue = i.batches.reduce((sum, b) => sum + (b.qty * b.unitCost), 0);
          totalQty = i.batches.reduce((sum, b) => sum + b.qty, 0);
          avgCost = totalQty > 0 ? (totalValue / totalQty) : 0;
        }
        return [
          i.name,
          i.category,
          i.unit,
          i.qtyOnHand,
          i.minQty,
          avgCost.toFixed(2),
          totalValue.toFixed(2),
          i.note
        ];
      })
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

      // FNI summary metrics
      const summaryRows = [
        [
          { content: `Total Items:`, styles: { textColor: [30, 41, 59], fontStyle: 'bold' } },
          { content: `Fertilizer:`, styles: { textColor: [0, 0, 0], fontStyle: 'bold' } },
          { content: `Insecticide:`, styles: { textColor: [0, 0, 0], fontStyle: 'bold' } },
          { content: `Low Stock:`, styles: { textColor: [220, 38, 38], fontStyle: 'bold' } },
          { content: `Total Value:`, styles: { textColor: [0, 0, 0], fontStyle: 'bold' } }
        ],
        [
          { content: `${totalItems}`, styles: { textColor: [0, 0, 0], fontStyle: 'bold' } },
          { content: `${fertilizerKg} kg, ${fertilizerL} L`, styles: { textColor: [0, 0, 0], fontStyle: 'bold' } },
          { content: `${insecticideKg} kg, ${insecticideL} L`, styles: { textColor: [0, 0, 0], fontStyle: 'bold' } },
          { content: `${lowStockCount}`, styles: { textColor: [220, 38, 38], fontStyle: 'bold' } },
          { content: `${sumTotalValue.toFixed(2)}`, styles: { textColor: [0, 0, 0], fontStyle: 'bold' } }
        ]
      ];
      autoTable(doc, {
        body: summaryRows,
        startY: titleY + 12,
        theme: 'plain',
        styles: { fontSize: 11, fontStyle: 'bold', cellPadding: { top: 1, bottom: 1, left: 2, right: 2 } },
        margin: { left: 40, right: 40 },
        didDrawCell: function (data) {
          data.cell.height = 16;
        }
      });

      // Table
      const body = (Array.isArray(items) ? items : []).map(i => {
        let avgCost = 0, totalValue = 0, totalQty = 0;
        if (Array.isArray(i.batches) && i.batches.length > 0) {
          totalValue = i.batches.reduce((sum, b) => sum + (b.qty * b.unitCost), 0);
          totalQty = i.batches.reduce((sum, b) => sum + b.qty, 0);
          avgCost = totalQty > 0 ? (totalValue / totalQty) : 0;
        }
        return [
          i.name || '-',
          i.category || '-',
          i.unit || '-',
          i.qtyOnHand ?? '-',
          i.minQty ?? '-',
          avgCost.toFixed(2),
          totalValue.toFixed(2),
          i.note || ''
        ];
      });
      if (body.length === 0) body.push(['-', '-', '-', '-', '-', '-', '-', '-']);

      autoTable(doc, {
        head: [['Name', 'Category', 'Unit', 'Qty On Hand', 'Min Qty', 'Avg Cost', 'Total Value', 'Note']],
        body,
        startY: doc.lastAutoTable.finalY + 10,
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
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Search, filters, and action buttons row */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
            <input
              className="input input-bordered w-full sm:w-64"
              placeholder="Search FNI items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="select select-bordered w-full sm:w-40" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              <option value="fertilizer">Fertilizer</option>
              <option value="insecticide">Insecticide</option>
            </select>
            
            {/* Export buttons right after filters */}
            <button className="btn btn-outline btn-sm sm:btn-md gap-2 flex-1 sm:flex-none" onClick={exportCSV}>
              <Download size={16}/>
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
            </button>
            <button className="btn btn-outline btn-sm sm:btn-md gap-2 flex-1 sm:flex-none" onClick={exportPDF}>
              <Printer size={16}/>
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
            
            {/* Add Items button stays on the right */}
            <button className="btn btn-primary btn-sm sm:btn-md w-full sm:w-auto sm:ml-auto" onClick={() => navigate('/inventory/fni/create')}>
              <span className="sm:hidden">+ Item</span>
              <span className="hidden sm:inline">+ Add Items</span>
            </button>
          </div>
        </div>

        {/* FNI Summary Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4 bg-base-100 rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="text-center p-2 sm:p-0">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Package className="w-4 h-4 text-base-content/60" />
              <div className="text-xs text-base-content/60">Total Items</div>
            </div>
            <div className="font-bold text-base sm:text-lg">{totalItems}</div>
          </div>
          <div className="text-center p-2 sm:p-0">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Leaf className="w-4 h-4 text-success" />
              <div className="text-xs text-base-content/60">Fertilizer Available</div>
            </div>
            <div className="font-bold text-xs sm:text-base lg:text-lg text-success">{fertilizerKg} kg, {fertilizerL} L</div>
          </div>
          <div className="text-center p-2 sm:p-0">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Bug className="w-4 h-4 text-info" />
              <div className="text-xs text-base-content/60">Insecticide Available</div>
            </div>
            <div className="font-bold text-xs sm:text-base lg:text-lg text-info">{insecticideKg} kg, {insecticideL} L</div>
          </div>
          <div className="text-center p-2 sm:p-0">
            <div className="flex items-center justify-center gap-1 mb-2">
              <TrendingDown className="w-4 h-4 text-error" />
              <div className="text-xs text-base-content/60">Low Stock Items</div>
            </div>
            <div className="font-bold text-base sm:text-lg text-error">{lowStockCount}</div>
          </div>
          <div className="text-center p-2 sm:p-0">
            <div className="flex items-center justify-center gap-1 mb-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <div className="text-xs text-base-content/60">Total Inventory Value</div>
            </div>
            <div className="font-bold text-xs sm:text-base lg:text-lg text-primary">LKR {sumTotalValue.toFixed(2)}</div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {items.map(item => {
              const isLow = Number(item.qtyOnHand) < Number(item.minQty);
              // Calculate average cost and total value from batches
              let avgCost = 0, totalValue = 0, totalQty = 0;
              if (Array.isArray(item.batches) && item.batches.length > 0) {
                totalValue = item.batches.reduce((sum, b) => sum + (b.qty * b.unitCost), 0);
                totalQty = item.batches.reduce((sum, b) => sum + b.qty, 0);
                avgCost = totalQty > 0 ? (totalValue / totalQty) : 0;
              }
              return (
                <div
                  key={item._id}
                  className={`card shadow-md p-3 sm:p-4 ${isLow ? 'bg-red-900/70 border border-red-700' : 'bg-base-100'}`}
                >
                  <div className="font-bold text-base sm:text-lg mb-1">{item.name}</div>
                  <div className="mb-1 text-sm text-base-content/70">{item.category} &bull; {item.unit}</div>
                  <div className="mb-1 text-sm">
                    Qty on hand: <span className={`font-semibold ${isLow ? 'text-red-600' : ''}`}>{item.qtyOnHand}</span>
                  </div>
                  {item.minQty > 0 && (
                    <div className="mb-1 text-sm">Min Qty: <span className="font-semibold">{item.minQty}</span></div>
                  )}
                  <div className="mb-1 text-sm">Avg Cost: <span className="font-semibold">{avgCost.toFixed(2)}</span></div>
                  <div className="mb-1 text-sm">Total Value: <span className="font-semibold">{totalValue.toFixed(2)}</span></div>
                  {item.note && (
                    <div className="mb-2 text-xs sm:text-sm text-base-content/70">{item.note}</div>
                  )}
                  {Array.isArray(item.batches) && item.batches.length > 0 && (
                    <details className="mb-2">
                      <summary className="cursor-pointer text-xs text-base-content/60">Batch History</summary>
                      <ul className="text-xs mt-1 max-h-20 overflow-y-auto">
                        {item.batches.map((b, idx) => (
                          <li key={idx} className="mb-0.5">Qty: {b.qty}, Cost: {b.unitCost}, Date: {b.date ? new Date(b.date).toLocaleDateString() : ''}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    <button className="btn btn-xs sm:btn-sm btn-neutral flex-1 min-w-0" onClick={() => { setAdjustItem(item); setAdjustOpen(true); }}>
                      <CandlestickChart size={12} className="sm:mr-1" />
                      <span className="hidden sm:inline">Adjust</span>
                    </button>
                    <button className="btn btn-xs sm:btn-sm btn-warning flex-1 min-w-0" onClick={() => navigate(`/inventory/fni/${item._id}/edit`)}>
                      <Pencil size={12} className="sm:mr-1" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button className="btn btn-xs sm:btn-sm btn-error flex-1 min-w-0" onClick={() => handleDelete(item)}>
                      <Trash size={12} className="sm:mr-1" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
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
