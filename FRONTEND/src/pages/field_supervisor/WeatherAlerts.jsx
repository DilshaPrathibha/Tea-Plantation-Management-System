import React, { useEffect, useRef, useState } from "react";
import {
  Sun, Cloud, CloudRain, Zap, ThermometerSun, Droplets, Wind,
  RefreshCcw, Clock, MapPin, AlertTriangle
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";
const INTERVAL_MS = 60_000; // 60s

// Map weather condition to icon + colors
function ConditionIcon({ c, className = "w-7 h-7" }) {
  if (c === "Sunny") return <Sun className={className} />;
  if (c === "Cloudy") return <Cloud className={className} />;
  if (c === "Rainy") return <CloudRain className={className} />;
  if (c === "Stormy") return <Zap className={className} />;
  return <Cloud className={className} />;
}
function tone(c) {
  switch (c) {
    case "Sunny":  return { text: "text-amber-500", ring: "ring-amber-200", chip: "bg-amber-100 text-amber-700" };
    case "Cloudy": return { text: "text-sky-500",   ring: "ring-sky-200",   chip: "bg-sky-100 text-sky-700" };
    case "Rainy":  return { text: "text-blue-500",  ring: "ring-blue-200",  chip: "bg-blue-100 text-blue-700" };
    case "Stormy": return { text: "text-rose-500",  ring: "ring-rose-200",  chip: "bg-rose-100 text-rose-700" };
    default:       return { text: "text-gray-500",  ring: "ring-gray-200",  chip: "bg-gray-100 text-gray-700" };
  }
}

export default function WeatherAlerts() {
  const [w, setW] = useState(null);
  const [err, setErr] = useState("");
  const [now, setNow] = useState(new Date());
  const [updatedAt, setUpdatedAt] = useState(null);
  const [live, setLive] = useState(true);
  const timerRef = useRef(null);

  // live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  async function load() {
    try {
      setErr("");
      const res = await fetch(`${API}/api/weather`);
      const data = await res.json();
      setW(data);
      setUpdatedAt(new Date());
    } catch {
      setErr("Failed to load weather.");
    }
  }

  // initial fetch
  useEffect(() => { load(); }, []);

  // auto-refresh
  useEffect(() => {
    function start() {
      if (timerRef.current) clearInterval(timerRef.current);
      if (live && document.visibilityState === "visible") {
        timerRef.current = setInterval(load, INTERVAL_MS);
      }
    }
    function onVis() { start(); }
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [live]);

  const dateStr = now.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const theme = tone(w?.condition);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-white">
      <div className="max-w-3xl mx-auto p-6 space-y-5">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl bg-white/10 ring-1 ${theme?.ring}`}>
              <ConditionIcon c={w?.condition} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Avissawella Weather</h1>
              <p className="text-white/70 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" /> {dateStr} • {timeStr}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn btn-sm" onClick={load}>
              <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
            </button>
            <label className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <input
                type="checkbox"
                className="toggle toggle-sm"
                checked={live}
                onChange={e => setLive(e.target.checked)}
              />
              Live
            </label>
          </div>
        </header>

        {/* Error / Loading */}
        {err && <div className="alert alert-error">{err}</div>}
        {!w && !err && <div className="text-white/70">Loading…</div>}

        {/* Card */}
        {w && (
          <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-5 shadow-2xl">
            {/* Top row: condition + chip */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ConditionIcon c={w.condition} className="w-8 h-8" />
                <div className="text-xl font-medium">{w.condition || "—"}</div>
              </div>
              <span className={`px-3 py-1 rounded-xl text-xs font-medium ${w.workAllowed ? "bg-green-200/90 text-emerald-800" : "bg-rose-200/90 text-rose-800"}`}>
                {w.workAllowed ? "Outdoor work allowed" : "Outdoor work NOT advised"}
              </span>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <ThermometerSun className="w-4 h-4" /> Temperature
                </div>
                <div className="mt-1 text-2xl font-semibold">{w.tempC ?? "—"}°C</div>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <Droplets className="w-4 h-4" /> Humidity
                </div>
                <div className="mt-1 text-2xl font-semibold">{w.humidity ?? "—"}%</div>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <Wind className="w-4 h-4" /> Wind
                </div>
                <div className="mt-1 text-2xl font-semibold">{w.windMs ?? "—"} m/s</div>
              </div>
            </div>

            {/* Alerts */}
            <div className="mt-5">
              <div className="flex items-center gap-2 text-sm font-medium text-white/80">
                <AlertTriangle className="w-4 h-4" /> Alerts
              </div>
              {w.alerts?.length ? (
                <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-white/85">
                  {w.alerts.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              ) : (
                <div className="mt-2 text-sm text-white/60">No alerts right now.</div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-5 text-xs text-white/60">
              Last updated: {updatedAt ? updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"} • Source: /api/weather
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
