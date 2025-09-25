// FRONTEND/src/components/MapPicker.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Sweet, Toast } from '@/utils/sweet';

/* ---------------- Loaders ---------------- */

let _gmapsLoaderPromise = null;
function loadGoogleMaps(apiKey) {
  if (!apiKey) return Promise.reject(new Error('Missing Google Maps API key'));
  if (_gmapsLoaderPromise) return _gmapsLoaderPromise;

  _gmapsLoaderPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve(window.google);

    const s = document.createElement('script');
    // Best practice: include loading=async; include needed libraries
    s.src =
      `https://maps.googleapis.com/maps/api/js` +
      `?key=${encodeURIComponent(apiKey)}` +
      `&libraries=places,marker` +
      `&v=quarterly&loading=async`;
    s.async = true;
    s.defer = true;
    s.onload = () => (window.google?.maps ? resolve(window.google) : reject(new Error('Google Maps not available after load')));
    s.onerror = () => reject(new Error('Google Maps script failed to load'));
    document.head.appendChild(s);
  });

  return _gmapsLoaderPromise;
}

let _extLibPromise = null;
// Proper ESM load to avoid "Unexpected token export"
function loadExtendedComponentLibrary() {
  if (window.customElements?.get?.('gmpx-place-autocomplete')) return Promise.resolve();
  if (_extLibPromise) return _extLibPromise;

  _extLibPromise = (async () => {
    const cssHref = 'https://unpkg.com/@googlemaps/extended-component-library@0.6/dist/style.css';
    if (!document.querySelector(`link[href="${cssHref}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssHref;
      document.head.appendChild(link);
    }
    await import('https://unpkg.com/@googlemaps/extended-component-library@0.6/dist/index.min.js');
    await window.customElements.whenDefined('gmpx-place-autocomplete');
  })();

  return _extLibPromise;
}

/* ---------------- Component ---------------- */

const DEFAULT_CENTER = { lat: 6.9271, lng: 79.8612 }; // Colombo

/**
 * Props:
 *  - value: { lat?: number, lng?: number, address?: string }
 *  - onChange: (next) => void
 *  - height?: number
 *  - zoom?: number
 */
export default function MapPicker({ value, onChange, height = 320, zoom = 14 }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapElRef = useRef(null);
  const pacRef = useRef(null); // <gmpx-place-autocomplete />
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [err, setErr] = useState('');

  const center = {
    lat: typeof value?.lat === 'number' ? value.lat : DEFAULT_CENTER.lat,
    lng: typeof value?.lng === 'number' ? value.lng : DEFAULT_CENTER.lng,
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!apiKey) {
        setErr('No Google Maps key found (VITE_GOOGLE_MAPS_API_KEY).');
        return;
      }

      try {
        const g = await loadGoogleMaps(apiKey);
        if (cancelled) return;

        if (!g?.maps) {
          setErr('Google Maps failed to initialize (check API key & restrictions).');
          return;
        }

        await loadExtendedComponentLibrary();
        if (cancelled) return;

        geocoderRef.current = new g.maps.Geocoder();

        // Map
        mapRef.current = new g.maps.Map(mapElRef.current, {
          center,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        // Marker
        markerRef.current = new g.maps.Marker({
          map: mapRef.current,
          position: center,
          draggable: true,
        });

        // Map click
        mapRef.current.addListener('click', (e) => {
          const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          placeMarker(pos, true);
        });

        // Marker drag
        markerRef.current.addListener('dragend', () => {
          const pos = markerRef.current.getPosition();
          placeMarker({ lat: pos.lat(), lng: pos.lng() }, true);
        });

        // Autocomplete (new element)
        if (pacRef.current) {
          const onPlaceChange = () => {
            const place = pacRef.current.value;
            if (!place) return;

            let lat, lng;
            if (place.geometry?.location) {
              lat = place.geometry.location.lat();
              lng = place.geometry.location.lng();
            } else if (place.location) {
              const loc = place.location;
              if (typeof loc.lat === 'function') {
                lat = loc.lat();
                lng = loc.lng();
              } else if (typeof loc.lat === 'number') {
                lat = loc.lat;
                lng = loc.lng;
              } else if (loc?.toJSON) {
                const j = loc.toJSON();
                lat = j.lat;
                lng = j.lng;
              }
            }
            if (typeof lat !== 'number' || typeof lng !== 'number') return;

            const address =
              place.formatted_address ||
              place.formattedAddress ||
              place.name ||
              (place.displayName && (place.displayName.text || place.displayName)) ||
              '';

            placeMarker({ lat, lng }, false, address);
          };

          pacRef.current.addEventListener('gmpx-placechange', onPlaceChange);
          pacRef.current._cleanupHandler = () =>
            pacRef.current?.removeEventListener?.('gmpx-placechange', onPlaceChange);
        }

        setReady(true);
      } catch (e) {
        console.error('[MapPicker init]', e);
        setErr(e?.message || 'Google Maps failed to initialize');
      }
    })();

    return () => {
      cancelled = true;
      try { pacRef.current?._cleanupHandler?.(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync outside value → marker/map
  useEffect(() => {
    if (!ready || !markerRef.current || !mapRef.current) return;
    const pos = {
      lat: typeof value?.lat === 'number' ? value.lat : DEFAULT_CENTER.lat,
      lng: typeof value?.lng === 'number' ? value.lng : DEFAULT_CENTER.lng,
    };
    markerRef.current.setPosition(pos);
    mapRef.current.setCenter(pos);
  }, [ready, value?.lat, value?.lng]);

  async function reverseGeocode(pos) {
    if (!geocoderRef.current) return '';
    try {
      const resp = await geocoderRef.current.geocode({ location: pos });
      return resp?.results?.[0]?.formatted_address || '';
    } catch {
      return '';
    }
  }

  async function placeMarker(pos, doReverse, overrideAddress = '') {
    if (!markerRef.current || !mapRef.current) return;
    markerRef.current.setPosition(pos);
    mapRef.current.panTo(pos);
    let address = overrideAddress || value?.address || '';
    if (doReverse) {
      const addr = await reverseGeocode(pos);
      if (addr) address = addr;
    }
    onChange?.({ lat: pos.lat, lng: pos.lng, address });
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported by this browser.');
    navigator.geolocation.getCurrentPosition(
      (p) => placeMarker({ lat: p.coords.latitude, lng: p.coords.longitude }, true),
      () => alert('Unable to get your location.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-stretch">
        <gmpx-place-autocomplete
          ref={pacRef}
          placeholder="Search place (Google Places – new)"
          style={{ flex: 1, minHeight: 44 }}
        ></gmpx-place-autocomplete>
        <button type="button" className="btn" onClick={useMyLocation}>
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
        style={{ width: '100%', height: `${height}px` }}
        className="rounded-xl border border-base-300 overflow-hidden"
      />

      <div className="text-xs opacity-70">
        Click the map or drag the marker to tag the field. Address fills automatically.
      </div>
    </div>
  );
}
