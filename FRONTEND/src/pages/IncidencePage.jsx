// IncidencePage.jsx - Modern Light Theme with Weather Integration
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus, 
  AlertTriangle, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Edit, 
  Trash2,
  RefreshCw,
  Eye,
  Loader,
  Info,
  Search,
  Filter,
  X,
  Lock,
  Cloud,
  CloudRain,
  Sun,
  CloudSnow,
  CloudDrizzle,
  Thermometer,
  Droplets,
  Wind,
  Shield,
  AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Modern light theme colors
const statusColors = {
  'Pending': 'bg-amber-100 text-amber-800 border-amber-200',
  'Under Review': 'bg-blue-100 text-blue-800 border-blue-200',
  'Action Taken': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Resolved': 'bg-gray-100 text-gray-800 border-gray-200',
};

const severityColors = {
  'Low': 'bg-green-100 text-green-800 border-green-200',
  'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'High': 'bg-orange-100 text-orange-800 border-orange-200',
  'Critical': 'bg-red-100 text-red-800 border-red-200',
};

const typeIcons = {
  'Injury': '🤕',
  'Equipment Damage': '🔧',
  'Environmental Hazard': '🌿',
  'Other': '⚠️'
};

// Weather icon mapping with modern styling
const weatherIcons = {
  'clear': <Sun className="w-8 h-8 text-yellow-500" />,
  'sunny': <Sun className="w-8 h-8 text-yellow-500" />,
  'cloudy': <Cloud className="w-8 h-8 text-gray-400" />,
  'overcast': <Cloud className="w-8 h-8 text-gray-500" />,
  'rain': <CloudRain className="w-8 h-8 text-blue-500" />,
  'drizzle': <CloudDrizzle className="w-8 h-8 text-blue-400" />,
  'snow': <CloudSnow className="w-8 h-8 text-blue-200" />,
  'fog': <Cloud className="w-8 h-8 text-gray-300" />,
  'storm': <CloudRain className="w-8 h-8 text-purple-500" />,
};

