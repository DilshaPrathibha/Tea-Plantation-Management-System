import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Link } from 'react-router-dom';
import { ScanLine, Play, Square, MapPinned, Clock } from 'lucide-react';
import { Sweet, Toast } from '@/utils/sweet';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const COOLDOWN_MS = 2000;

export default function AttendanceScan() {
  const token = localStorage.getItem('token');
  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const scannerRef = useRef(null);
  const lastAtRef = useRef(0);

  const [lastText, setLastText] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // field selection
  const [fields, setFields] = useState([]);       // [{name, ...}]
  const [fieldInput, setFieldInput] = useState(''); // typed text
  const [selectedField, setSelectedField] = useState(''); // confirmed field
  const [scanning, setScanning] = useState(false);

  // load fields for type-ahead
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API}/api/fields`, { headers: authHeader });
        const items = Array.isArray(data?.items) ? data.items : [];
        setFields(items);
      } catch (e) {
        console.error('[fields load]', e);
        Toast.fire({ icon: 'error', title: 'Failed to load fields' });
      }
    })();
  }, []); // eslint-disable-line

  const startScanning = () => {
    const byName = fields.find(f => (f.name || '').toLowerCase().trim() === fieldInput.toLowerCase().trim());
    if (!byName) {
      Toast.fire({ icon: 'error', title: 'Please pick a valid field from suggestions before scanning.' });
      return;
    }
    setSelectedField(byName.name);
    setScanning(true);
    setMessage(`Scanning started for field: ${byName.name}`);
    Toast.fire({ icon: 'success', title: `Scanning started (${byName.name})` });
  };

  const stopScanning = () => {
    setScanning(false);
    setMessage('Scanner stopped.');
    Toast.fire({ icon: 'info', title: 'Scanner stopped' });
  };

  // init/destroy scanner bound to `scanning`
  useEffect(() => {
    if (!scanning) {
      try { scannerRef.current?.clear(); } catch {}
      scannerRef.current = null;
      return;
    }

    try {
      const config = {
        fps: 10,
        qrbox: { width: 280, height: 280 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        videoConstraints: { facingMode: 'environment' },
      };

      const onScanSuccess = (decodedText) => {
        if (!decodedText) return;
        if (decodedText === lastText) return;
        setLastText(decodedText);
        postCheckIn(decodedText);
      };

      const onScanError = () => {};

      scannerRef.current = new Html5QrcodeScanner('qr-reader-container', config, false);
      scannerRef.current.render(onScanSuccess, onScanError);
      setMessage((m) => m || 'Point camera at a worker QR code.');
    } catch (err) {
      console.error('[scanner init error]', err);
      setMessage('Camera init failed. Use HTTPS or localhost, and allow camera permission.');
      Sweet.fire({
        icon: 'error',
        title: 'Camera init failed',
        text: 'Use HTTPS or localhost and allow camera permission.',
      });
    }

    return () => {
      try { scannerRef.current?.clear(); } catch {}
      scannerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  function isValidHHMM(s) {
    return typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s.trim());
  }

  const postCheckIn = async (raw) => {
    const now = Date.now();
    if (now - lastAtRef.current < COOLDOWN_MS) return;
    lastAtRef.current = now;

    let workerId = String(raw).trim();

    try {
      const maybe = JSON.parse(raw);
      if (maybe && typeof maybe === 'object' && maybe.workerId) {
        workerId = String(maybe.workerId).trim();
      }
    } catch {}

    if (!workerId || /^https?:\/\//i.test(workerId)) {
      setMessage('Invalid QR. Use TEXT like W001 (or JSON with workerId).');
      Toast.fire({ icon: 'error', title: 'Invalid QR. Use TEXT like W001 (or JSON with workerId).' });
      return;
    }
    if (!selectedField) {
      setMessage('Select a field and start scanning first.');
      Toast.fire({ icon: 'error', title: 'Select a field and start scanning first.' });
      return;
    }

    let expectedOutTime = window.prompt('Expected OUT time (HH:mm, 24h)', '17:00') || '';
    expectedOutTime = expectedOutTime.trim();
    if (expectedOutTime && !isValidHHMM(expectedOutTime)) {
      Toast.fire({ icon: 'error', title: 'Time must be HH:mm, e.g., 17:00' });
      return;
    }

    try {
      setSaving(true);
      setMessage('Saving…');

      const { data } = await axios.post(
        `${API}/api/attendance/checkin`,
        { workerId, field: selectedField, expectedOutTime },
        { headers: { ...authHeader, 'Content-Type': 'application/json' } }
      );

      setMessage(
        `✅ ${data.workerName || data.workerId} • Field: ${data.field || selectedField} • In: ${data.checkInTime || '—'} • Expected out: ${data.expectedOutTime || '—'} • Status: ${data.status || 'present'}`
      );
      Toast.fire({ icon: 'success', title: 'Attendance saved' });
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || 'Save failed';
      setMessage(`❌ ${status ? status + ' ' : ''}${msg}`);
      console.error('[scan checkin error]', status, e?.response?.data || e);
      Sweet.fire({ icon: 'error', title: 'Save failed', text: msg });
    } finally {
      setSaving(false);
    }
  };

  const filteredFieldNames = fields
    .map(f => f.name || '')
    .filter(Boolean)
    .filter(n => !fieldInput.trim() || n.toLowerCase().includes(fieldInput.toLowerCase()));

  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-3xl p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">QR Attendance</h1>
          <div className="flex gap-2">
            <Link className="btn" to="/supervisor/attendance">Go to Attendance List</Link>
            <Link className="btn btn-ghost" to="/supervisor/attendance/new">Manual Entry</Link>
          </div>
        </div>

        {/* Field selector */}
        <div className="mt-4 rounded-2xl bg-base-100 p-4 shadow border">
          <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className="label">
                <span className="label-text"><MapPinned className="w-4 h-4 inline mr-2" />Select Field</span>
              </label>
              <input
                list="field-suggestions"
                className="input input-bordered w-full"
                placeholder="Type to search fields (e.g., 'Block A')"
                value={fieldInput}
                onChange={(e) => setFieldInput(e.target.value)}
                disabled={scanning}
              />
              <datalist id="field-suggestions">
                {filteredFieldNames.slice(0, 12).map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <div className="text-xs opacity-70 mt-1">
                Start typing and pick one of the suggested field names.
              </div>
            </div>

            {!scanning ? (
              <button className="btn btn-primary" onClick={startScanning} disabled={!fieldInput.trim()}>
                <Play className="w-4 h-4 mr-1" /> Start Scanning
              </button>
            ) : (
              <button className="btn btn-error" onClick={stopScanning}>
                <Square className="w-4 h-4 mr-1" /> Stop
              </button>
            )}
          </div>
        </div>

        {/* Scanner + status */}
        <div className="mt-4 rounded-2xl bg-base-100 p-4 shadow border">
          <div className="flex items-center justify-between">
            <div className="font-medium">
              <ScanLine className="w-4 h-4 inline mr-2" />
              {scanning ? `Scanning… (${selectedField || 'no field'})` : 'Scanner idle'}
            </div>
            <div className="text-sm opacity-70">Last: <code>{lastText || '—'}</code></div>
          </div>

          <div id="qr-reader-container" style={{ width: '100%' }} className="mt-3" />

          {saving && <div className="mt-2 alert">Saving…</div>}
          {message && <div className="mt-2 text-sm">{message}</div>}

          <div className="mt-3 text-xs opacity-60">
            <Clock className="w-3 h-3 inline mr-1" />
            Status is <b>late</b> if check-in after <b>08:30</b> (Sri Lanka time); otherwise <b>present</b>.
          </div>
        </div>
      </div>
    </div>
  );
}
