import React from 'react';
import VehicleMap from '../components/VehicleMap';
import { API_BASE_URL } from '../config/api.js';

const VehicleTracking = () => {
  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2"> Vehicle Tracking System</h1>
          <p className="text-gray-400">Real-time GPS tracking for delivery vehicles</p>
        </div>
        
        <VehicleMap />
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-base-100 p-4 rounded-lg shadow">
            <h3 className="font-bold mb-3 text-green-400">📱 For Drivers (Mobile GPS)</h3>
            <p className="text-sm mb-3 text-gray-300">Send your location from mobile phone:</p>
            <div className="space-y-2">
              <a 
                href={`${API_BASE_URL}/driver-location.html`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-sm btn-primary w-full"
              >
                📍 Local GPS Tracker
              </a>
              <a 
                href="https://unpredicated-uncomplete-roberto.ngrok-free.app/driver-location-ngrok.html" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-sm btn-secondary w-full"
              >
                🌐 External GPS Tracker
              </a>
            </div>
          </div>
          
          <div className="bg-base-100 p-4 rounded-lg shadow">
            <h3 className="font-bold mb-3 text-blue-400">🖥️ For Managers (Web View)</h3>
            <p className="text-sm mb-3 text-gray-300">Monitor vehicles from web browser:</p>
            <div className="space-y-2">
              <a 
                href={`${API_BASE_URL}/vehicle-location-map.html`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-sm btn-primary w-full"
              >
                🗺️ Local Map Viewer
              </a>
              <a 
                href="https://unpredicated-uncomplete-roberto.ngrok-free.app/vehicle-location-map-ngrok.html" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-sm btn-secondary w-full"
              >
                🌐 External Map Viewer
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-yellow-900/20 border border-yellow-700 p-4 rounded-lg">
          <h4 className="font-bold text-yellow-400 mb-2">💡 Quick Start Guide:</h4>
          <ol className="list-decimal ml-5 space-y-1 text-sm text-gray-300">
            <li>Drivers: Open GPS Tracker link on mobile phone → Allow location access → Tracking starts automatically</li>
            <li>Managers: Open Map Viewer link → See real-time vehicle locations with auto-refresh</li>
            <li>Use "Local" links for testing, "External" links work from anywhere on internet</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default VehicleTracking;