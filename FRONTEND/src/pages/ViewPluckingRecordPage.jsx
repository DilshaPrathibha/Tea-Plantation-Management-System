// FRONTEND/src/pages/ViewPluckingRecordPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { ArrowLeft, Leaf, Users, Edit, Trash2, Loader, Share, Download, Calendar, MapPin, DollarSign, Scale } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ViewPluckingRecordPage = () => {
  // Share report logic
  const shareReport = async () => {
    if (!record) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Plucking Record: ${record.field} - ${formatDate(record.date)}`,
          text: `Plucking Record for ${record.field} on ${formatDate(record.date)}. Total Weight: ${Number(record.totalWeight).toFixed(2)} kg.`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Sharing cancelled or failed', err);
      }
    }
  };

  // PDF download logic with CeylonLeaf header design
  const exportPDFRecord = () => {
    if (!record) return;
    
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

    const style = `
      <style>
        * { font-family: Arial, Helvetica, sans-serif; }
        body { margin: 0; padding: 20px; }
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
          margin-bottom: 20px; 
        }
        .logo-section { 
          display: flex; 
          align-items: center; 
        }
        .leaf-icon { 
          width: 20px; 
          height: 20px; 
          margin-right: 8px; 
          display: inline-block;
        }
        .company-name { 
          font-size: 18px; 
          font-weight: bold; 
          color: #22C55E; 
          margin: 0; 
        }
        .generation-info { 
          text-align: right; 
          font-size: 10px; 
          color: #666; 
          line-height: 1.4;
        }
        .report-title { 
          font-size: 16px; 
          font-weight: bold; 
          color: #000; 
          text-align: center; 
          margin: 20px 0 30px 0; 
        }
        .details-section { 
          margin-bottom: 20px; 
        }
        .details-title { 
          font-size: 14px; 
          font-weight: bold; 
          color: #22C55E; 
          margin-bottom: 8px; 
          border-bottom: 1px solid #22C55E; 
          padding-bottom: 4px; 
        }
        .meta-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 16px; 
          margin-bottom: 20px; 
        }
        .meta-item { 
          padding: 8px; 
          background: #f1f5f9; 
          border-radius: 4px; 
        }
        .meta-label { 
          font-size: 12px; 
          color: #666; 
          font-weight: bold; 
        }
        .meta-value { 
          font-size: 14px; 
          color: #000; 
          margin-top: 4px; 
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          font-size: 12px; 
          margin: 20px 0; 
        }
        th { 
          background: #22C55E; 
          color: #000; 
          font-weight: bold; 
          padding: 12px 8px; 
          text-align: left;
        }
        td { 
          padding: 10px 8px; 
          border-bottom: 1px solid #eee; 
        }
        .totals { 
          background: #f8f9fa; 
          padding: 16px; 
          border-radius: 8px; 
          margin: 20px 0; 
        }
        .footer { 
          position: fixed; 
          bottom: 20px; 
          left: 20px; 
          right: 20px; 
          text-align: center; 
          font-size: 11px; 
          color: #666;
        }
        .footer-company { 
          color: #22C55E; 
          font-weight: bold; 
          margin-bottom: 4px; 
        }
        .footer-address { 
          margin-bottom: 4px; 
        }
        .footer-slogan { 
          font-style: italic; 
          margin-bottom: 10px; 
        }
        .page-number { 
          position: absolute; 
          right: 0; 
          bottom: 0; 
        }
      </style>
    `;

    const now = new Date();
    const html = `
      <!doctype html><html><head><meta charset="utf-8">${style}</head><body>
        <!-- Header Section -->
        <div class="header">
          <div class="logo-section">
            <svg class="leaf-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
            <div class="company-name">CeylonLeaf</div>
          </div>
          <div class="generation-info">
            Generated on ${now.toLocaleString()}<br/>
            Record ID: ${record._id}
          </div>
        </div>
        
        <!-- Report Title -->
        <div class="report-title">Plucking Record Details</div>
        
        <!-- Record Information -->
        <div class="details-section">
          <div class="details-title">Record Information</div>
          <div class="meta-grid">
            <div class="meta-item">
              <div class="meta-label">Field</div>
              <div class="meta-value">${escapeHTML(record.field)}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Date</div>
              <div class="meta-value">${formatDate(record.date)}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Tea Grade</div>
              <div class="meta-value">${escapeHTML(record.teaGrade)}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Reporter</div>
              <div class="meta-value">${escapeHTML(record.reporterName)}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Price per KG</div>
              <div class="meta-value">LKR ${Number(record.dailyPricePerKg).toFixed(2)}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Total Weight</div>
              <div class="meta-value">${Number(record.totalWeight).toFixed(2)} kg</div>
            </div>
          </div>
        </div>
        
        <!-- Workers Table -->
        <div class="details-section">
          <div class="details-title">Workers (${record.workers.length})</div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>ID</th>
                <th>Weight (kg)</th>
                <th>Payment (LKR)</th>
              </tr>
            </thead>
            <tbody>
              ${record.workers.map(worker => `
                <tr>
                  <td>${escapeHTML(worker.workerName)}</td>
                  <td>${escapeHTML(worker.workerId)}</td>
                  <td>${Number(worker.weight).toFixed(2)}</td>
                  <td>${(Number(worker.weight) * Number(record.dailyPricePerKg)).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <!-- Totals -->
        <div class="totals">
          <div class="details-title">Summary</div>
          <div style="display: flex; justify-content: space-between; margin-top: 12px;">
            <div>
              <strong>Total Weight:</strong> ${Number(record.totalWeight).toFixed(2)} kg
            </div>
            <div>
              <strong>Total Payment:</strong> LKR ${Number(record.totalPayment).toFixed(2)}
            </div>
          </div>
        </div>
        
        <!-- Footer Section -->
        <div class="footer">
          <div class="footer-company">CeylonLeaf Plantations</div>
          <div class="footer-address">No. 123, Tea Estate Road, Nuwara Eliya, Sri Lanka</div>
          <div class="footer-slogan">Cultivating excellence in every leaf.</div>
          <div class="page-number">Page 1</div>
        </div>
      </body></html>
    `;
    
    w.document.open(); 
    w.document.write(html); 
    w.document.close();
    w.onload = () => { w.focus(); w.print(); };
  };
  const navigate = useNavigate();
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchRecord();
    fetchCurrentUser();
  }, [id]);

  const fetchCurrentUser = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/plucking-records/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle both response formats
      const recordData = response.data.pluckingRecord || response.data;
      setRecord(recordData);
    } catch (error) {
      console.error('Error fetching plucking record:', error);
      setError('Failed to load plucking record');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      // Check if current user can delete this record
      if (!canDeleteRecord()) {
        Swal.fire({
          icon: 'warning',
          title: 'Access Denied',
          text: 'Only the reporter can delete this plucking record.',
          confirmButtonColor: '#059669'
        });
        return;
      }

      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#059669',
        cancelButtonColor: '#DC2626',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        setDeleting(true);
        const token = localStorage.getItem('token');
        
        await axios.delete(`${API}/api/plucking-records/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        await Swal.fire({
          title: 'Deleted!',
          text: 'Plucking record has been deleted.',
          icon: 'success',
          confirmButtonColor: '#059669'
        });
        
        navigate('/plucking-records');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to delete plucking record.',
        icon: 'error',
        confirmButtonColor: '#DC2626'
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Check if current user can edit this record
  const canEditRecord = () => {
    return currentUser && record && currentUser._id === record.reportedBy;
  };

  // Check if current user can delete this record
  const canDeleteRecord = () => {
    return currentUser && record && currentUser._id === record.reportedBy;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <div className="animate-pulse bg-base-300 h-6 w-6 rounded mr-3"></div>
            <div className="animate-pulse bg-base-300 h-6 w-32 rounded"></div>
          </div>
          <div className="bg-base-200 rounded-xl shadow p-6 animate-pulse">
            <div className="h-8 bg-base-300 rounded w-3/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-base-300 rounded w-1/2"></div>
              <div className="h-4 bg-base-300 rounded w-2/3"></div>
              <div className="h-4 bg-base-300 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/plucking-records" className="inline-flex items-center text-green-600 hover:text-green-700 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Records
          </Link>
          <div className="bg-base-200 rounded-xl shadow p-6 text-center">
            <div className="text-red-500 text-lg mb-4">{error}</div>
            <button
              onClick={fetchRecord}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Link 
            to="/plucking-records" 
            className="inline-flex items-center text-green-600 hover:text-green-700 mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Records
          </Link>
          <div className="w-10 h-10 bg-base-200 rounded-lg shadow-sm flex items-center justify-center mr-3">
            <Leaf className="w-5 h-5 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-base-content">Plucking Record Details</h1>
          <div className="flex items-center space-x-2 ml-auto">
            {/* Refresh button removed as requested */}
            <button
              onClick={shareReport}
              className="p-2 text-base-content/60 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Share Report"
            >
              <Share className="w-5 h-5" />
            </button>
            <button
              onClick={exportPDFRecord}
              className="p-2 text-base-content/60 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Download PDF Report"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-base-200 rounded-2xl shadow-sm border border-base-content/10 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-100">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-base-content mb-2">
                  {record.field} - {formatDate(record.date)}
                </h1>
                <p className="text-base-content">Reported by {record.reporterName}</p>
              </div>
              <span className="mt-4 md:mt-0 px-3 py-1 bg-primary/20 text-primary text-sm font-medium rounded-full">
                {record.teaGrade}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-base-content">Date</p>
                    <p className="font-medium text-base-content">{formatDate(record.date)}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-base-content">Field</p>
                    <p className="font-medium text-base-content">{record.field}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-base-content">Price per KG</p>
                    <p className="font-medium text-base-content">LKR {Number(record.dailyPricePerKg).toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Scale className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-base-content">Total Weight</p>
                    <p className="font-medium text-base-content">{Number(record.totalWeight).toFixed(2)} kg</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Workers List */}
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <Users className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-base-content">Workers ({record.workers.length})</h3>
              </div>
              <div className="bg-base-300 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {record.workers.map((worker, index) => (
                    <div key={index} className="bg-base-200 rounded-lg p-3 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-base-content">{worker.workerName}</p>
                          <p className="text-sm text-base-content">ID: {worker.workerId}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-base-content">{Number(worker.weight).toFixed(2)} kg</p>
                          <p className="text-sm text-green-700">
                            LKR {(Number(worker.weight) * Number(record.dailyPricePerKg)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-green-800">Total Tea Leaves Weight</h4>
                <p className="text-2xl font-bold text-green-900">{Number(record.totalWeight).toFixed(2)} kg</p>
              </div>
              <div>
                <h4 className="font-semibold text-green-800">Total Daily Payment</h4>
                <p className="text-2xl font-bold text-green-900">LKR {Number(record.totalPayment).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-base-300 px-6 py-4 border-t border-base-content/10">
            <div className="flex justify-end space-x-4">
              {canEditRecord() && (
                <button
                  onClick={() => navigate(`/plucking-records/${record._id}/edit`)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Record
                </button>
              )}
              {canDeleteRecord() && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete Record
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPluckingRecordPage;
