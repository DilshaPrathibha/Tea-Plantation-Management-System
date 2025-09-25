import { useState, useEffect, useCallback } from 'react';
import { listItems } from '../api/fni';
import { Toast } from '../utils/sweet';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const CEYLONLEAF_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
     fill="none" stroke="#22C55E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
</svg>
`;

const svgToPngDataUrl = (svgMarkup, targetPx = 28) =>
  new Promise((resolve, reject) => {
    const img = new Image();
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

const useFNIStats = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    fertilizers: 0,
    insecticides: 0,
    fertilizerQty: 0,
    insecticideQty: 0
  });
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listItems();
      const itemsData = response.data || [];
      setItems(itemsData);
      
      const totalItems = itemsData.length;
      const lowStockItems = itemsData.filter(item => 
        Number(item.qtyOnHand) <= Number(item.minQty) && Number(item.minQty) > 0
      ).length;
      
      const fertilizers = itemsData.filter(item => item.category === 'fertilizer').length;
      const insecticides = itemsData.filter(item => item.category === 'insecticide').length;
      
      const fertilizerQty = itemsData
        .filter(item => item.category === 'fertilizer')
        .reduce((sum, item) => sum + (Number(item.qtyOnHand) || 0), 0);
      
      const insecticideQty = itemsData
        .filter(item => item.category === 'insecticide')
        .reduce((sum, item) => sum + (Number(item.qtyOnHand) || 0), 0);

      const totalInventoryValue = itemsData.reduce((sum, item) => {
        if (Array.isArray(item.batches) && item.batches.length > 0) {
          return sum + item.batches.reduce((batchSum, batch) => batchSum + (batch.qty * batch.unitCost), 0);
        }
        return sum;
      }, 0);

      setStats({
        totalItems,
        lowStockItems,
        fertilizers,
        insecticides,
        fertilizerQty,
        insecticideQty,
        totalInventoryValue,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch FNI statistics');
      Toast.error('Failed to load FNI statistics');
      setStats(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to fetch FNI statistics'
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, [fetchStats]);

  const refreshStats = () => {
    fetchStats();
  };

  const exportCSV = () => {
    if (items.length === 0) {
      Toast.warning('No FNI items to export');
      return;
    }

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
          `LKR ${avgCost.toFixed(2)}`,
          `LKR ${totalValue.toFixed(2)}`,
          i.note
        ];
      })
    ];
    const csv = rows.map(r => r.map(x => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fni_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    Toast.success('FNI report exported to CSV');
  };

  const exportPDF = async () => {
    if (items.length === 0) {
      Toast.warning('No FNI items to export');
      return;
    }

    const win = window.open('', '_blank');
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const left = 40;
      const right = pageWidth - 40;

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
      const brandText = 'CeylonLeaf';
      doc.text(brandText, left + logoW + 8, brandBaselineY);

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

      autoTable(doc, {
        body: [[
          { content: `Total Items: ${stats.totalItems}`, styles: { textColor: [30, 41, 59] } },
          { content: `Fertilizers: ${stats.fertilizers}`, styles: { textColor: [34, 197, 94] } },
          { content: `Insecticides: ${stats.insecticides}`, styles: { textColor: [59, 130, 246] } },
          { content: `Low Stock: ${stats.lowStockItems}`, styles: { textColor: [220, 38, 38] } }
        ]],
        startY: titleY + 12,
        theme: 'plain',
        styles: { fontSize: 11, fontStyle: 'bold' },
        margin: { left: 40, right: 40 },
      });

      const body = (Array.isArray(items) ? items : []).map(i => {
        let avgCost = 0, totalValue = 0, totalQty = 0;
        if (Array.isArray(i.batches) && i.batches.length > 0) {
          totalValue = i.batches.reduce((sum, b) => sum + (b.qty * b.unitCost), 0);
          totalQty = i.batches.reduce((sum, b) => sum + b.qty, 0);
          avgCost = totalQty > 0 ? (totalValue / totalQty) : 0;
        }
        return [
          i.name || '-',
          i.category || '',
          i.unit || '',
          i.qtyOnHand || '0',
          i.minQty || '0',
          `LKR ${avgCost.toFixed(2)}`,
          `LKR ${totalValue.toFixed(2)}`,
          i.note || ''
        ];
      });
      if (body.length === 0) body.push(['-', '-', '-', '-', '-', '-', '-', '-']);

      autoTable(doc, {
        head: [['Name', 'Category', 'Unit', 'Qty On Hand', 'Min Qty', 'Avg Cost', 'Total Value', 'Notes']],
        body,
        startY: doc.lastAutoTable.finalY + 10,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [34, 197, 94], textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [240, 253, 244] },
        margin: { left: 40, right: 40 },
        columnStyles: {
          4: { minCellWidth: 60 }
        },
        didParseCell: function (data) {
          if (data.section === 'body' && data.column.index === 3) {
            const qtyOnHand = Number(data.cell.raw);
            const minQty = Number(body[data.row.index][4]);
            if (qtyOnHand <= minQty && minQty > 0) {
              data.cell.styles.textColor = [220, 38, 38];
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

  return {
    ...stats,
    items,
    isLoading,
    error,
    refreshStats,
    exportCSV,
    exportPDF
  };
};

export default useFNIStats;