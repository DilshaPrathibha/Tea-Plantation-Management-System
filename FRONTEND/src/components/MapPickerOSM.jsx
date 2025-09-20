// FRONTEND/src/components/MapPickerOSM.jsx
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon paths (so markers appear in Vite)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Sweet, Toast } from '@/utils/sweet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = { lat: 6.9271, lng: 79.8612 }; // Colombo

/**
 * Props:
 *  - value: { lat?: number, lng?: number, address?: string }
 *  - onChange: (next: {lat:number, lng:number, address:string}) => void
 *  - height?: number
 *  - zoom?: number
 */
export default function MapPickerOSM({ value, onChange, height = 320, zoom = 14 }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapElRef = useRef(null);

  const [search, setSearch] = useState('');
  const [sug, setSug] = useState([]);
  const [sugOpen, setSugOpen] = useState(false);
  const [sugLoading, setSugLoading] = useState(false);
  const [err, setErr] = useState('');

  const center = {
    lat: typeof value?.lat === 'number' ? value.lat : DEFAULT_CENTER.lat,
    lng: typeof value?.lng === 'number' ? value.lng : DEFAULT_CENTER.lng,
  };

  // Init map once
  useEffect(() => {
    if (mapRef.current) return;

    try {
      const map = L.map(mapElRef.current, {
        center,
        zoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a target="_blank" rel="noreferrer" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker(center, { draggable: true }).addTo(map);

      // Map click → place marker + reverse geocode
      map.on('click', async (e) => {
        const pos = { lat: e.latlng.lat, lng: e.latlng.lng };
        placeMarker(pos, true);
      });

      // Marker drag end → reverse geocode
      marker.on('dragend', async () => {
        const p = marker.getLatLng();
        placeMarker({ lat: p.lat, lng: p.lng }, true);
      });

      mapRef.current = map;
      markerRef.current = marker;
    } catch (e) {
      console.error('[Leaflet init error]', e);
      setErr('Failed to initialize map.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value → marker/map
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    const pos = {
      lat: typeof value?.lat === 'number' ? value.lat : DEFAULT_CENTER.lat,
      lng: typeof value?.lng === 'number' ? value.lng : DEFAULT_CENTER.lng,
    };
    markerRef.current.setLatLng(pos);
    mapRef.current.setView(pos);
  }, [value?.lat, value?.lng]);

  function normalizeNumber(val) {
    if (val === '' || val === null || val === undefined) return '';
    const n = Number(val);
    if (Number.isNaN(n)) return '';
    return Number(n.toFixed(6));
  }

  async function reverseGeocode(pos) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        pos.lat
      )}&lon=${encodeURIComponent(pos.lng)}&accept-language=en`;
      const r = await fetch(url, {
        headers: { 'Accept-Language': 'en' },
      });
      const j = await r.json();
      return j?.display_name || '';
    } catch {
      return '';
    }
  }

  async function placeMarker(pos, doReverse) {
    if (!mapRef.current || !markerRef.current) return;
    const lat = normalizeNumber(pos.lat);
    const lng = normalizeNumber(pos.lng);
    markerRef.current.setLatLng({ lat, lng });
    mapRef.current.panTo({ lat, lng });

    let address = value?.address || '';
    if (doReverse) {
      const addr = await reverseGeocode({ lat, lng });
      if (addr) address = addr;
    }
    onChange?.({ lat, lng, address });
  }

  async function onPickSuggestion(item) {
    setSugOpen(false);
    setSug([]);
    setSearch(item.display_name);
    const lat = normalizeNumber(item.lat);
    const lng = normalizeNumber(item.lon);
    onChange?.({ lat, lng, address: item.display_name });
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLatLng({ lat, lng });
      mapRef.current.setView({ lat, lng }, 16);
    }
  }

  // Debounced Nominatim forward search
  useEffect(() => {
    if (!search || search.trim().length < 3) {
      setSug([]);
      setSugOpen(false);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setSugLoading(true);
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          search.trim()
        )}&addressdetails=1&limit=6`;
        const r = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const j = await r.json();
        if (Array.isArray(j)) {
          setSug(j);
          setSugOpen(true);
        } else {
          setSug([]);
          setSugOpen(false);
        }
      } catch (e) {
        console.error('[nominatim search]', e);
      } finally {
        setSugLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported in this browser.');
    navigator.geolocation.getCurrentPosition(
      (p) => placeMarker({ lat: p.coords.latitude, lng: p.coords.longitude }, true),
      () => alert('Unable to get your location.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="join w-full">
          <input
            className="input input-bordered join-item w-full"
            placeholder="Search address or place (OpenStreetMap / Nominatim)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => sug.length && setSugOpen(true)}
          />
          <button type="button" className="btn join-item" onClick={useMyLocation}>
            Use my location
          </button>
        </div>

        {sugOpen && (sugLoading || sug.length > 0) && (
          <div className="absolute z-20 mt-1 w-full bg-base-100 border border-base-200 rounded-xl shadow max-h-64 overflow-auto">
            {sugLoading && <div className="p-3 text-sm opacity-70">Searching…</div>}
            {!sugLoading &&
              sug.map((it) => (
                <button
                  key={`${it.place_id}`}
                  type="button"
                  className="w-full text-left p-3 hover:bg-base-200"
                  onClick={() => onPickSuggestion(it)}
                >
                  <div className="font-medium">{it.display_name}</div>
                  <div className="text-xs opacity-70">
                    {normalizeNumber(it.lat)}, {normalizeNumber(it.lon)}
                  </div>
                </button>
              ))}
            {!sugLoading && sug.length === 0 && (
              <div className="p-3 text-sm opacity-70">No results</div>
            )}
          </div>
        )}
      </div>

      {err && (
        <div className="alert alert-warning">
          <span>{err}</span>
        </div>
      )}

      <div
        ref={mapElRef}
        style={{ width: '100%', height: `${height}px` }}
        className="rounded-xl border border-base-300 overflow-hidden"
        onClick={() => setSugOpen(false)}
      />

      <div className="text-xs opacity-70">
        🗺️ Click on the map (or drag the marker) to tag the exact field location. The address will auto-fill.
      </div>
    </div>
  );
}
