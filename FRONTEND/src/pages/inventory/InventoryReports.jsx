import React, { useState, useEffect } from 'react';
import { BarChart2, Printer, Wrench, FlaskConical } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import useToolsStats from '../../hooks/useToolsStats';
import useFNIStats from '../../hooks/useFNIStats';
import { listItems } from '../../api/fni';
import { Toast } from '../../utils/sweet';

// === helpers: inline SVG -> PNG dataURL (so jsPDF can embed it) ===
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

const InventoryReports = () => {
  const { exportPDF: exportToolsPDF, isLoading: toolsLoading } = useToolsStats();
  const { exportPDF: exportFNIPDF, isLoading: fniLoading } = useFNIStats();
  
  const [fniItems, setFniItems] = useState([]);
  const [fniReportLoading, setFniReportLoading] = useState(false);

  // Fetch FNI items for direct PDF generation
  const fetchFNIItems = async () => {
    try {
      const res = await listItems({});
      setFniItems(res.data);
    } catch (err) {
      console.error('Failed to load FNI items for report:', err);
    }
  };

  useEffect(() => {
    fetchFNIItems();
  }, []);

  // Generate FNI PDF Report (same as FNI Page)
  const generateFNIReport = async () => {
    setFniReportLoading(true);
    const win = window.open('', '_blank');
    try {
      // Calculate metrics from fniItems
      const totalItems = fniItems.length;
      const lowStockCount = fniItems.filter(i => Number(i.qtyOnHand) < Number(i.minQty)).length;
      const sumTotalValue = fniItems.reduce((sum, i) => {
        if (Array.isArray(i.batches) && i.batches.length > 0) {
          return sum + i.batches.reduce((s, b) => s + (b.qty * b.unitCost), 0);
        }
        return sum;
      }, 0);

      // Calculate fertilizer and insecticide quantities by unit
      const fertilizerKg = fniItems.filter(i => i.category === 'fertilizer' && i.unit === 'kg').reduce((sum, i) => sum + (Number(i.qtyOnHand) || 0), 0);
      const fertilizerL = fniItems.filter(i => i.category === 'fertilizer' && i.unit === 'L').reduce((sum, i) => sum + (Number(i.qtyOnHand) || 0), 0);
      const insecticideKg = fniItems.filter(i => i.category === 'insecticide' && i.unit === 'kg').reduce((sum, i) => sum + (Number(i.qtyOnHand) || 0), 0);
      const insecticideL = fniItems.filter(i => i.category === 'insecticide' && i.unit === 'L').reduce((sum, i) => sum + (Number(i.qtyOnHand) || 0), 0);

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
          { content: `LKR ${sumTotalValue.toFixed(2)}`, styles: { textColor: [0, 0, 0], fontStyle: 'bold' } }
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
      const body = (Array.isArray(fniItems) ? fniItems : []).map(i => {
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
      Toast.error('Failed to generate FNI PDF report');
      if (win) win.document.body.innerHTML = '<p style="font-family:sans-serif">Failed to generate PDF.</p>';
    } finally {
      setFniReportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100">Inventory Reports</h1>
          <p className="text-gray-400">Generate comprehensive PDF reports for Tools and FNI (Fertilizers & Insecticides) inventory systems.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Tools Management Report */}
          <div className="bg-base-100 p-6 rounded-lg shadow border border-gray-700">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-900 text-orange-200 flex items-center justify-center mr-4">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Tools Management Report</h2>
                <p className="text-gray-400 text-sm">Complete tools inventory and statistics</p>
              </div>
            </div>
            <p className="text-gray-400 mb-6">Generate a comprehensive PDF report including all tools inventory, availability status, worker assignments, condition status, and retirement records.</p>
            <button 
              onClick={exportToolsPDF}
              disabled={toolsLoading}
              className="btn btn-outline btn-primary gap-2 w-full"
            >
              <Printer className="w-4 h-4" />
              {toolsLoading ? 'Generating...' : 'Generate Tools PDF Report'}
            </button>
          </div>

          {/* FNI Management Report */}
          <div className="bg-base-100 p-6 rounded-lg shadow border border-gray-700">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-teal-900 text-teal-200 flex items-center justify-center mr-4">
                <FlaskConical className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">FNI Management Report</h2>
                <p className="text-gray-400 text-sm">Fertilizers & Insecticides inventory</p>
              </div>
            </div>
            <p className="text-gray-400 mb-6">Generate a detailed PDF report with all items including fertilizers and insecticides, stock quantities, batch information, and total inventory value in LKR.</p>
            <button 
              onClick={generateFNIReport}
              disabled={fniReportLoading}
              className="btn btn-outline btn-primary gap-2 w-full"
            >
              <Printer className="w-4 h-4" />
              {fniReportLoading ? 'Generating...' : 'Generate FNI PDF Report'}
            </button>
          </div>
        </div>

        {/* Information Section */}
        <div className="bg-base-100 rounded-lg shadow border border-gray-700 p-6">
          <div className="text-center">
            <BarChart2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">PDF Report Generation</h3>
            <p className="text-gray-400 max-w-2xl mx-auto mb-6">
              Generate professional PDF reports for your inventory management systems. 
              These reports include comprehensive data, statistics, and are formatted for easy reading and analysis.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 text-sm max-w-4xl mx-auto">
              <div className="text-left">
                <strong className="text-orange-400 block mb-3">Tools Report includes:</strong>
                <ul className="list-disc list-inside space-y-2 text-gray-400">
                  <li>Complete tools inventory with statistics</li>
                  <li>Availability, assigned, and retired status</li>
                  <li>Worker assignments and unassignments</li>
                  <li>Tool conditions and repair tracking</li>
                </ul>
              </div>
              <div className="text-left">
                <strong className="text-teal-400 block mb-3">FNI Report includes:</strong>
                <ul className="list-disc list-inside space-y-2 text-gray-400">
                  <li>Fertilizers and insecticides inventory</li>
                  <li>Stock quantities and low stock alerts</li>
                  <li>Batch history and cost analysis</li>
                  <li>Total inventory value in LKR</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryReports;