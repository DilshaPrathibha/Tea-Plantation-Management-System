import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Sweet } from "@/utils/sweet";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";
const TZ = "Asia/Colombo";
const SHIFT_START = "08:30";

const formatDateSL = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const formatTimeSL = () =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

const toMinutes = (value) => {
  if (!value || typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [h, m] = value.split(":");
  return Number(h) * 60 + Number(m);
};

const isAfter = (timeA, timeB) => {
  const a = toMinutes(timeA);
  const b = toMinutes(timeB);
  if (a === null || b === null) return false;
  return a > b;
};

const makeEmptyForm = () => ({
  workerId: "",
  workerName: "",
  date: formatDateSL(),
  checkInTime: formatTimeSL(),
  expectedOutTime: "17:30",
  field: "",
  status: "present",
  notes: "",
});

export default function AttendanceForm() {
  const token = localStorage.getItem("token");
  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState(() => makeEmptyForm());
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [workerQuery, setWorkerQuery] = useState("");
  const [workerOptions, setWorkerOptions] = useState([]);
  const [fieldOptions, setFieldOptions] = useState([]);

  const originalExpectedOutRef = useRef("");
  const todaySL = useMemo(() => formatDateSL(), []);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/api/attendance/${id}`, {
          headers: authHeader,
          signal: controller.signal,
        });
        const it = res.data.item;
        const next = {
          workerId: it.workerId || "",
          workerName: it.workerName || "",
          date: it.date || todaySL,
          checkInTime: it.checkInTime || "",
          expectedOutTime: it.expectedOutTime || "",
          field: it.field || "",
          status: it.status || "present",
          notes: "",
        };
        setForm(next);
        originalExpectedOutRef.current = next.expectedOutTime || "";
      } catch (error) {
        if (error?.code === "ERR_CANCELED") return;
        console.error("[attendance load]", error);
        const msg = error?.response?.data?.message || "Failed to load record";
        setErrorMessage(msg);
        await Sweet.error(msg);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [id, authHeader, todaySL]);

  useEffect(() => {
    if (id) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await axios.get(`${API}/api/fields`, {
          headers: authHeader,
          signal: controller.signal,
        });
        const raw = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
        const unique = Array.from(
          new Set(
            raw
              .map((item) => item?.name || item?.fieldName || "")
              .filter(Boolean)
          )
        );
        setFieldOptions(unique);
      } catch (error) {
        if (error?.code === "ERR_CANCELED") return;
        console.error("[fields list]", error);
      }
    })();

    return () => controller.abort();
  }, [id, authHeader]);

  useEffect(() => {
    if (id) return;
    const q = workerQuery.trim();
    if (!q) {
      setWorkerOptions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`${API}/api/people/search`, {
          headers: authHeader,
          params: { q },
          signal: controller.signal,
        });
        const items = Array.isArray(res.data?.items) ? res.data.items : [];
        setWorkerOptions(items);
      } catch (error) {
        if (error?.code === "ERR_CANCELED") return;
        console.error("[people search]", error);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [workerQuery, id, authHeader]);

  const timeChanged = () =>
    (form.expectedOutTime || "") !== (originalExpectedOutRef.current || "");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setValidationMessage("");

    if (!id) {
      if (!form.workerId || !form.workerName || !form.date || !form.checkInTime || !form.field) {
        setValidationMessage("Please fill all required fields.");
        await Sweet.info("Please fill all required fields.");
        return;
      }
      try {
        setLoading(true);
        const payload = { ...form };
        await axios.post(`${API}/api/attendance`, payload, {
          headers: { ...authHeader, "Content-Type": "application/json" },
        });
        await Sweet.success("Attendance added");
        navigate('/supervisor/attendance', { replace: true });
      } catch (error) {
        console.error("[attendance create]", error);
        const status = error?.response?.status;
        const msg = error?.response?.data?.message || "Save failed";
        if (status === 409) {
          setValidationMessage(msg);
          await Sweet.info(msg);
        } else {
          setErrorMessage(msg);
          await Sweet.error(msg);
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (timeChanged()) {
      const reason = form.notes.trim();
      if (reason.length < 3) {
        setValidationMessage("Please provide a short reason in Notes when changing expected time.");
        await Sweet.info("Please add a short reason in Notes.");
        return;
      }
    }

    try {
      setLoading(true);
      const payload = {
        expectedOutTime: form.expectedOutTime || "",
        notes: form.notes || "",
      };
      await axios.put(`${API}/api/attendance/${id}`, payload, {
        headers: { ...authHeader, "Content-Type": "application/json" },
      });
      await Sweet.success("Attendance updated");
      navigate('/supervisor/attendance', { replace: true });
    } catch (error) {
      console.error("[attendance update]", error);
      const msg = error?.response?.data?.message || "Save failed";
      setErrorMessage(msg);
      await Sweet.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl md:text-3xl font-bold">{id ? 'Edit Attendance' : 'Add Attendance'}</h1>

        {(errorMessage || validationMessage) && (
          <div className={`alert ${errorMessage ? 'alert-error' : 'alert-warning'} mt-4`}>
            <span>{errorMessage || validationMessage}</span>
          </div>
        )}

        <form className="mt-6 grid md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
          <div className="md:col-span-1">
            <label className="label"><span className="label-text">Emp ID</span></label>
            <input
              list="worker-suggestions"
              className="input input-bordered w-full"
              value={form.workerId}
              onChange={(event) => {
                const value = event.target.value.toUpperCase();
                const match = workerOptions.find(
                  (opt) => (opt.empId || '').toUpperCase() === value
                );
                setForm((prev) => ({
                  ...prev,
                  workerId: value,
                  workerName: !id && match?.name ? match.name : prev.workerName,
                }));
                setWorkerQuery(value);
              }}
              disabled={!!id}
              required
            />
            {!id && workerOptions.length > 0 && (
              <p className="text-xs opacity-60 mt-1">Select an ID to auto-fill the worker name.</p>
            )}
            <datalist id="worker-suggestions">
              {workerOptions.map((opt) => (
                <option
                  key={opt.empId || opt._id || opt.name}
                  value={(opt.empId || '').toUpperCase()}
                >
                  {(opt.empId || '').toUpperCase()} - {opt.name || ''}
                </option>
              ))}
            </datalist>
          </div>

          <div className="md:col-span-1">
            <label className="label"><span className="label-text">Worker Name</span></label>
            <input
              className="input input-bordered w-full"
              value={form.workerName}
              onChange={(event) => setForm((prev) => ({ ...prev, workerName: event.target.value }))}
              disabled={!!id}
              required
            />
          </div>

          <div className="md:col-span-1">
            <label className="label"><span className="label-text">Date</span></label>
            <input
              type="date"
              className="input input-bordered w-full"
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              disabled={!!id}
              min={todaySL}
              max={todaySL}
              required
            />
          </div>

          <div className="md:col-span-1">
            <label className="label"><span className="label-text">Check-in</span></label>
            <input
              type="time"
              className="input input-bordered w-full"
              value={form.checkInTime}
              onChange={(event) => setForm((prev) => ({ ...prev, checkInTime: event.target.value }))}
              disabled={!!id}
              required
            />
            {!id && (
              <span className="text-xs opacity-60">Auto-filled with current Sri Lanka time.</span>
            )}
          </div>

          <div className="md:col-span-1">
            <label className="label"><span className="label-text">Field</span></label>
            <input
              list="field-suggestions"
              className="input input-bordered w-full"
              autoComplete="off"
              value={form.field}
              onChange={(event) => setForm((prev) => ({ ...prev, field: event.target.value }))}
              disabled={!!id}
              required
            />
            <datalist id="field-suggestions">
              {fieldOptions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div className="md:col-span-1">
            <label className="label"><span className="label-text">Status</span></label>
            <input
              className="input input-bordered w-full capitalize"
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
              disabled={!!id}
              required
            />
            {!id && (
              <span className="text-xs opacity-60">Automatically set to late when check-in is after 08:30.</span>
            )}
          </div>

          <div className="md:col-span-1">
            <label className="label">
              <span className="label-text">Expected check-out (HH:mm)</span>
            </label>
            <input
              type="time"
              className="input input-bordered w-full"
              value={form.expectedOutTime}
              onChange={(event) => setForm((prev) => ({ ...prev, expectedOutTime: event.target.value }))}
              disabled={!id}
            />
            {id && (
              <div className="text-xs opacity-70 mt-1">
                Change only if the worker and supervisor agree on a new expected time.
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="label">
              <span className="label-text">
                Notes {id && timeChanged() ? '(required when expected time is changed)' : '(optional)'}
              </span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={3}
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder={id ? 'Reason for editing expected out time' : 'Notes (optional)'}
              required={id && timeChanged()}
            />
          </div>

          <div className="md:col-span-2">
            <button className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`} type="submit">
              {loading && <span className="loading loading-spinner loading-sm mr-2" />}
              {id ? 'Update' : 'Add'}
            </button>
            <button type="button" className="btn ml-2" onClick={() => navigate('/supervisor/attendance')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
