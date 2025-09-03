import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Check, X, User, ClipboardList, FileText, Calendar,
  Send, ArrowLeft, Sun, Cloud, CloudRain, Zap,
  ThermometerSun, Droplets, Wind, Info
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";


function ConditionIcon({ c, className = "w-5 h-5" }) {
  if (c === "Clear") return <Sun className={className} />;
  if (c === "Clouds") return <Cloud className={className} />;
  if (c === "Rain" || c === "Drizzle") return <CloudRain className={className} />;
  if (c === "Thunderstorm") return <Zap className={className} />;
  return <Cloud className={className} />;
}

export default function AssignTask() {
  const [workers, setWorkers] = useState([]);
  const [workerId, setWorkerId] = useState("");
  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // lightweight current weather (optional but nice)
  const [weather, setWeather] = useState(null);
  const [wErr, setWErr] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");



  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/api/auth/get-user?role=worker`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setWorkers(res.data || []);
      } catch {
        setErr("Failed to load workers");
      }
    })();
  }, [token]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/weather`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Weather unavailable');
        }
        setWeather(data);
      } catch (e) {
        setWErr(e.message || 'Weather unavailable');
      }
    })();
  }, [])



  async function submit(e) {
    e.preventDefault();
    setErr(""); setMsg("");
    if (!workerId || !taskName || !date) {
      setErr("Worker, Task name, and Date are required");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${API}/api/tasks/assign-task`,
        { workerId, taskName, taskDescription, date },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      setMsg("Task assigned successfully");
      setTimeout(() => navigate("/field-dashboard"), 900);
    } catch (e) {
      const m = e?.response?.data?.message || e?.response?.data || e?.message || "Failed to assign task";
      setErr(String(m));
    } finally {
      setLoading(false);
    }
  }



  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950">
      <div className="mx-auto max-w-4xl p-6">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between text-white">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Assign Task</h1>
            <p className="text-white/70">
              Pick a worker and set task details. Attendance & weather will be recorded automatically.
            </p>
          </div>
          <button className="btn btn-sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </button>
        </div>

        {/* Weather banner */}
        <div className="mb-5">
          {weather ? (
            <div
              className={`rounded-2xl border p-4 text-sm bg-white/10 backdrop-blur-xl text-white/90 ${
                weather.workAllowed ? "border-emerald-300/40" : "border-rose-300/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-white/10">
                  <ConditionIcon c={weather.condition} className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">
                    Avissawella • {weather.condition || "—"} {weather.tempC != null ? `• ${weather.tempC}°C` : ""}
                  </div>
                  <div className="text-white/70">
                    {weather.workAllowed
                      ? "Outdoor work allowed."
                      : "Weather not suitable for outdoor work — consider indoor tasks (sorting/packing/maintenance)."}
                  </div>
                </div>
                <div>
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-medium ${
                      weather.workAllowed ? "bg-green-200/90 text-emerald-800" : "bg-rose-200/90 text-rose-800"
                    }`}
                  >
                    {weather.workAllowed ? "OK" : "Not advised"}
                  </span>
                </div>
              </div>
              {weather?.alerts?.length ? (
                <div className="mt-2 text-xs text-white/80 flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5" />
                  <ul className="list-disc pl-4 space-y-0.5">
                    {weather.alerts.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              ) : null}
              <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-2">
                  <ThermometerSun className="w-4 h-4" /> Temp: <b>{weather.tempC ?? "—"}°C</b>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-2">
                  <Droplets className="w-4 h-4" /> Humidity: <b>{weather.humidity ?? "—"}%</b>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-2">
                  <Wind className="w-4 h-4" /> Wind: <b>{weather.windMs ?? "—"} m/s</b>
                </div>
              </div>
            </div>
          ) : wErr ? (
            <div className="rounded-2xl border border-rose-300/40 p-4 text-sm bg-rose-500/10 text-rose-100">
              {wErr}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 p-4 text-sm text-white/70 bg-white/5">
              Checking weather…
            </div>
          )}
        </div>

        {/* Alerts */}
        {msg && (
          <div className="alert alert-success mb-4">
            <Check className="w-4 h-4" />
            <span>{msg}</span>
          </div>
        )}
        {err && (
          <div className="alert alert-error mb-4">
            <X className="w-4 h-4" />
            <span>{err}</span>
          </div>
        )}

        {/* Main card */}
        <form
          onSubmit={submit}
          className="grid lg:grid-cols-2 gap-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-5 text-white"
        >
          {/* Left: form fields */}
          <div className="space-y-4">
            {/* Worker */}
            <label className="form-control">
              <span className="label-text text-white/90">Worker</span>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-black/70">
                  <User className="w-5 h-5" />
                </span>
                <select
                  className="select select-bordered w-full pl-10 bg-white/90 text-black"
                  value={workerId}
                  onChange={(e) => setWorkerId(e.target.value)}
                >
                  <option value="">Select a worker</option>
                  {workers.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} {w.estate ? `— ${w.estate}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            {/* Task name */}
            <label className="form-control">
              <span className="label-text text-white/90">Task name</span>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-black/70">
                  <ClipboardList className="w-5 h-5" />
                </span>
                <input
                  className="input input-bordered w-full pl-10 bg-white/90 text-black"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="e.g., Sort Grade B leaves"
                />
              </div>
            </label>

            {/* Description */}
            <label className="form-control">
              <span className="label-text text-white/90">Task description (optional)</span>
              <div className="relative">
                <span className="absolute left-3 top-3 text-black/70">
                  <FileText className="w-5 h-5" />
                </span>
                <textarea
                  className="textarea textarea-bordered w-full pl-10 bg-white/90 text-black"
                  rows={4}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Sorting at factory line 2"
                />
              </div>
            </label>

            {/* Date */}
            <label className="form-control">
              <span className="label-text text-white/90">Date</span>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-black/70">
                  <Calendar className="w-5 h-5" />
                </span>
                <input
                  type="date"
                  className="input input-bordered w-full pl-10 bg-white/90 text-black"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </label>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" className="btn" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Cancel
              </button>
              <button
                type="submit"
                className={`btn btn-primary ${loading ? "btn-disabled" : ""}`}
                disabled={loading || !workerId || !taskName || !date}
                title={!workerId || !taskName || !date ? "Select worker, enter task name, and select date" : ""}
              >
                {loading ? "Assigning..." : <>Assign Task <Send className="w-4 h-4 ml-1" /></>}
              </button>
            </div>
          </div>

          {/* Right: neat info box */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="text-white/90 font-medium mb-1">Tips</div>
              <ul className="text-sm text-white/70 list-disc pl-5 space-y-1">
                <li>Pick workers familiar with the estate area.</li>
                <li>For rainy/stormy days, prefer indoor tasks (sorting, packing, maintenance).</li>
                <li>Keep descriptions short but specific (e.g., “Sorting – line 2, 10:00–12:00”).</li>
              </ul>
            </div>

            {weather && weather.workAllowed === false && (
              <div className="rounded-2xl bg-rose-500/10 border border-rose-300/40 p-4 text-rose-100">
                <div className="font-medium mb-1">Weather caution</div>
                <div className="text-sm">
                  Conditions aren’t ideal for outdoor work. Consider assigning an indoor task.
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );  
}


