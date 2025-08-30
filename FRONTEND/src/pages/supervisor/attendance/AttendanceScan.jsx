// FRONTEND/src/pages/supervisor/attendance/AttendanceScan.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const COOLDOWN_MS = 2500; // avoid burst posts

export default function AttendanceScan() {
  const token = localStorage.getItem('token');
  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const scannerRef = useRef(null);
  const lastPostAtRef = useRef(0);
  const [lastText, setLastText] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const todayStr = () => new Date().toISOString().slice(0, 10);

  const postOnce = async (text) => {
    const now = Date.now();
    if (now - lastPostAtRef.current < COOLDOWN_MS) return;
    lastPostAtRef.current = now;

    let payload = { workerId: String(text).trim(), date: todayStr() };
    try {
      const maybe = JSON.parse(text);
      if (maybe && typeof maybe === 'object' && maybe.workerId) {
        payload = {
          workerId: String(maybe.workerId).trim(),
          workerName: (maybe.workerName || '').trim(),
          field: (maybe.field || '').trim(),
          date: todayStr(),
        };
      }
    } catch (_) {}

    if (!payload.workerId) {
      setMessage('QR did not contain a workerId');
      return;
    }

    try {
      setSaving(true);
      setMessage('');
      await axios.post(`${API}/api/attendance`, payload, { headers: authHeader });
      setMessage(`✅ Marked present: ${payload.workerId}`);
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || 'Save failed';
      setMessage(`❌ ${status ? status + ' ' : ''}${msg}`);
      console.error('[scan save error]', status, e?.response?.data || e);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    try {
      const config = {
        fps: 10,
        qrbox: { width: 280, height: 280 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA], // ✅ correct enum
        // @ts-ignore – hint to prefer back camera on phones
        videoConstraints: { facingMode: 'environment' },
      };

      const onScanSuccess = (decodedText /*, decodedResult */) => {
        if (!decodedText) return;
        if (decodedText === lastText) return;
        setLastText(decodedText);
        postOnce(decodedText);
      };

      const onScanError = () => {
        // ignore frame decode errors
      };

      scannerRef.current = new Html5QrcodeScanner('qr-reader-container', config, false);
      scannerRef.current.render(onScanSuccess, onScanError);
    } catch (err) {
      console.error('[scanner init error]', err);
      setMessage('Camera init failed. Use HTTPS or localhost, and allow camera permission.');
    }

    return () => {
      try {
        scannerRef.current?.clear();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl md:text-3xl font-bold">QR Scan</h1>

        <div className="mt-4 rounded-2xl bg-base-100 p-4 shadow border">
          <div id="qr-reader-container" style={{ width: '100%' }} />

          <div className="mt-3 text-sm opacity-70">
            Last: <code>{lastText || '—'}</code>
          </div>
          {saving && <div className="mt-2 alert">Saving…</div>}
          {message && <div className="mt-2 text-sm">{message}</div>}

          <div className="mt-3 text-xs opacity-60">
            Tip: Camera works on <code>https://</code> origins or <code>http://localhost</code>. Allow camera permission.
          </div>
        </div>
      </div>
    </div>
  );
}
