// FRONTEND/src/pages/admin/FieldsPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import axios from "axios";
import { ArrowLeft, Leaf, MapPin, RefreshCw, Save, Trash2, Edit3, X, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

/** Dynamically load Leaflet (CSS+JS) from CDN so we don’t need npm installs */
function useLeaflet() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.L && window.L.map) {
      setReady(true);
      return;
    }
    const cssId = "leaflet-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const jsId = "leaflet-js";
    if (!document.getElementById(jsId)) {
      const script = document.createElement("script");
      script.id = jsId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => setReady(true);
      document.body.appendChild(script);
    } else {
      setReady(true);
    }
  }, []);

  return ready;
}

const FieldsPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const leafletReady = useLeaflet();
  const mapEl = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);

  const [listLoading, setListLoading] = useState(false);
  const [fields, setFields] = useState([]);            // always an array
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Create form (7+ fields)
  const [form, setForm] = useState({
    name: "",
    teaType: "",
    status: "active",
    estimatedRevenue: "",
    propertyValue: "",
    remarks: "",
    location: { address: "", lat: null, lng: null },
  });

  // Free address search (Nominatim)
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);          // always an array
  const [searching, setSearching] = useState(false);

  // Edit modal
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  // Init Leaflet map
  useEffect(() => {
    if (!leafletReady || !mapEl.current || map.current) return;
    const L = window.L;

    map.current = L.map(mapEl.current, {
      center: [6.9271, 79.8612], // Colombo fallback
      zoom: 7,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map.current);

    marker.current = L.marker([6.9271, 79.8612], { draggable: true }).addTo(map.current);

    // click map to set coordinates
    map.current.on("click", (e) => {
      const { lat, lng } = e.latlng;
      marker.current.setLatLng([lat, lng]);
      setForm((p) => ({ ...p, location: { ...p.location, lat, lng } }));
    });

    // drag marker to update coords
    marker.current.on("dragend", () => {
      const { lat, lng } = marker.current.getLatLng();
      setForm((p) => ({ ...p, location: { ...p.location, lat, lng } }));
    });
  }, [leafletReady]);

  const fetchFields = async () => {
    try {
      setListLoading(true);
      const res = await axios.get(`${API}/api/fields?page=${page}&limit=${limit}`, { headers: authHeader });
      const items = Array.isArray(res?.data?.items) ? res.data.items : [];
      setFields(items);
      setTotal(Number(res?.data?.total || 0));
      setError("");
    } catch (e) {
      console.error(e);
      setFields([]);           // <- keep it an array
      setTotal(0);
      setError(e?.response?.data?.message || "Server error loading fields");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Free geocode search (Nominatim)
  const searchAddress = async () => {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    try {
      setSearching(true);
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        search
      )}&format=json&limit=5&addressdetails=1`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const pickResult = (r) => {
    if (!r) return;
    const lat = Number(r.lat);
    const lng = Number(r.lon);
    const address = r.display_name || search;
    setForm((p) => ({ ...p, location: { address, lat, lng } }));
    setSearch(address);
    setResults([]);
    if (map.current && marker.current && !Number.isNaN(lat) && !Number.isNaN(lng)) {
      map.current.setView([lat, lng], 14);
      marker.current.setLatLng([lat, lng]);
    }
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const payload = {
        ...form,
        estimatedRevenue: form.estimatedRevenue ? Number(form.estimatedRevenue) : 0,
        propertyValue: form.propertyValue ? Number(form.propertyValue) : 0,
      };
      await axios.post(`${API}/api/fields`, payload, {
        headers: { ...authHeader, "Content-Type": "application/json" },
      });
      // reset
      setForm({
        name: "",
        teaType: "",
        status: "active",
        estimatedRevenue: "",
        propertyValue: "",
        remarks: "",
        location: { address: "", lat: null, lng: null },
      });
      if (map.current && marker.current) {
        marker.current.setLatLng([6.9271, 79.8612]);
        map.current.setView([6.9271, 79.8612], 7);
      }
      setSearch("");
      setResults([]);
      fetchFields();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to create field");
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (f) => {
    if (!f) return;
    setEditing(f);
    setEditData({
      name: f.name || "",
      teaType: f.teaType || "",
      status: f.status || "active",
      estimatedRevenue: f.estimatedRevenue || 0,
      propertyValue: f.propertyValue || 0,
      remarks: f.remarks || "",
      location: {
        address: f.location?.address || "",
        lat: typeof f.location?.lat === "number" ? f.location.lat : null,
        lng: typeof f.location?.lng === "number" ? f.location.lng : null,
      },
    });
  };

  const saveEdit = async () => {
    if (!editing || !editData) return;
    setSaving(true);
    try {
      await axios.patch(`${API}/api/fields/${editing._id || editing.id}`, editData, {
        headers: { ...authHeader, "Content-Type": "application/json" },
      });
      setEditing(null);
      setEditData(null);
      fetchFields();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to update field");
    } finally {
      setSaving(false);
    }
  };

  const deleteField = async (id) => {
    if (!id) return;
    if (!confirm("Delete this field?")) return;
    try {
      await axios.delete(`${API}/api/fields/${id}`, { headers: authHeader });
      fetchFields();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to delete");
    }
  };

  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const safeFields = Array.isArray(fields) ? fields : [];
  const safeResults = Array.isArray(results) ? results : [];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-6xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/admin-dashboard")}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <Leaf className="w-6 h-6 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Tea Fields</h1>
          <button className="btn btn-ghost ml-auto" onClick={fetchFields}>
            <RefreshCw className={`w-4 h-4 ${listLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {error && <div className="alert alert-error mb-4"><span>{error}</span></div>}

        {/* Create Field */}
        <div className="rounded-2xl bg-base-100 p-6 shadow border border-base-200">
          <h2 className="text-lg font-semibold mb-4">Add New Field</h2>
          <form onSubmit={onCreate} className="grid md:grid-cols-3 gap-4">
            <input className="input input-bordered" placeholder="Field name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            <input className="input input-bordered" placeholder="Tea type (e.g. Black, Green)" value={form.teaType} onChange={(e) => setForm((p) => ({ ...p, teaType: e.target.value }))} />
            <select className="select select-bordered" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="sold">Sold</option>
              <option value="archived">Archived</option>
            </select>

            <input className="input input-bordered" type="number" step="0.01" placeholder="Estimated revenue" value={form.estimatedRevenue} onChange={(e) => setForm((p) => ({ ...p, estimatedRevenue: e.target.value }))} />
            <input className="input input-bordered" type="number" step="0.01" placeholder="Property value" value={form.propertyValue} onChange={(e) => setForm((p) => ({ ...p, propertyValue: e.target.value }))} />

            {/* Free address search (Nominatim) */}
            <div className="md:col-span-2">
              <div className="join w-full">
                <input
                  className="input input-bordered join-item w-full"
                  placeholder="Search address (OpenStreetMap / Nominatim)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button type="button" className="btn join-item" onClick={searchAddress} disabled={searching}>
                  <Search className="w-4 h-4" />
                  {searching ? "Searching..." : "Search"}
                </button>
              </div>
              {safeResults.length > 0 && (
                <ul className="menu bg-base-100 rounded-box mt-2 border border-base-200 max-h-44 overflow-auto">
                  {safeResults.map((r, i) => (
                    <li key={i}>
                      <button type="button" onClick={() => pickResult(r)}>{r.display_name}</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <input
              className="input input-bordered"
              placeholder="Chosen address (editable)"
              value={form.location.address}
              onChange={(e) => setForm((p) => ({ ...p, location: { ...p.location, address: e.target.value } }))}
            />

            <textarea className="textarea textarea-bordered md:col-span-3" placeholder="Remarks" rows={2} value={form.remarks} onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))} />

            {/* Map */}
            <div className="md:col-span-3 rounded-xl border border-base-300 overflow-hidden">
              <div className="px-3 py-2 bg-base-200 flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" />
                Click map or drag marker • Lat: {form.location.lat ?? "-"} | Lng: {form.location.lng ?? "-"}
              </div>
              <div ref={mapEl} style={{ height: 320 }} />
            </div>

            <div className="md:col-span-3">
              <button className={`btn btn-primary ${creating ? "btn-disabled" : ""}`} type="submit">
                {creating ? <span className="loading loading-spinner loading-sm mr-2" /> : null}
                Save Field
              </button>
            </div>
          </form>
        </div>

        {/* Fields table */}
        <div className="mt-6 rounded-2xl bg-base-100 p-6 shadow border border-base-200">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Tea Type</th>
                  <th>Status</th>
                  <th>Revenue</th>
                  <th>Value</th>
                  <th>Address</th>
                  <th>Lat/Lng</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {safeFields.length > 0 ? (
                  safeFields.map((f) => (
                    <tr key={f._id || f.id}>
                      <td>{f.name}</td>
                      <td>{f.teaType || "-"}</td>
                      <td className="capitalize">{f.status}</td>
                      <td>{f.estimatedRevenue?.toLocaleString?.() ?? f.estimatedRevenue}</td>
                      <td>{f.propertyValue?.toLocaleString?.() ?? f.propertyValue}</td>
                      <td className="max-w-[240px] truncate" title={f.location?.address || ""}>
                        {f.location?.address || "-"}
                      </td>
                      <td>
                        {typeof f.location?.lat === "number" && typeof f.location?.lng === "number"
                          ? `${f.location.lat.toFixed(5)}, ${f.location.lng.toFixed(5)}`
                          : "-"}
                      </td>
                      <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button className="btn btn-sm" onClick={() => openEdit(f)}><Edit3 className="w-4 h-4 mr-1" />Edit</button>
                          <button className="btn btn-sm btn-error" onClick={() => deleteField(f._id || f.id)}><Trash2 className="w-4 h-4 mr-1" />Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center text-base-content/60">
                      {listLoading ? "Loading…" : "No fields found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-base-content/70">
              Page {page} of {Math.max(Math.ceil(total / limit), 1)} • {total} total
            </div>
            <div className="join">
              <button className="btn join-item" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>« Prev</button>
              <button className="btn join-item" disabled={page >= Math.max(Math.ceil(total / limit), 1)} onClick={() => setPage((p) => Math.min(Math.max(Math.ceil(total / limit), 1), p + 1))}>Next »</button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && editData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-base-100 rounded-2xl p-6 w-full max-w-3xl border border-base-300 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Edit Field</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(null); setEditData(null); }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <input className="input input-bordered" placeholder="Field name" value={editData.name} onChange={(e) => setEditData((p) => ({ ...p, name: e.target.value }))} />
              <input className="input input-bordered" placeholder="Tea type" value={editData.teaType} onChange={(e) => setEditData((p) => ({ ...p, teaType: e.target.value }))} />
              <select className="select select-bordered" value={editData.status} onChange={(e) => setEditData((p) => ({ ...p, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="sold">Sold</option>
                <option value="archived">Archived</option>
              </select>

              <input className="input input-bordered" type="number" step="0.01" placeholder="Estimated revenue" value={editData.estimatedRevenue} onChange={(e) => setEditData((p) => ({ ...p, estimatedRevenue: e.target.value }))} />
              <input className="input input-bordered" type="number" step="0.01" placeholder="Property value" value={editData.propertyValue} onChange={(e) => setEditData((p) => ({ ...p, propertyValue: e.target.value }))} />
              <input className="input input-bordered" placeholder="Address" value={editData.location.address} onChange={(e) => setEditData((p) => ({ ...p, location: { ...p.location, address: e.target.value } }))} />

              <textarea className="textarea textarea-bordered md:col-span-3" placeholder="Remarks" rows={2} value={editData.remarks} onChange={(e) => setEditData((p) => ({ ...p, remarks: e.target.value }))} />

              <div className="md:col-span-3 grid grid-cols-2 gap-4">
                <input className="input input-bordered" type="number" step="0.000001" placeholder="Latitude" value={editData.location.lat ?? ""} onChange={(e) => setEditData((p) => ({ ...p, location: { ...p.location, lat: e.target.value ? Number(e.target.value) : null } }))} />
                <input className="input input-bordered" type="number" step="0.000001" placeholder="Longitude" value={editData.location.lng ?? ""} onChange={(e) => setEditData((p) => ({ ...p, location: { ...p.location, lng: e.target.value ? Number(e.target.value) : null } }))} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button className="btn" onClick={() => { setEditing(null); setEditData(null); }}>Cancel</button>
              <button className={`btn btn-primary ${saving ? "btn-disabled" : ""}`} onClick={saveEdit}>
                {saving ? <span className="loading loading-spinner loading-sm mr-2" /> : <Save className="w-4 h-4 mr-1" />}
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default FieldsPage;
