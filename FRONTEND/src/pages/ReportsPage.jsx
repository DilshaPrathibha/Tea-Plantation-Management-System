import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Truck, Package, Download, Eye, Calendar, Users, Scale, Leaf, Trash2 } from 'lucide-react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { format } from 'date-fns';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ReportsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportType, setReportType] = useState('');
  const [previousReports, setPreviousReports] = useState({ production: [], transport: [] });
  const [pluckingRecords, setPluckingRecords] = useState([]);
  const reportRef = useRef();

  useEffect(() => {
    fetchPreviousReports();
    fetchPluckingRecords();
  }, []);

  const fetchPreviousReports = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [productionRes, transportRes] = await Promise.allSettled([
        axios.get(`${API_URL}/api/production-batch-records`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { records: [] } })),
        axios.get(`${API_URL}/api/transport-reports`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { reports: [] } }))
      ]);

      setPreviousReports({
        production: productionRes.status === 'fulfilled' ? productionRes.value.data.records || [] : [],
        transport: transportRes.status === 'fulfilled' ? transportRes.value.data.reports || [] : []
      });
    } catch (error) {
      console.error('Error fetching previous reports:', error);
    }
  };

  const fetchPluckingRecords = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/plucking-records`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPluckingRecords(response.data.items || []);
    } catch (error) {
      console.error('Error fetching plucking records:', error);
    }
  };

  const deleteReport = async (report, type) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      
      if (type === 'production') {
        endpoint = `${API_URL}/api/production-batch-records/${report._id}`;
      } else if (type === 'transport') {
        endpoint = `${API_URL}/api/transport-reports/${report._id}`;
      }

      await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh the reports list
      fetchPreviousReports();
      
      // If the deleted report is currently selected, clear the selection
      if (selectedReport && selectedReport._id === report._id) {
        setSelectedReport(null);
      }

      Swal.fire('Deleted!', 'Report has been deleted.', 'success');
    } catch (error) {
      console.error('Error deleting report:', error);
      Swal.fire('Error', 'Failed to delete report', 'error');
    }
  };

  const downloadPDF = async () => {
    if (!selectedReport) return;
    
    const w = window.open('', '_blank');
    if (!w) {
      Swal.fire({ icon: 'error', title: 'Please allow popups to export.' });
        return;
      }

    const escapeHTML = (s) =>
      String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Generate PDF based on report type
    if (reportType === 'production') {
      generateProductionPDF(w, escapeHTML);
    } else {
      generateTransportPDF(w, escapeHTML);
    }
  };

  const generateProductionPDF = (w, escapeHTML) => {
    const batchPluckingRecords = getBatchPluckingRecords();
    const totalPluckingWeight = batchPluckingRecords.reduce((sum, record) => sum + (record.totalWeight || 0), 0);
    const totalPluckingPayment = batchPluckingRecords.reduce((sum, record) => sum + (record.totalPayment || 0), 0);

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
          grid-template-columns: 1fr 1fr 1fr;
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
        .no-data {
          text-align: center;
          color: #6c757d;
          font-style: italic;
          padding: 20px;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
        }
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

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Production Batch Report - ${selectedReport.batchId}</title>
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
            <div><strong>Generated:</strong> ${format(new Date(), 'PPP p')}</div>
            <div><strong>Report ID:</strong> ${selectedReport.batchId}</div>
            <div><strong>Generated By:</strong> Production Manager</div>
          </div>
        </div>

        <!-- Report Title -->
        <div class="report-title">PRODUCTION BATCH REPORT</div>

        <!-- Batch Information Grid -->
        <div class="details-grid">
          <div class="details-section">
            <div class="details-title">BATCH INFORMATION</div>
            <div class="detail-item">
              <span class="detail-label">Batch ID:</span>
              <span class="detail-value"> ${escapeHTML(selectedReport.batchId)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Supervisor:</span>
              <span class="detail-value"> ${escapeHTML(selectedReport.supervisor)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Field Name:</span>
              <span class="detail-value"> ${escapeHTML(selectedReport.fieldName || 'N/A')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status:</span>
              <span class="detail-value"> ${escapeHTML(selectedReport.status || 'N/A')}</span>
            </div>
          </div>
          
          <div class="details-section">
            <div class="details-title">PRODUCTION DETAILS</div>
            <div class="detail-item">
              <span class="detail-label">Production Date:</span>
              <span class="detail-value"> ${format(new Date(selectedReport.productionDate), 'PPP')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Tea Weight:</span>
              <span class="detail-value"> ${selectedReport.teaWeight} kg</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Quality Grade:</span>
              <span class="detail-value"> ${escapeHTML(selectedReport.qualityGrade)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Notes:</span>
              <span class="detail-value"> ${escapeHTML(selectedReport.notes || 'No notes available')}</span>
            </div>
          </div>
        </div>

        <!-- Daily Plucking Records -->
        <div class="section-title">DAILY PLUCKING RECORDS (${batchPluckingRecords.length})</div>
        
        ${batchPluckingRecords.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Field</th>
                <th>Weight (kg)</th>
                <th>Price/Kg (LKR)</th>
                <th>Total Payment (LKR)</th>
                <th>Workers</th>
                <th>Tea Grade</th>
              </tr>
            </thead>
            <tbody>
              ${batchPluckingRecords.map(record => `
                <tr>
                  <td>${format(new Date(record.date), 'MMM dd, yyyy')}</td>
                  <td>${escapeHTML(record.field)}</td>
                  <td style="text-align: right;">${record.totalWeight}</td>
                  <td style="text-align: right;">${record.dailyPricePerKg?.toFixed(2) || 'N/A'}</td>
                  <td style="text-align: right;">${record.totalPayment?.toFixed(2) || 'N/A'}</td>
                  <td style="text-align: right;">${record.workers?.length || 0}</td>
                  <td>${escapeHTML(record.teaGrade || 'N/A')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Plucking Summary -->
          <div class="summary-box">
            <div class="summary-title">PLUCKING SUMMARY</div>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-value">${batchPluckingRecords.length}</div>
                <div class="summary-label">Total Plucking Days</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">${totalPluckingWeight} kg</div>
                <div class="summary-label">Total Plucked Weight</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">LKR ${totalPluckingPayment.toFixed(2)}</div>
                <div class="summary-label">Total Payments</div>
              </div>
            </div>
          </div>
        ` : `
          <div class="no-data">No daily plucking records found for this batch</div>
        `}

        <!-- Batch Processing Records -->
        ${selectedReport.pluckingRecords && selectedReport.pluckingRecords.length > 0 ? `
          <div class="section-title">BATCH PROCESSING RECORDS</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Field</th>
                <th>Weight (kg)</th>
                <th>Payment (LKR)</th>
                <th>Grade</th>
                <th>Workers</th>
              </tr>
            </thead>
            <tbody>
              ${selectedReport.pluckingRecords.map(record => `
                <tr>
                  <td>${format(new Date(record.date), 'MMM dd, yyyy')}</td>
                  <td>${escapeHTML(record.field)}</td>
                  <td style="text-align: right;">${record.totalWeight}</td>
                  <td style="text-align: right;">${record.totalPayment?.toFixed(2) || 'N/A'}</td>
                  <td>${escapeHTML(record.teaGrade || 'N/A')}</td>
                  <td style="text-align: right;">${record.workerCount || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <!-- Production Summary -->
        <div class="summary-box">
          <div class="summary-title">PRODUCTION SUMMARY</div>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">${selectedReport.teaWeight} kg</div>
              <div class="summary-label">Final Production Weight</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${escapeHTML(selectedReport.qualityGrade)}</div>
              <div class="summary-label">Quality Grade</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${format(new Date(selectedReport.productionDate), 'MMM dd, yyyy')}</div>
              <div class="summary-label">Production Date</div>
            </div>
          </div>
        </div>

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

  const generateTransportPDF = (w, escapeHTML) => {
    const style = `
      <style>
        * { font-family: Arial, Helvetica, sans-serif; }
        body { margin: 0; padding: 20px; background: #ffffff; }
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
          margin-bottom: 30px; 
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 20px;
        }
        .logo-section { 
          display: flex; 
          align-items: center; 
        }
        .truck-icon { 
          width: 24px; 
          height: 24px; 
          margin-right: 10px; 
          display: inline-block;
          color: #3b82f6;
        }
        .company-name { 
          font-size: 24px; 
          font-weight: bold; 
          color: #3b82f6; 
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
          color: #3b82f6;
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
          color: #3b82f6;
          margin: 30px 0 15px 0;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 8px;
        }
        .schedule-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 15px;
          margin: 20px 0;
        }
        .schedule-item {
          text-align: center;
          padding: 15px;
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 8px;
        }
        .schedule-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }
        .schedule-label {
          font-size: 12px;
          color: #6c757d;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .schedule-value {
          font-size: 14px;
          font-weight: bold;
          color: #212529;
        }
        .summary-box {
          background: #dbeafe;
          border: 2px solid #3b82f6;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
        .summary-title {
          font-size: 16px;
          font-weight: bold;
          color: #1e40af;
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
          color: #1e40af;
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
        .status-scheduled { background: #fef3c7; color: #92400e; }
        .status-in-transit { background: #dbeafe; color: #1e40af; }
        .status-delivered { background: #d1fae5; color: #065f46; }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #3b82f6;
          text-align: center;
          font-size: 11px;
          color: #6c757d;
        }
        .footer-company {
          font-weight: bold;
          color: #3b82f6;
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

    const transport = selectedReport.transports?.[0] || {};
    const getStatusClass = (status) => {
      switch(status) {
        case 'scheduled': return 'status-scheduled';
        case 'in-transit': return 'status-in-transit';
        case 'delivered': return 'status-delivered';
        default: return 'status-scheduled';
      }
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Transport Report - ${selectedReport.vehicleId || selectedReport.reportId}</title>
        ${style}
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <div class="logo-section">
            <div class="truck-icon">🚛</div>
            <div class="company-name">CeylonLeaf Tea Estate</div>
          </div>
          <div class="generation-info">
            <div><strong>Generated:</strong> ${format(new Date(), 'PPP p')}</div>
            <div><strong>Report ID:</strong> ${selectedReport.reportId}</div>
            <div><strong>Generated By:</strong> Production Manager</div>
          </div>
        </div>

        <!-- Report Title -->
        <div class="report-title">TRANSPORT MANAGEMENT REPORT</div>

        <!-- Vehicle Information Grid -->
        <div class="details-grid">
          <div class="details-section">
            <div class="details-title">VEHICLE INFORMATION</div>
            <div class="detail-item">
              <span class="detail-label">Vehicle ID:</span>
              <span class="detail-value"> ${escapeHTML(selectedReport.vehicleId || transport.vehicleId || 'N/A')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Vehicle Type:</span>
              <span class="detail-value"> ${escapeHTML(transport.vehicleType || 'N/A')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Driver Name:</span>
              <span class="detail-value"> ${escapeHTML(transport.driverName || 'N/A')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status:</span>
              <span class="detail-value"> 
                <span class="status-badge ${getStatusClass(transport.status)}">${transport.status || 'N/A'}</span>
              </span>
            </div>
          </div>
          
          <div class="details-section">
            <div class="details-title">TRANSPORT DETAILS</div>
            <div class="detail-item">
              <span class="detail-label">Batch ID:</span>
              <span class="detail-value"> ${escapeHTML(transport.batchId || 'N/A')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Destination:</span>
              <span class="detail-value"> ${escapeHTML(transport.destination || 'N/A')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Notes:</span>
              <span class="detail-value"> ${escapeHTML(transport.notes || selectedReport.notes || 'No notes available')}</span>
            </div>
          </div>
        </div>

        <!-- Schedule Information -->
        <div class="section-title">SCHEDULE INFORMATION</div>
        <div class="schedule-grid">
          <div class="schedule-item">
            <div class="schedule-icon">🚀</div>
            <div class="schedule-label">Departure Time</div>
            <div class="schedule-value">
              ${transport.departureTime ? format(new Date(transport.departureTime), 'PPP p') : 'N/A'}
            </div>
          </div>
          <div class="schedule-item">
            <div class="schedule-icon">⏰</div>
            <div class="schedule-label">Estimated Arrival</div>
            <div class="schedule-value">
              ${transport.estimatedArrival ? format(new Date(transport.estimatedArrival), 'PPP p') : 'N/A'}
            </div>
          </div>
          <div class="schedule-item">
            <div class="schedule-icon">✅</div>
            <div class="schedule-label">Actual Arrival</div>
            <div class="schedule-value">
              ${transport.actualArrival ? format(new Date(transport.actualArrival), 'PPP p') : 'Pending'}
            </div>
          </div>
        </div>

        <!-- Summary Statistics -->
        ${selectedReport.summary ? `
          <div class="summary-box">
            <div class="summary-title">SUMMARY STATISTICS</div>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-value">${selectedReport.summary.totalTransports || 0}</div>
                <div class="summary-label">Total Transports</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">${selectedReport.summary.scheduled || 0}</div>
                <div class="summary-label">Scheduled</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">${selectedReport.summary.inTransit || 0}</div>
                <div class="summary-label">In Transit</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">${selectedReport.summary.delivered || 0}</div>
                <div class="summary-label">Delivered</div>
              </div>
            </div>
          </div>
        ` : ''}

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

  const generateProductionReport = async () => {
    setLoading('production');
    try {
      const { value: batchId } = await Swal.fire({
        title: 'Generate Production Report',
        text: 'Enter the Batch ID to generate a detailed production report',
        input: 'text',
        inputLabel: 'Batch ID',
        inputPlaceholder: 'Enter Batch ID (e.g., B0001)',
        inputValidator: (value) => {
          if (!value) {
            return 'You need to enter a Batch ID!';
          }
          if (value.trim().length < 3) {
            return 'Batch ID must be at least 3 characters long!';
          }
        },
        showCancelButton: true,
        confirmButtonText: 'Generate Report',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#22c55e',
        cancelButtonColor: '#6b7280',
        inputAttributes: {
          autocapitalize: 'off',
          autocorrect: 'off'
        },
        customClass: {
          popup: 'swal2-popup-custom',
          input: 'swal2-input-custom'
        }
      });

      if (!batchId) {
        setLoading('');
        return;
      }
      
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/production-batch-records/generate`, 
        { batchId },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000
        }
      );
      
      setSelectedReport(response.data.productionBatchRecord);
      setReportType('production');
      fetchPreviousReports();
    } catch (error) {
      console.error('Error generating production report:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to generate production report';
      
      Swal.fire({
        icon: 'error',
        title: 'Error Generating Report',
        text: errorMessage,
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading('');
    }
  };

  const generateTransportReport = async () => {
    setLoading('transport');
    try {
      const { value: vehicleId } = await Swal.fire({
        title: 'Generate Transport Report',
        text: 'Enter the Vehicle ID to generate a detailed transport report',
        input: 'text',
        inputLabel: 'Vehicle ID',
        inputPlaceholder: 'Enter Vehicle ID (e.g., V001)',
        inputValidator: (value) => {
          if (!value) {
            return 'You need to enter a Vehicle ID!';
          }
          if (value.trim().length < 2) {
            return 'Vehicle ID must be at least 2 characters long!';
          }
        },
        showCancelButton: true,
        confirmButtonText: 'Generate Report',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280',
        inputAttributes: {
          autocapitalize: 'off',
          autocorrect: 'off'
        },
        customClass: {
          popup: 'swal2-popup-custom',
          input: 'swal2-input-custom'
        }
      });

      if (!vehicleId) {
        setLoading('');
        return;
      }
      
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/transport-reports/generate`, 
        { vehicleId },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000
        }
      );
      
      setSelectedReport(response.data.transportReport);
      setReportType('transport');
      fetchPreviousReports();
    } catch (error) {
      console.error('Error generating transport report:', error);
      alert(error.response?.data?.message || 'Failed to generate transport report');
    } finally {
      setLoading('');
    }
  };

  const viewPreviousReport = (report, type) => {
    setSelectedReport(report);
    setReportType(type);
  };

  // Get plucking records for the specific batch
  const getBatchPluckingRecords = () => {
    if (!selectedReport || !pluckingRecords.length) return [];
    
    return pluckingRecords.filter(record => 
      record.field === selectedReport.fieldName &&
      new Date(record.date) <= new Date(selectedReport.productionDate)
    );
  };


  const ProductionReportTemplate = () => {
    const batchPluckingRecords = getBatchPluckingRecords();
    const totalPluckingWeight = batchPluckingRecords.reduce((sum, record) => sum + (record.totalWeight || 0), 0);
    const totalPluckingPayment = batchPluckingRecords.reduce((sum, record) => sum + (record.totalPayment || 0), 0);

    return (
      <div ref={reportRef} className="p-8 bg-white">
        <div className="text-center mb-8 border-b-2 border-green-800 pb-4">
          <h1 className="text-3xl font-bold text-green-900">CEYLONLEAF TEA ESTATE</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mt-2">PRODUCTION BATCH REPORT</h2>
          <p className="text-gray-700 font-medium">Generated on: {format(new Date(), 'PPPP')}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-green-100 p-4 rounded-lg border border-green-300">
            <h3 className="font-semibold text-green-900 text-lg mb-2">BATCH INFORMATION</h3>
            <p className="text-gray-800"><strong>Batch ID:</strong> {selectedReport.batchId}</p>
            <p className="text-gray-800"><strong>Supervisor:</strong> {selectedReport.supervisor}</p>
          </div>
          
          <div className="bg-blue-100 p-4 rounded-lg border border-blue-300">
            <h3 className="font-semibold text-blue-900 text-lg mb-2">PRODUCTION DETAILS</h3>
            <p className="text-gray-800"><strong>Date:</strong> {format(new Date(selectedReport.productionDate), 'PPP')}</p>
            <p className="text-gray-800"><strong>Weight:</strong> {selectedReport.teaWeight} kg</p>
            <p className="text-gray-800"><strong>Grade:</strong> {selectedReport.qualityGrade}</p>
          </div>
        </div>

        {/* Daily Plucking Records Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 border-b-2 border-gray-300 pb-2 text-gray-800 flex items-center">
            <Leaf className="w-6 h-6 mr-2 text-green-600" />
            DAILY PLUCKING RECORDS ({batchPluckingRecords.length})
          </h3>
          
          {batchPluckingRecords.length > 0 ? (
            <>
              <table className="w-full border-collapse border border-gray-400 mb-4">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-400 p-3 font-semibold text-gray-800">Date</th>
                    <th className="border border-gray-400 p-3 font-semibold text-gray-800">Field</th>
                    <th className="border border-gray-400 p-3 font-semibold text-gray-800">Weight (kg)</th>
                    <th className="border border-gray-400 p-3 font-semibold text-gray-800">Price/Kg</th>
                    <th className="border border-gray-400 p-3 font-semibold text-gray-800">Total Payment</th>
                    <th className="border border-gray-400 p-3 font-semibold text-gray-800">Workers</th>
                  </tr>
                </thead>
                <tbody>
                  {batchPluckingRecords.map((record, index) => (
                    <tr key={record._id} className={index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}>
                      <td className="border border-gray-400 p-3">{format(new Date(record.date), 'PPP')}</td>
                      <td className="border border-gray-400 p-3">{record.field}</td>
                      <td className="border border-gray-400 p-3 text-right font-semibold">{record.totalWeight}</td>
                      <td className="border border-gray-400 p-3 text-right">LKR {record.dailyPricePerKg?.toFixed(2)}</td>
                      <td className="border border-gray-400 p-3 text-right">LKR {record.totalPayment?.toFixed(2)}</td>
                      <td className="border border-gray-400 p-3 text-right">{record.workers?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Plucking Records Summary */}
              <div className="bg-yellow-100 p-4 rounded-lg border border-yellow-300">
                <h4 className="font-semibold text-yellow-900 text-lg mb-2">PLUCKING SUMMARY</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-800"><strong>Total Plucking Days:</strong> {batchPluckingRecords.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-800"><strong>Total Plucked Weight:</strong> {totalPluckingWeight} kg</p>
                  </div>
                  <div>
                    <p className="text-gray-800"><strong>Total Payments:</strong> LKR {totalPluckingPayment.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <p className="text-gray-600">No daily plucking records found for this batch</p>
            </div>
          )}
        </div>

        {/* Production Batch Records */}
        {selectedReport.pluckingRecords && selectedReport.pluckingRecords.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 border-b-2 border-gray-300 pb-2 text-gray-800">
              BATCH PROCESSING RECORDS
            </h3>
            <table className="w-full border-collapse border border-gray-400">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-400 p-3 font-semibold text-gray-800">Date</th>
                  <th className="border border-gray-400 p-3 font-semibold text-gray-800">Field</th>
                  <th className="border border-gray-400 p-3 font-semibold text-gray-800">Weight (kg)</th>
                  <th className="border border-gray-400 p-3 font-semibold text-gray-800">Grade</th>
                  <th className="border border-gray-400 p-3 font-semibold text-gray-800">Workers</th>
                </tr>
              </thead>
              <tbody>
                {selectedReport.pluckingRecords.map((record, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}>
                    <td className="border border-gray-400 p-3">{record.date ? format(new Date(record.date), 'PPP') : 'N/A'}</td>
                    <td className="border border-gray-400 p-3">{record.field}</td>
                    <td className="border border-gray-400 p-3 text-right font-semibold">{record.totalWeight}</td>
                    <td className="border border-gray-400 p-3">{record.teaGrade}</td>
                    <td className="border border-gray-400 p-3 text-right">{record.workerCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="bg-amber-100 p-4 rounded-lg border border-amber-300">
          <h3 className="font-semibold text-amber-900 text-lg mb-2">FINAL SUMMARY</h3>
          <div className="grid grid-cols-2 gap-4">
            <p className="text-gray-800"><strong>Batch Status:</strong> <span className="capitalize font-semibold">{selectedReport.status}</span></p>
            <p className="text-gray-800"><strong>Final Weight:</strong> {selectedReport.teaWeight} kg</p>
            <p className="text-gray-800"><strong>Quality Grade:</strong> {selectedReport.qualityGrade}</p>
            <p className="text-gray-800"><strong>Total Production Cost:</strong> LKR {totalPluckingPayment.toFixed(2)}</p>
            {selectedReport.notes && (
              <p className="text-gray-800 col-span-2"><strong>Notes:</strong> {selectedReport.notes}</p>
            )}
          </div>
        </div>

        <div className="text-center mt-8 pt-4 border-t-2 border-green-800">
          <p className="text-gray-700 font-semibold">CeylonLeaf Tea Estate Management System</p>
          <p className="text-sm text-gray-600">Generated on {format(new Date(), 'PPpp')}</p>
        </div>
      </div>
    );
  };


  const TransportReportTemplate = () => (
    <div ref={reportRef} className="p-8 bg-white">
      <div className="text-center mb-8 border-b-2 border-blue-800 pb-4">
        <h1 className="text-3xl font-bold text-blue-900">CEYLONLEAF TEA ESTATE</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mt-2">TRANSPORT MANAGEMENT REPORT</h2>
        <p className="text-gray-700 font-medium">Generated on: {format(new Date(), 'PPPP')}</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-blue-100 p-4 rounded-lg border border-blue-300">
          <h3 className="font-semibold text-blue-900 text-lg mb-2">VEHICLE INFORMATION</h3>
          <p className="text-gray-800"><strong>Vehicle ID:</strong> {selectedReport.vehicleId}</p>
          <p className="text-gray-800"><strong>Vehicle Type:</strong> {selectedReport.transports[0]?.vehicleType}</p>
          <p className="text-gray-800"><strong>Driver:</strong> {selectedReport.transports[0]?.driverName}</p>
        </div>
        
        <div className="bg-green-100 p-4 rounded-lg border border-green-300">
          <h3 className="font-semibold text-green-900 text-lg mb-2">TRANSPORT DETAILS</h3>
          <p className="text-gray-800"><strong>Batch ID:</strong> {selectedReport.transports[0]?.batchId}</p>
          <p className="text-gray-800"><strong>Destination:</strong> {selectedReport.transports[0]?.destination}</p>
          <p className="text-gray-800"><strong>Status:</strong> <span className="capitalize font-semibold">{selectedReport.transports[0]?.status}</span></p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 border-b-2 border-gray-300 pb-2 text-gray-800">
          SCHEDULE INFORMATION
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-200 rounded-lg border border-gray-300">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-700" />
            <p className="text-sm text-gray-700 font-semibold">Departure Time</p>
            <p className="font-bold text-gray-900">
              {selectedReport.transports[0]?.departureTime ? 
                format(new Date(selectedReport.transports[0].departureTime), 'PPP p') : 'N/A'
              }
            </p>
          </div>
          <div className="text-center p-4 bg-gray-200 rounded-lg border border-gray-300">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-orange-700" />
            <p className="text-sm text-gray-700 font-semibold">Estimated Arrival</p>
            <p className="font-bold text-gray-900">
              {selectedReport.transports[0]?.estimatedArrival ? 
                format(new Date(selectedReport.transports[0].estimatedArrival), 'PPP p') : 'N/A'
              }
            </p>
          </div>
          <div className="text-center p-4 bg-gray-200 rounded-lg border border-gray-300">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-green-700" />
            <p className="text-sm text-gray-700 font-semibold">Actual Arrival</p>
            <p className="font-bold text-gray-900">
              {selectedReport.transports[0]?.actualArrival ? 
                format(new Date(selectedReport.transports[0].actualArrival), 'PPP p') : 'Pending'
              }
            </p>
          </div>
        </div>
      </div>

      {selectedReport.summary && (
        <div className="bg-amber-100 p-4 rounded-lg border border-amber-300 mb-8">
          <h3 className="font-semibold text-amber-900 text-lg mb-4">SUMMARY STATISTICS</h3>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="bg-white p-3 rounded border">
              <p className="text-2xl font-bold text-blue-800">{selectedReport.summary.totalTransports || 0}</p>
              <p className="text-sm text-gray-700 font-semibold">Total Transports</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-2xl font-bold text-orange-800">{selectedReport.summary.scheduled || 0}</p>
              <p className="text-sm text-gray-700 font-semibold">Scheduled</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-2xl font-bold text-yellow-800">{selectedReport.summary.inTransit || 0}</p>
              <p className="text-sm text-gray-700 font-semibold">In Transit</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-2xl font-bold text-green-800">{selectedReport.summary.delivered || 0}</p>
              <p className="text-sm text-gray-700 font-semibold">Delivered</p>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mt-8 pt-4 border-t-2 border-blue-800">
        <p className="text-gray-700 font-semibold">CeylonLeaf Tea Estate Transport Management</p>
        <p className="text-sm text-gray-600">Report ID: {selectedReport.reportId} | Generated on {format(new Date(), 'PPpp')}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-base-200">
      <style jsx>{`
        .swal2-popup-custom {
          border-radius: 12px !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
        }
        .swal2-input-custom {
          border-radius: 8px !important;
          border: 2px solid #e5e7eb !important;
          padding: 12px 16px !important;
          font-size: 16px !important;
          transition: all 0.2s ease !important;
        }
        .swal2-input-custom:focus {
          border-color: #22c55e !important;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1) !important;
          outline: none !important;
        }
        .swal2-title {
          color: #1f2937 !important;
          font-weight: 600 !important;
        }
        .swal2-html-container {
          color: #6b7280 !important;
        }
      `}</style>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Reports Dashboard</h1>
        
        {/* Report Generation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-base-100 p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <Package className="w-8 h-8 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold">Production Reports</h2>
            </div>
            <p className="text-gray-600 mb-4">Generate detailed production batch reports with plucking records.</p>
            <button 
              onClick={generateProductionReport}
              disabled={loading === 'production'}
              className="btn btn-primary"
            >
              {loading === 'production' ? 'Generating...' : 'Generate Production Report'}
            </button>
          </div>

          <div className="bg-base-100 p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <Truck className="w-8 h-8 text-green-600 mr-3" />
              <h2 className="text-xl font-semibold">Transport Reports</h2>
            </div>
            <p className="text-gray-600 mb-4">Generate comprehensive transport management reports.</p>
            <button 
              onClick={generateTransportReport}
              disabled={loading === 'transport'}
              className="btn btn-primary"
            >
              {loading === 'transport' ? 'Generating...' : 'Generate Transport Report'}
            </button>
          </div>
        </div>

        {/* Previous Reports Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Production Reports */}
          <div className="bg-base-100 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-blue-600" />
              Production Reports
            </h3>
            {previousReports.production.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No production reports yet</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {previousReports.production.map((report) => (
                  <div key={report._id} className="bg-base-200 p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{report.batchId}</p>
                      <p className="text-sm text-gray-600">
                        {report.productionDate ? format(new Date(report.productionDate), 'PP') : 'No date'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewPreviousReport(report, 'production')}
                        className="btn btn-sm btn-ghost"
                        title="View Report"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteReport(report, 'production')}
                        className="btn btn-sm btn-ghost text-error"
                        title="Delete Report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transport Reports */}
          <div className="bg-base-100 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Truck className="w-5 h-5 mr-2 text-green-600" />
              Transport Reports
            </h3>
            {previousReports.transport.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No transport reports yet</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {previousReports.transport.map((report) => (
                  <div key={report._id} className="bg-base-200 p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{report.reportId}</p>
                      <p className="text-sm text-gray-600">
                        {report.vehicleId} • {report.generatedDate ? format(new Date(report.generatedDate), 'PP') : 'No date'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewPreviousReport(report, 'transport')}
                        className="btn btn-sm btn-ghost"
                        title="View Report"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteReport(report, 'transport')}
                        className="btn btn-sm btn-ghost text-error"
                        title="Delete Report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Report Preview Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-base-100 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold">
                  {reportType === 'production' ? 'Production Report' : 'Transport Report'}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={downloadPDF}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => deleteReport(selectedReport, reportType)}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                {reportType === 'production' ? (
                  <ProductionReportTemplate />
                ) : (
                  <TransportReportTemplate />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;