const IncidencePage = () => {
  // ---- ZERO-DEPENDENCY PDF (print) ----
  const exportPDFIncidences = () => {
    const w = window.open('', '_blank');
    if (!w) {
      // Use SweetAlert for error
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
        table { 
          width: 100%; 
          border-collapse: collapse; 
          font-size: 12px; 
          margin-bottom: 40px;
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
        .status-active { 
          color: #22C55E; 
          font-weight: bold; 
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

    const rowsHtml = filteredIncidences.map((r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${escapeHTML(r.title)}</td>
        <td>${escapeHTML(r.type)}</td>
        <td>${escapeHTML(r.severity)}</td>
        <td>${escapeHTML(r.location === 'full_estate' ? 'Full Estate' : r.location)}</td>
        <td>${escapeHTML(formatDate(r.date))}</td>
        <td>${escapeHTML(r.time)}</td>
        <td class="status-active">${escapeHTML(r.status)}</td>
        <td>${escapeHTML(r.reporterName)}</td>
      </tr>
    `).join('');

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
            Incidences Shown: ${filteredIncidences.length}
          </div>
        </div>
        
        <!-- Report Title -->
        <div class="report-title">Incidence Report</div>
        
        <!-- Data Table -->
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Location</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Reporter</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="9" style="text-align:center;color:#666;">No data available</td></tr>`}
          </tbody>
        </table>
        
        <!-- Footer Section -->
        <div class="footer">
          <div class="footer-company">CeylonLeaf Plantations</div>
          <div class="footer-address">No. 123, Tea Estate Road, Nuwara Eliya, Sri Lanka</div>
          <div class="footer-slogan">Cultivating excellence in every leaf.</div>
          <div class="page-number">Page 1</div>
        </div>
      </body></html>
    `;
    w.document.open(); w.document.write(html); w.document.close();
    w.onload = () => { w.focus(); w.print(); };
    // Optionally, show a success toast if you use Toast.fire
  };
  const [incidences, setIncidences] = useState([]);
  const [filteredIncidences, setFilteredIncidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Weather states
  const [currentWeather, setCurrentWeather] = useState(null);
  const [weatherForecast, setWeatherForecast] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    setShowSuccess(location.state?.success || false);
    setDeleteSuccess(location.state?.deleteSuccess || false);
    fetchCurrentUser();
  }, [location.state]);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  useEffect(() => {
    if (deleteSuccess) {
      const timer = setTimeout(() => setDeleteSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [deleteSuccess]);

  useEffect(() => {
    fetchIncidences();
    fetchWeatherData();
  }, []);

  useEffect(() => {
    filterIncidences();
  }, [incidences, searchTerm, dateFilter, typeFilter, statusFilter]);

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

  const fetchIncidences = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/incidences`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIncidences(response.data.items || []);
    } catch (error) {
      console.error('Error fetching incidences:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load incidence reports. Please try again.',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherData = async () => {
    try {
      setWeatherLoading(true);
      
      // Using Open-Meteo API (free and no API key required)
      const latitude = 6.9553; // Avissawella, Sri Lanka
      const longitude = 80.2160;
      
      // Fetch current weather and forecast
      const response = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia%2FColombo`
      );
      
      const currentData = response.data.current;
      setCurrentWeather({
        temperature: currentData.temperature_2m,
        humidity: currentData.relative_humidity_2m,
        precipitation: currentData.precipitation,
        windSpeed: currentData.wind_speed_10m,
        weatherCode: currentData.weather_code,
        time: currentData.time
      });
      
      // Process forecast data
      const dailyData = response.data.daily;
      const forecast = dailyData.time.slice(0, 5).map((date, index) => ({
        date,
        maxTemp: dailyData.temperature_2m_max[index],
        minTemp: dailyData.temperature_2m_min[index],
        precipitation: dailyData.precipitation_sum[index],
        weatherCode: dailyData.weather_code[index]
      }));
      
      setWeatherForecast(forecast);
      
      // Check for weather alerts
      checkWeatherAlerts(currentData, forecast);
      
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setWeatherError('Weather data temporarily unavailable');
    } finally {
      setWeatherLoading(false);
    }
  };

  const getWeatherInfo = (weatherCode) => {
    // WMO Weather interpretation codes
    if (weatherCode === 0) return { description: 'Clear sky', icon: 'clear' };
    if (weatherCode >= 1 && weatherCode <= 3) 
      return { description: 'Partly cloudy', icon: 'cloudy' };
    if (weatherCode >= 45 && weatherCode <= 48) 
      return { description: 'Fog', icon: 'fog' };
    if (weatherCode >= 51 && weatherCode <= 55) 
      return { description: 'Drizzle', icon: 'drizzle' };
    if (weatherCode >= 61 && weatherCode <= 65) 
      return { description: 'Rain', icon: 'rain' };
    if (weatherCode >= 71 && weatherCode <= 75) 
      return { description: 'Snow', icon: 'snow' };
    if (weatherCode >= 80 && weatherCode <= 82) 
      return { description: 'Rain showers', icon: 'rain' };
    if (weatherCode >= 95 && weatherCode <= 99) 
      return { description: 'Thunderstorm', icon: 'storm' };
    
    return { description: 'Unknown', icon: 'cloudy' };
  };

  const checkWeatherAlerts = (currentWeather, forecast) => {
    const alerts = [];
    
    if (currentWeather.precipitation > 10) {
      alerts.push('Heavy rainfall detected. Potential for flooding.');
    }
    
    if (currentWeather.temperature_2m > 35) {
      alerts.push('High temperature warning. Risk of heat-related incidents.');
    }
    
    forecast.forEach(day => {
      if (day.precipitation > 15) {
        alerts.push(`Heavy rain expected. Prepare for wet conditions.`);
      }
    });
    
    if (alerts.length > 0) {
      setInfoMessage(`Weather Alert: ${alerts[0]}`);
    }
  };

  const filterIncidences = () => {
    let filtered = incidences;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(incidence =>
        incidence.title.toLowerCase().includes(term) ||
        incidence.reporterName.toLowerCase().includes(term) ||
        incidence.location.toLowerCase().includes(term)
      );
    }

    if (dateFilter) {
      filtered = filtered.filter(incidence => 
        new Date(incidence.date).toISOString().split('T')[0] === dateFilter
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(incidence => 
        incidence.type === typeFilter
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(incidence => 
        incidence.status === statusFilter
      );
    }

    setFilteredIncidences(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter('');
    setTypeFilter('');
    setStatusFilter('');
  };

  const hasActiveFilters = searchTerm || dateFilter || typeFilter || statusFilter;

  // Permission checks
  const canEditIncidence = (incidence) => {
    if (!currentUser) return false;
    
    // Admin, supervisor, and worker can edit their own reports
    const isOwnReport = currentUser._id === incidence.reportedBy;
    const isAdmin = currentUser.role === 'admin';
    const isSupervisor = currentUser.role === 'field_supervisor';
    const isWorker = currentUser.role === 'worker';
    
    return (isOwnReport && (isAdmin || isSupervisor || isWorker)) && incidence.status !== 'Resolved';
  };

  const canDeleteIncidence = (incidence) => {
    if (!currentUser) return false;
    
    // Admin, supervisor, and worker can delete their own reports
    const isOwnReport = currentUser._id === incidence.reportedBy;
    const isAdmin = currentUser.role === 'admin';
    const isSupervisor = currentUser.role === 'field_supervisor';
    const isWorker = currentUser.role === 'worker';
    
    return (isOwnReport && (isAdmin || isSupervisor || isWorker)) && incidence.status === 'Resolved';
  };

  const handleAddNew = () => {
    navigate('/incidences/add');
  };

  const handleViewDetails = (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    navigate(`/incidences/${id}`);
  };

  const handleEdit = (id, status, incidence, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    
    if (status === 'Resolved') {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Edit',
        text: 'Resolved incidence reports cannot be edited.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    if (!canEditIncidence(incidence)) {
      Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'Only the reporter can edit this incidence report.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }
    
    navigate(`/incidences/${id}/edit`);
  };

  const handleDelete = async (id, status, incidence, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    
    if (status !== 'Resolved') {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Delete',
        text: 'Only resolved incidence reports can be deleted.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    if (!canDeleteIncidence(incidence)) {
      Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'Only the reporter can delete this incidence report.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }
    
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        setDeletingId(id);
        const token = localStorage.getItem('token');
        
        await axios.delete(`${API}/api/incidences/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setIncidences(incidences.filter(inc => inc._id !== id));
        
        await Swal.fire({
          title: 'Deleted!',
          text: 'Incidence report has been deleted successfully.',
          icon: 'success',
          confirmButtonColor: '#3b82f6'
        });
      } catch (error) {
        console.error('Error deleting incidence:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete incidence report. Please try again.',
          confirmButtonColor: '#3b82f6'
        });
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-base-300 rounded-lg w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((item) => (
                <div key={item} className="bg-base-200 rounded-2xl shadow-sm p-6">
                  <div className="h-6 bg-base-300 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-base-300 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-base-300 rounded w-2/3 mb-4"></div>
                  <div className="flex justify-between mt-4">
                    <div className="h-8 bg-base-300 rounded w-16"></div>
                    <div className="h-8 bg-base-300 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Success Messages */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center">
            <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></div>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Incidence submitted successfully!</span>
          </div>
        )}
        
        {deleteSuccess && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center">
            <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></div>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Incidence report deleted successfully!</span>
          </div>
        )}

        {infoMessage && (
          <div
            className="mb-6 p-4 rounded-xl flex items-center shadow"
            style={{ background: '#fff3c4', border: '1px solid #f59e0b' }}
          >
            <div
              className="w-10 h-10 mr-3 rounded-lg flex items-center justify-center"
              style={{ background: '#fde68a', border: '1px solid #f59e0b' }}
            >
              <AlertCircle className="w-5 h-5" style={{ color: '#b45309' }} />
            </div>
            <span className="text-base font-semibold" style={{ color: '#7c2d12' }}>{infoMessage}</span>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 bg-base-200 rounded-xl shadow-sm flex items-center justify-center mr-4">
                <AlertTriangle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-base-content">Incidence Reports</h1>
                <p className="text-base-content/70 mt-1">Manage and track all field incidents and safety reports</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                fetchIncidences();
                fetchWeatherData();
              }}
              className="px-4 py-2 bg-base-200 border border-base-content/10 rounded-xl text-base-content hover:bg-base-300 transition-all duration-200 flex items-center shadow-sm hover:shadow-md"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={exportPDFIncidences}
              disabled={filteredIncidences.length === 0}
              className={`flex items-center px-4 py-2 rounded-xl transition-all duration-200 font-semibold ${filteredIncidences.length === 0 ? 'bg-base-content/10 text-base-content/40 cursor-not-allowed' : 'bg-base-200 border border-base-content/10 hover:bg-base-300 text-base-content shadow-lg hover:shadow-xl'}`}
              title={filteredIncidences.length === 0 ? 'No data to export' : 'Export current view to PDF'}
            >
              <Info className="w-4 h-4 mr-2" />
              Export PDF
            </button>
            <button
              onClick={handleAddNew}
              className="px-6 py-2 bg-primary hover:bg-primary-focus text-white rounded-xl hover:shadow-xl transition-all duration-200 flex items-center shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="font-semibold">New Report</span>
            </button>
          </div>
        </div>

        {/* Weather Dashboard */}
        <div className="mb-8 bg-base-200 rounded-2xl shadow-sm border border-base-content/10 overflow-hidden">
          <div className="p-6 border-b border-base-content/10">
            <h2 className="text-xl font-semibold text-base-content flex items-center">
              <Cloud className="w-5 h-5 text-primary mr-2" />
              Weather Forecast - Avissawella, Sri Lanka
            </h2>
          </div>
          
          {weatherError ? (
            <div className="p-6 text-center text-base-content/70">
              {weatherError}
            </div>
          ) : weatherLoading ? (
            <div className="p-8 flex justify-center items-center">
              <Loader className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="p-6">
              {/* Current Weather */}
              {currentWeather && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-base-content mb-4">Current Conditions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-primary/10 rounded-xl p-4 text-center border border-primary/20">
                      <div className="flex justify-center mb-3">
                        {weatherIcons[getWeatherInfo(currentWeather.weatherCode).icon]}
                      </div>
                      <div className="text-2xl font-bold text-base-content">{Math.round(currentWeather.temperature)}°C</div>
                      <div className="text-sm text-base-content/70 capitalize mt-1">{getWeatherInfo(currentWeather.weatherCode).description}</div>
                    </div>
                    
                    <div className="bg-base-300 rounded-xl p-4 text-center">
                      <Droplets className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                      <div className="text-xl font-bold text-base-content">{currentWeather.humidity}%</div>
                      <div className="text-sm text-base-content/70">Humidity</div>
                    </div>
                    
                    <div className="bg-base-300 rounded-xl p-4 text-center">
                      <CloudRain className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <div className="text-xl font-bold text-base-content">{currentWeather.precipitation}mm</div>
                      <div className="text-sm text-base-content/70">Precipitation</div>
                    </div>
                    
                    <div className="bg-base-300 rounded-xl p-4 text-center">
                      <Wind className="w-6 h-6 text-base-content/70 mx-auto mb-2" />
                      <div className="text-xl font-bold text-base-content">{currentWeather.windSpeed} km/h</div>
                      <div className="text-sm text-base-content/70">Wind Speed</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 5-Day Forecast */}
              <div>
                <h3 className="text-lg font-medium text-base-content mb-4">5-Day Forecast</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {weatherForecast.map((day, index) => {
                    const weatherInfo = getWeatherInfo(day.weatherCode);
                    return (
                      <div key={index} className="bg-base-300 rounded-lg p-3 text-center">
                        <div className="text-sm font-medium text-base-content mb-2">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="flex justify-center mb-2">
                          {weatherIcons[weatherInfo.icon]}
                        </div>
                        <div className="text-lg font-bold text-base-content">{Math.round(day.maxTemp)}°</div>
                        <div className="text-xs text-base-content/70">{Math.round(day.minTemp)}°</div>
                        {day.precipitation > 0 && (
                          <div className="text-xs text-blue-600 font-medium mt-1">
                            {day.precipitation}mm
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 bg-base-200 rounded-2xl shadow-sm border border-base-content/10 p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            {/* Search Input */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-base-content mb-2">Search Reports</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by title, reporter, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-base-content/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-base-100 text-base-content"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 bg-base-200 border border-base-content/10 rounded-xl text-base-content hover:bg-base-300 transition-all duration-200 flex items-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 w-2 h-2 bg-primary rounded-full"></span>
              )}
            </button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-3 text-error hover:bg-error/10 rounded-xl transition-all duration-200 flex items-center"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-base-content/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-base-content mb-2">Date</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-base-content/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-base-100 text-base-content"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-base-content mb-2">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-base-content/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-base-100 text-base-content"
                >
                  <option value="">All Types</option>
                  <option value="Injury">Injury</option>
                  <option value="Equipment Damage">Equipment Damage</option>
                  <option value="Environmental Hazard">Environmental Hazard</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-base-content mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-base-content/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-base-100 text-base-content"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Action Taken">Action Taken</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        {hasActiveFilters && (
          <div className="mb-4 text-sm text-base-content/70">
            Showing {filteredIncidences.length} of {incidences.length} reports
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        )}

        {/* Incidences Grid */}
        {filteredIncidences.length === 0 ? (
          <div className="bg-base-200 rounded-2xl shadow-sm border border-base-content/10 p-12 text-center">
            <AlertTriangle className="mx-auto w-16 h-16 text-base-content/30 mb-4" />
            <h3 className="text-xl font-semibold text-base-content mb-2">
              {hasActiveFilters ? 'No matching reports found' : 'No incidence reports yet'}
            </h3>
            <p className="text-base-content/70 mb-6">
              {hasActiveFilters ? 'Try adjusting your search or filters' : 'Get started by creating your first incidence report.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-focus transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={handleAddNew}
                className="px-6 py-2 bg-gradient-to-r from-primary to-primary-focus text-white rounded-xl hover:shadow-lg transition-all duration-200"
              >
                Create First Report
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredIncidences.map((incidence) => {
              const canEdit = canEditIncidence(incidence);
              const canDelete = canDeleteIncidence(incidence);
              const isResolved = incidence.status === 'Resolved';
              
              return (
                <div 
                  key={incidence._id} 
                  className="bg-base-200 rounded-2xl shadow-sm border border-base-content/10 hover:shadow-md transition-all duration-300 overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-6 border-b border-base-content/10">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center min-w-0">
                        <span className="text-2xl mr-3 flex-shrink-0">{typeIcons[incidence.type] || '⚠️'}</span>
                        <h3 className="font-semibold text-base-content truncate">
                          {incidence.title}
                        </h3>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusColors[incidence.status]} flex-shrink-0`}>
                        {incidence.status}
                      </span>
                    </div>
                    
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${severityColors[incidence.severity]}`}>
                      {incidence.severity} Severity
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-base-content/70">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{incidence.location === 'full_estate' ? 'Full Estate' : incidence.location}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-base-content/70">
                        <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{formatDate(incidence.date)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-base-content/70">
                        <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{incidence.time}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-base-content/70">
                        <User className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>By: {incidence.reporterName}</span>
                        {currentUser && currentUser._id === incidence.reportedBy && (
                          <span className="ml-2 px-2 py-1 bg-primary/20 text-primary text-xs rounded">You</span>
                        )}
                      </div>

                      <div className="pt-2">
                        <p className="text-sm text-base-content/70 line-clamp-2">
                          {incidence.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 py-4 bg-base-300 border-t border-base-content/10 flex justify-between items-center">
                    <span className="text-xs text-base-content/60">
                      {new Date(incidence.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => handleViewDetails(incidence._id, e)}
                        className="p-2 text-base-content/70 hover:bg-base-content/10 rounded-lg transition-colors duration-200"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={(e) => handleEdit(incidence._id, incidence.status, incidence, e)}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          canEdit 
                            ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-100/60' 
                            : 'text-base-content/40 cursor-not-allowed'
                        }`}
                        title={canEdit ? "Edit report" : isResolved ? "Resolved reports cannot be edited" : "Only the reporter can edit"}
                      >
                        {canEdit ? <Edit className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={(e) => handleDelete(incidence._id, incidence.status, incidence, e)}
                        disabled={deletingId === incidence._id || !canDelete}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          canDelete 
                            ? 'text-error hover:bg-error/10' 
                            : 'text-base-content/40 cursor-not-allowed'
                        }`}
                        title={canDelete ? "Delete report" : "Only resolved reports by the reporter can be deleted"}
                      >
                        {deletingId === incidence._id ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidencePage;