// FRONTEND/src/components/MapPickerOSM.jsx
import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon paths (so markers appear in Vite)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

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
export default function MapPickerOSM({ value, onChange, height = 380, zoom = 14 }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapElRef = useRef(null);

  const [search, setSearch] = useState("");
  const [err, setErr] = useState("");

  const startPos = {
    lat: typeof value?.lat === "number" ? value.lat : DEFAULT_CENTER.lat,
    lng: typeof value?.lng === "number" ? value.lng : DEFAULT_CENTER.lng,
  };

  // Init map once
  useEffect(() => {
    if (mapRef.current) return;

    try {
      const map = L.map(mapElRef.current, {
        center: startPos,
        zoom,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a target="_blank" rel="noreferrer" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker(startPos, { draggable: true }).addTo(map);

      // Map click → place marker + reverse geocode
      map.on("click", async (e) => {
        const pos = { lat: e.latlng.lat, lng: e.latlng.lng };
        await placeMarker(pos, true);
      });

      // Marker drag end → reverse geocode
      marker.on("dragend", async () => {
        const p = marker.getLatLng();
        await placeMarker({ lat: p.lat, lng: p.lng }, true);
      });

      mapRef.current = map;
      markerRef.current = marker;
    } catch (e) {
      console.error("[Leaflet init error]", e);
      setErr("Failed to initialize map.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value → marker/map (when parent sets lat/lng)
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    const lat = typeof value?.lat === "number" ? value.lat : startPos.lat;
    const lng = typeof value?.lng === "number" ? value.lng : startPos.lng;
    markerRef.current.setLatLng({ lat, lng });
    mapRef.current.setView({ lat, lng });
  }, [value?.lat, value?.lng]);

  function normalizeNumber(val) {
    if (val === "" || val === null || val === undefined) return "";
    const n = Number(val);
    if (Number.isNaN(n)) return "";
    return Number(n.toFixed(6));
  }

  async function reverseGeocode(pos) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        pos.lat
      )}&lon=${encodeURIComponent(pos.lng)}&accept-language=en`;
      const r = await fetch(url, { headers: { "Accept-Language": "en" } });
      const j = await r.json();
      return j?.display_name || "";
    } catch {
      return "";
    }
  }

  async function placeMarker(pos, doReverse) {
    if (!mapRef.current || !markerRef.current) return;
    const lat = normalizeNumber(pos.lat);
    const lng = normalizeNumber(pos.lng);
    markerRef.current.setLatLng({ lat, lng });
    mapRef.current.panTo({ lat, lng });

    let address = value?.address || "";
    if (doReverse) {
      const addr = await reverseGeocode({ lat, lng });
      if (addr) address = addr;
    }
    onChange?.({ lat, lng, address });
  }

  // 🔎 Forward geocode a place/town name and center the map + marker
  async function doSearch() {
    const query = search.trim();
    if (!query) return;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        query
      )}&limit=1`;
      const r = await fetch(url, { headers: { "Accept-Language": "en" } });
      const j = await r.json();
      if (Array.isArray(j) && j.length > 0) {
        const lat = normalizeNumber(j[0].lat);
        const lng = normalizeNumber(j[0].lon);
        await placeMarker({ lat, lng }, true); // also fills address
      } else {
        alert("No results found for that place.");
      }
    } catch (e) {
      console.error("[nominatim forward search]", e);
      alert("Search failed. Please try again.");
    }
  }

  // ⛔ Prevent form submit; ⏎ triggers search instead
  const handleKeyDown = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();      // don’t submit parent form
      e.stopPropagation();     // don’t bubble to form’s onKeyDown blocker
      await doSearch();        // perform geocoding + center
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported in this browser.");
    navigator.geolocation.getCurrentPosition(
      (p) => placeMarker({ lat: p.coords.latitude, lng: p.coords.longitude }, true),
      () => alert("Unable to get your location."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-2">
      {/* Simple search + geolocation row */}
      <div className="join w-full">
        <input
          className="input input-bordered join-item w-full"
          placeholder="Search address or place (OpenStreetMap / Nominatim)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}   // ⬅️ Press Enter to search (no form submit)
        />
        <button type="button" className="btn join-item" onClick={doSearch}>
          Search
        </button>
        <button type="button" className="btn join-item" onClick={useMyLocation}>
          Use my location
        </button>
      </div>

      {err && (
        <div className="alert alert-warning">
          <span>{err}</span>
        </div>
      )}

      <div
        ref={mapElRef}
        style={{ width: "100%", height: `${height}px` }}
        className="rounded-xl border border-base-300 overflow-hidden"
      />

      <div className="text-xs opacity-70">
        🗺️ Click on the map (or drag the marker) to tag the exact field location. The address will auto-fill.
      </div>
    </div>
  );
}
