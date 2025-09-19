import React, { useEffect, useRef, useState } from 'react';
import Navbar from '@/components/Navbar';
import toast from 'react-hot-toast';
import L from 'leaflet';
import { Truck } from 'lucide-react';

const MAP_API_URL = import.meta.env.VITE_VEHICLE_API_URL || 'http://localhost:5001/api/vehicle-location';

const VehicleMapPage = () => {
	const mapRef = useRef(null);
	const markerRef = useRef(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		// Dynamically load Leaflet CSS
		const leafletCss = document.createElement('link');
		leafletCss.rel = 'stylesheet';
		leafletCss.href = 'https://unpkg.com/leaflet/dist/leaflet.css';
		document.head.appendChild(leafletCss);

		// Dynamically load Leaflet JS
		const leafletScript = document.createElement('script');
		leafletScript.src = 'https://unpkg.com/leaflet/dist/leaflet.js';
		leafletScript.async = true;
		leafletScript.onload = () => {
			if (!mapRef.current) {
				mapRef.current = L.map('vehicle-map').setView([7.8731, 80.7718], 7);
				L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					maxZoom: 19,
					attribution: '© OpenStreetMap'
				}).addTo(mapRef.current);
			}
			fetchAndShowLocation();
			const interval = setInterval(fetchAndShowLocation, 10000);
			return () => clearInterval(interval);
		};
		document.body.appendChild(leafletScript);
		return () => {
			if (mapRef.current) mapRef.current.remove();
			document.head.removeChild(leafletCss);
			document.body.removeChild(leafletScript);
		};
		// eslint-disable-next-line
	}, []);

	const fetchAndShowLocation = async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(MAP_API_URL);
			if (!res.ok) throw new Error('No location data');
			const data = await res.json();
			if (data.latitude && data.longitude) {
				const latlng = [data.latitude, data.longitude];
				if (!markerRef.current) {
					markerRef.current = L.marker(latlng).addTo(mapRef.current).bindPopup('Vehicle Location').openPopup();
				} else {
					markerRef.current.setLatLng(latlng);
				}
				mapRef.current.setView(latlng, 15);
				setLoading(false);
			} else {
				setError('No location data available');
			}
		} catch (err) {
			setError('Could not fetch location');
		}
		setLoading(false);
	};

	return (
		<div className="min-h-screen bg-base-200">
			<Navbar />
			<div className="max-w-6xl mx-auto px-4 py-8">
						<h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
							<Truck size={28} className="text-primary" /> Tea Leaf Delivery Vehicle Location
						</h1>
				<div className="rounded-lg shadow border border-base-content/10 bg-base-100 p-4">
					<div id="vehicle-map" className="w-full h-[60vh] rounded" />
					{loading && <div className="text-center py-4 text-base-content/70">Loading map...</div>}
					{error && <div className="text-center py-4 text-error">{error}</div>}
				</div>
				<div className="mt-4 text-base-content/70 text-sm">
					Location updates every 10 seconds. Make sure the driver is sharing location from their phone.
				</div>
			</div>
		</div>
	);
};

export default VehicleMapPage;
