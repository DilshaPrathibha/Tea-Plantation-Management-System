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
    try {
      const element = reportRef.current;
      if (!element) {
        alert('Report content not available for download');
        return;
      }

      // Create a temporary container for PDF generation
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.appendChild(element.cloneNode(true));
      document.body.appendChild(tempContainer);

      const opt = {
        margin: 10,
        filename: `${reportType}-report-${selectedReport.reportId || selectedReport.batchId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(tempContainer).save();
      document.body.removeChild(tempContainer);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const generateProductionReport = async () => {
    setLoading('production');
    try {
      const batchId = prompt('Enter Batch ID to generate report:');
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
      alert(error.response?.data?.message || 'Failed to generate production report');
    } finally {
      setLoading('');
    }
  };

  const generateTransportReport = async () => {
    setLoading('transport');
    try {
      const vehicleId = prompt('Enter Vehicle ID to generate report:');
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