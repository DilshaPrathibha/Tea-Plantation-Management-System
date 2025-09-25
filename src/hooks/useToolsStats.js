import { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';            
import autoTable from 'jspdf-autotable';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// === helpers: inline SVG -> PNG dataURL (so jsPDF can embed it) ===
const CEYLONLEAF_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
     fill="none" stroke="#22C55E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
</svg>
`;

// Convert the inline SVG to a PNG data URL using an offscreen canvas
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

const useToolsStats = () => {
  const [stats, setStats] = useState({
    totalTools: 0,
    availableTools: 0,
    assignedTools: 0,
    needsRepairTools: 0,
    uniqueTypes: 0,
    isLoading: true,
    error: null,
    lastUpdated: null
  });
  
  const [tools, setTools] = useState([]);

  const fetchTools = async () => {
    try {
      setStats(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await api.get('/tools');
      const toolsData = response.data || [];
      setTools(toolsData);
      
      // Calculate statistics
      const totalTools = toolsData.length;
      const availableTools = toolsData.filter(t => t.status === 'available').length;
      const assignedTools = toolsData.filter(t => t.status === 'assigned').length;
      const needsRepairTools = toolsData.filter(t => String(t.condition).toLowerCase() === 'needs_repair').length;
      const uniqueTypes = Array.from(new Set(toolsData.map(t => t.toolType))).length;
      
      setStats({
        totalTools,
        availableTools,
        assignedTools,
        needsRepairTools,
        uniqueTypes,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error fetching tools:', error);
      setStats(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to fetch tools data'
      }));
    }
  };

  const exportCSV = () => {
    if (tools.length === 0) return;
    
    const headers = ['Tool ID', 'Type', 'Assigned To', 'Condition', 'Status', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...tools.map(tool => [
        tool.toolId || '',
        tool.toolType || '',
        tool.assignedTo?.name || 'Unassigned',
        tool.condition || '',
        tool.status || '',
        `"${(tool.notes || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tools_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportPDF = async () => {
    if (tools.length === 0) return;
    
    const win = window.open('', '_blank');
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const left = 40;
      const right = pageWidth - 40;

      // --- Header: Logo + "CeylonLeaf" on left, date/time on right ---
      // Align the logo to the same baseline as the brand text
      const logoPng = await svgToPngDataUrl(CEYLONLEAF_SVG, 18); // 18pt for better baseline alignment
      const logoW = 20; // pts
      const logoH = 20; // pts
      const headerTop = 48; // baseline for brand text
      const brandBaselineY = headerTop;

      // Draw logo so its vertical center aligns with the text baseline
      doc.addImage(
        logoPng,
        'PNG',
        left,
        brandBaselineY - logoH * 0.75, // tweak to visually center with text
        logoW,
        logoH
      );

      // Brand text next to logo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(34, 197, 94); // #22C55E
      const brandText = 'CeylonLeaf';
      doc.text(brandText, left + logoW + 8, brandBaselineY);

      // Reset text color for the rest
      doc.setTextColor(0, 0, 0);

      // Date/time on the right
      doc.setFontSize(10);
      const dateStr = `Generated on ${new Date().toLocaleString()}`;
      const dateWidth = doc.getTextWidth(dateStr);
      doc.text(dateStr, right - dateWidth, brandBaselineY - 8);

      // Report Title centered under header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      const reportTitle = 'Tool Inventory Report';
      const titleWidth = doc.getTextWidth(reportTitle);
      const titleY = headerTop + 20;
      doc.text(reportTitle, (pageWidth - titleWidth) / 2, titleY);

      // Render summary as a table below the title, with custom colors
      autoTable(doc, {
        body: [[
          { content: `Total Tools: ${stats.totalTools}`, styles: { textColor: [30, 41, 59] } },
          { content: `Available: ${stats.availableTools}`, styles: { textColor: [34, 197, 94] } }, // green
          { content: `Assigned: ${stats.assignedTools}`, styles: { textColor: [202, 138, 4] } }, // yellow
          { content: `Needs Repair: ${stats.needsRepairTools}`, styles: { textColor: [220, 38, 38] } }, // red
          { content: `Tool Types: ${stats.uniqueTypes}`, styles: { textColor: [30, 41, 59] } }
        ]],
        startY: titleY + 12,
        theme: 'plain',
        styles: { fontSize: 11, fontStyle: 'bold' },
        margin: { left: 40, right: 40 },
      });

      // Table
      const body = (Array.isArray(tools) ? tools : []).map(t => [
        t.toolId || '-',
        t.toolType || '',
        t.assignedTo?.name || 'Unassigned',
        t.condition === 'needs_repair' ? 'needs repair' : (t.condition || ''),
        t.status || '',
        t.note || ''
      ]);
      if (body.length === 0) body.push(['-', '-', '-', '-', '-', '-']);

      autoTable(doc, {
        head: [['Tool ID', 'Type', 'Assigned To', 'Condition', 'Status', 'Notes']],
        body,
        startY: doc.lastAutoTable.finalY + 10,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [34, 197, 94], textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [240, 253, 244] },
        margin: { left: 40, right: 40 },
        columnStyles: {
          3: { minCellWidth:  70} //min width for Condition'
        },
        didParseCell: function (data) {
          // Condition column index is 3
          if (data.section === 'body' && data.column.index === 3) {
            if (data.cell.raw === 'needs repair') {
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

  useEffect(() => {
    fetchTools();
    
    // Refresh data every 30 seconds for live updates
    const interval = setInterval(fetchTools, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    ...stats,
    tools,
    refreshStats: fetchTools,
    exportCSV,
    exportPDF
  };
};

export default useToolsStats;