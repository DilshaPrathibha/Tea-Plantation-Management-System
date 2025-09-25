import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, MapPin, Clock, Wifi, WifiOff } from 'lucide-react';

// Fix default marker icon paths
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom truck icon for vehicle markers using emoji
const truckIcon = new L.DivIcon({
  className: 'truck-marker',
  html: `
    <div style="
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      border: 3px solid #ffffff;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    ">🚛</div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 35],
  popupAnchor: [0, -35]
});

const VehicleMap = () => {
  const [vehicleLocation, setVehicleLocation] = useState(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    // Initialize map centered on Sri Lanka
    const mapInstance = L.map('vehicle-map').setView([7.8731, 80.7718], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapInstance);
    
    setMap(mapInstance);
    
    return () => {
      mapInstance.remove();
    };
  }, []);

  useEffect(() => {
    const fetchVehicleLocation = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/vehicle-location');
        
        if (response.ok) {
          const data = await response.json();
          setVehicleLocation(data);
          setIsOnline(true);
          setLastUpdate(new Date());
        } else {
          setIsOnline(false);
        }
      } catch (error) {
        console.error('Error fetching vehicle location:', error);
        setIsOnline(false);
      }
    };

    fetchVehicleLocation();
    const interval = setInterval(fetchVehicleLocation, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!map || !vehicleLocation) return;

    const { latitude, longitude, driverId, updatedAt } = vehicleLocation;

    if (latitude && longitude) {
      const latlng = [latitude, longitude];
      
      // Remove existing marker
      if (marker) {
        marker.remove();
      }
      
      // Create new marker
      const newMarker = L.marker(latlng, { icon: truckIcon }).addTo(map);
      
      newMarker.bindPopup(`
        <div class="text-center">
          <h4 class="font-bold text-green-600">🚛 ${driverId}</h4>
          <p class="text-sm"><strong>📍 Location:</strong><br>
          ${latitude.toFixed(6)}, ${longitude.toFixed(6)}</p>
          <p class="text-sm"><strong>🕒 Last Update:</strong><br>
          ${new Date(updatedAt).toLocaleString()}</p>
        </div>
      `).openPopup();
      
      // Center map on vehicle
      map.setView(latlng, 15);
      setMarker(newMarker);
    }
  }, [vehicleLocation, map]);

  return (
    <div className="bg-base-100 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-green-900 p-4 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MapPin className="w-6 h-6" />
              Live Vehicle Map
            </h2>
            <p className="text-blue-200">Real-time GPS tracking dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="flex items-center gap-1 text-green-300">
                <Wifi className="w-4 h-4" />
                <span className="text-sm">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-300">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm">Offline</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vehicle Status Panel */}
      {vehicleLocation && (
        <div className="p-4 bg-gray-800 border-b border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Truck className="w-8 h-8 text-blue-400" />
              <div>
                <p className="font-semibold text-white">{vehicleLocation.driverId}</p>
                <p className="text-sm text-gray-400">Vehicle ID</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-green-400" />
              <div>
                <p className="font-semibold text-white">
                  {vehicleLocation.latitude?.toFixed(4)}, {vehicleLocation.longitude?.toFixed(4)}
                </p>
                <p className="text-sm text-gray-400">GPS Coordinates</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-400" />
              <div>
                <p className="font-semibold text-white">
                  {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
                </p>
                <p className="text-sm text-gray-400">Last Update</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="relative">
        <div id="vehicle-map" style={{ height: '500px', width: '100%' }}></div>
        
        {/* No Data Overlay */}
        {!vehicleLocation && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-bold mb-2">No Vehicle Data</h3>
              <p className="text-gray-300">Waiting for GPS updates from vehicles...</p>
              <p className="text-sm text-gray-400 mt-2">
                Use the GPS tracker links below to start sending location data
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-gray-900 text-center">
        <p className="text-xs text-gray-400">
          Map updates automatically every 10 seconds • 
          {vehicleLocation ? (
            <span className="text-green-400"> Vehicle tracking active</span>
          ) : (
            <span className="text-orange-400"> Waiting for vehicle data</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default VehicleMap;