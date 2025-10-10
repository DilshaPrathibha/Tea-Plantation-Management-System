import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Leaf,
  ArrowLeft,
  RefreshCw,
  Plus,
  Pencil,
  Save,
  Trash2,
  Search,
  Download,
  X as XIcon,
  LocateFixed,
  Image as ImageIcon,
} from "lucide-react";
import MapPicker from "../../components/MapPickerOSM.jsx"; // ⬅️ OSM
import { Sweet } from "@/utils/sweet";

import toast from "react-hot-toast";
import { uploadFieldImage, deriveStoragePath } from "@/utils/supabaseUpload";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";
const COMPANY = { name: "Celloanleaf", email: "ceylonleaf@gmail.com", phone: "" };

// Dropdown list, but we still store a plain string in `teaType`
const TEA_TYPES = ["Black", "Green", "White", "Oolong", "Herbal", "Other"];

const newField = () => ({
  name: "",
  teaType: "",
  status: "Active", // Active | Sold | Archived
  revenue: "",
  value: "",
  address: "",
  remarks: "",
  lat: "",
  lng: "",
  images: [],
  // keep this key to avoid breaking anything that might read it,
  // but we don't render it in the UI anymore:
  searchAddress: "",
});

const emptyEdit = () => ({ id: "", ...newField() });

function sortDescByCreated(a, b) {
  const ta = new Date(a?.createdAt || 0).getTime();
  const tb = new Date(b?.createdAt || 0).getTime();
  return tb - ta;
}

function normalizeNumber(val) {
  if (val === "" || val === null || val === undefined) return "";
  const n = Number(val);
  if (Number.isNaN(n)) return "";
  return Number(n.toFixed(6));
}

export default function FieldsPage() {
  const token = localStorage.getItem("token");
  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(newField());
  const [creating, setCreating] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [edit, setEdit] = useState(emptyEdit());
  const [savingEdit, setSavingEdit] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const [error, setError] = useState("");

  const MAX_IMAGE_COUNT = 5;
  const MAX_IMAGE_SIZE_MB = 4;
  const MAX_IMAGE_SIZE = MAX_IMAGE_SIZE_MB * 1024 * 1024;

  const normalizeImages = (list = []) => {
    if (!Array.isArray(list)) return [];
    return list
      .map((img, idx) => {
        const url = typeof img?.url === "string" ? img.url.trim() : "";
        if (!url) return null;
        const nameValue = typeof img?.name === "string" ? img.name.trim() : "";
        const pathValue =
          typeof img?.path === "string" && img.path
            ? img.path
            : deriveStoragePath(url);
        const idValue = img?.id || img?._id || pathValue || url || `field-image-${idx}`;
        return {
          id: idValue,
          name: nameValue || `Image ${idx + 1}`,
          url,
          path: pathValue || "",
        };
      })
      .filter(Boolean);
  };

const toPayloadImages = (images = []) =>
  Array.isArray(images)
    ? images
        .filter((img) => img && img.url)
        .slice(0, MAX_IMAGE_COUNT)
        .map(({ name, url }) => ({ name: typeof name === "string" ? name.trim() : '', url }))
    : [];

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const viewImages = (field) => {
  const images = normalizeImages(field?.images);
  if (!images.length) {
    Sweet.info("No images uploaded for this field yet.");
    return;
  }

  const html = images
    .map((img, idx) => {
      const safeUrl = escapeHtml(img.url || "");
      const safeName = escapeHtml(img.name || `Image ${idx + 1}`);
      return `
        <figure style="margin:0 0 18px;">
          <img src="${safeUrl}" alt="${safeName}" style="width:100%;border-radius:12px;object-fit:cover;margin-bottom:8px;" />
          <figcaption style="font-size:0.85rem;color:#9ca3af;">${safeName}</figcaption>
        </figure>
      `;
    })
    .join("");

  Sweet.fire({
    title: field?.name ? `Images – ${escapeHtml(field.name)}` : "Field images",
    html,
    width: "60rem",
    showCloseButton: true,
    confirmButtonText: "Close",
    focusConfirm: true,
    scrollbarPadding: false,
  });
};

  const uploadImages = async (fileList, currentImages = [], setter) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const currentCount = Array.isArray(currentImages) ? currentImages.length : 0;
    let available = MAX_IMAGE_COUNT - currentCount;
    if (available <= 0) {
      toast.error(`Maximum ${MAX_IMAGE_COUNT} images allowed.`);
      return;
    }
    if (files.length > available) {
      toast(available === 1 ? 'Only one more image allowed.' : `Only ${available} additional images can be added.`);
    }

    for (const file of files.slice(0, available)) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image.`);
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`${file.name} exceeds ${MAX_IMAGE_SIZE_MB} MB.`);
        continue;
      }

      try {
        const { url, path } = await uploadFieldImage(file);
        setter((prev) => {
          const existing = Array.isArray(prev.images) ? prev.images : [];
          const nextImages = [
            ...existing,
            {
              id: path || url,
              name: file.name,
              url,
              path: path || "",
            },
          ].slice(0, MAX_IMAGE_COUNT);
          return { ...prev, images: nextImages };
        });
      } catch (err) {
        console.error('[image upload]', err);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  };

  const handleFormImages = async (event) => {
    await uploadImages(event.target.files, form.images, setForm);
    event.target.value = '';
  };

  const handleEditImages = async (event) => {
    await uploadImages(event.target.files, edit.images, setEdit);
    event.target.value = '';
  };

  const removeFormImage = (id) =>
    setForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter((img) => img.id !== id),
    }));

  const removeEditImage = (id) =>
    setEdit((prev) => ({
      ...prev,
      images: (prev.images || []).filter((img) => img.id !== id),
    }));

  const fetchAll = async () => {
    try {
      setError("");
      setLoading(true);
      const res = await axios.get(`${API}/api/fields`, { headers: authHeader });
      const rows = Array.isArray(res.data?.items) ? res.data.items : res.data || [];
      rows.sort(sortDescByCreated);
      setItems(rows.map((row) => ({ ...row, images: normalizeImages(row.images) })));
      if (rows.length) await Sweet.success("Fields loaded");
    } catch (e) {
      console.error('[fields load]', e);
      const msg = e?.response?.data?.message || "Failed to load fields";
      setError(msg);
      await Sweet.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const payload = {
        ...form,
        lat: form.lat === "" ? undefined : Number(form.lat),
        lng: form.lng === "" ? undefined : Number(form.lng),
        images: toPayloadImages(form.images),
      };
      await axios.post(`${API}/api/fields`, payload, {
        headers: { ...authHeader, "Content-Type": "application/json" },
      });
      await Sweet.success("Field created");
      setForm(newField());
      setShowCreate(false);
      fetchAll();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || "Failed to create field";
      setError(msg);
      await Sweet.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const openEdit = async (row) => {
    const id = row?._id || row?.id;
    if (!id) {
      toast.error('Field is missing an identifier');
      return;
    }

    const base = {
      id,
      name: row?.name || "",
      teaType: row?.teaType || "",
      status: row?.status || "Active",
      revenue: row?.revenue || "",
      value: row?.value || "",
      address: row?.address || "",
      remarks: row?.remarks || "",
      lat: row?.lat ?? "",
      lng: row?.lng ?? "",
      images: normalizeImages(row?.images),
      searchAddress: "",
    };

    setEdit(base);
    setShowEdit(true);
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      setEditLoading(true);
      const res = await axios.get(`${API}/api/fields/${id}`, { headers: authHeader });
      const field = res.data?.field;
      if (field) {
        setEdit({
          id,
          name: field.name || "",
          teaType: field.teaType || "",
          status: field.status || "Active",
          revenue: field.revenue || "",
          value: field.value || "",
          address: field.address || "",
          remarks: field.remarks || "",
          lat: field.lat ?? "",
          lng: field.lng ?? "",
          images: normalizeImages(field.images),
          searchAddress: "",
        });
      }
    } catch (err) {
      console.error('[field load]', err);
      toast.error(err?.response?.data?.message || 'Failed to load latest field data');
    } finally {
      setEditLoading(false);
    }
  };

  const cancelEdit = () => {
    setShowEdit(false);
    setEdit(emptyEdit());
    setEditLoading(false);
  };

  const onSaveEdit = async (e) => {
    e.preventDefault();
    if (!edit.id) return;
    setSavingEdit(true);
    setError("");
    try {
      const payload = {
        ...edit,
        lat: edit.lat === "" ? undefined : Number(edit.lat),
        lng: edit.lng === "" ? undefined : Number(edit.lng),
        images: toPayloadImages(edit.images),
      };
      delete payload.id;
      delete payload.searchAddress;
      await axios.put(`${API}/api/fields/${edit.id}`, payload, {
        headers: { ...authHeader, "Content-Type": "application/json" },
      });
      await Sweet.success("Field updated");
      setShowEdit(false);
      setEdit(emptyEdit());
      fetchAll();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || "Failed to update field";
      setError(msg);
      await Sweet.error(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  const onDelete = async (id) => {
    const ok = await Sweet.confirm("Delete this field?");
    if (!ok) return;
    try {
      await axios.delete(`${API}/api/fields/${id}`, { headers: authHeader });
      await Sweet.success("Field deleted");
      fetchAll();
    } catch (e) {
      console.error(e);
      await Sweet.error(e?.response?.data?.message || "Failed to delete");
    }
  };

  const filtered = items.filter((r) => {
    if (!q.trim()) return true;
    const t = q.trim().toLowerCase();
    return (
      (r.name || "").toLowerCase().includes(t) ||
      (r.teaType || "").toLowerCase().includes(t) ||
      (r.status || "").toLowerCase().includes(t) ||
      (r.address || "").toLowerCase().includes(t)
    );
  });

  const exportPdf = async () => {
    const w = window.open("", "_blank");
    if (!w) return Sweet.error("Please allow popups to export.");
    const style = `
      <style>
        * { font-family: Arial, Helvetica, sans-serif; }
        .header { display:flex; justify-content:space-between; align-items:center; }
        .title { font-size:20px; font-weight:bold; margin:0; }
        .meta { font-size:12px; color:#444; text-align:right; }
        .hr { border:0; border-top:1px solid #ddd; margin:12px 0; }
        table { width:100%; border-collapse:collapse; font-size:12px; }
        th, td { border:1px solid #ddd; padding:6px 8px; }
        th { background:#f3f3f3; text-align:left; }
        .small { font-size:11px; color:#444; }
      </style>
    `;
    const now = new Date();
    const rowsHtml = filtered
      .map(
        (r) => `
      <tr>
        <td>${r.name || ""}</td>
        <td>${r.teaType || ""}</td>
        <td>${r.status || ""}</td>
        <td>${r.revenue || ""}</td>
        <td>${r.value || ""}</td>
        <td>${r.address || ""}</td>
        <td>${r.lat ?? "-"}, ${r.lng ?? "-"}</td>
        <td>${r.remarks ? String(r.remarks).replace(/</g, "&lt;") : ""}</td>
      </tr>`
      )
      .join("");

    const html = `
      <!doctype html><html><head><meta charset="utf-8">${style}</head><body>
        <div class="header">
          <div>
            <h1 class="title">${COMPANY.name}</h1>
            <div class="small">
              ${COMPANY.phone ? `Phone: ${COMPANY.phone} &nbsp;•&nbsp; ` : ""}Email: ${COMPANY.email}
            </div>
          </div>
          <div class="meta">Generated: ${now.toLocaleString()}<br/>${q ? `Search: "${q}"` : "Search: (none)"}</div>
        </div>
        <hr class="hr"/>
        <h2 style="margin:0 0 8px 0;">Tea Fields Report</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Tea Type</th><th>Status</th><th>Estimated revenue</th>
              <th>Property value</th><th>Address</th><th>Lat/Lng</th><th>Remarks</th>
            </tr>
          </thead>
          <tbody>${rowsHtml || `<tr><td colspan="8" style="text-align:center;color:#666;">No data</td></tr>`}</tbody>
        </table>
      </body></html>`;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.onload = () => {
      w.focus();
      w.print();
    };
    await Sweet.success("Export ready — use your browser’s print to save as PDF.");
  };

  // 🔒 Prevent Enter from submitting the form (except clicking the Save button)
  const blockEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="btn btn-ghost">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <Leaf className="w-6 h-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">Tea Fields</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn" onClick={() => setShowCreate((s) => !s)}>
              <Plus className="w-4 h-4 mr-1" /> {showCreate ? "Hide form" : "Add field"}
            </button>
            <button className="btn btn-ghost" onClick={fetchAll}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error mt-4">
            <span>{error}</span>
          </div>
        )}

        {/* Edit form */}
        {showEdit && (
          <div className="mt-6 rounded-2xl bg-base-100 p-6 shadow border border-base-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">
                <Pencil className="w-5 h-5 inline text-primary mr-2" /> Edit Field
              </h2>
              <button className="btn btn-ghost" onClick={cancelEdit}>
                <XIcon className="w-4 h-4 mr-1" /> Cancel
              </button>
            </div>

            <form onSubmit={onSaveEdit} onKeyDown={blockEnter} className="space-y-4">
              {editLoading && (
                <div className="alert alert-info">
                  <span>Refreshing latest field data...</span>
                </div>
              )}
              <div className="grid md:grid-cols-3 gap-3">
                <input
                  className="input input-bordered"
                  placeholder="Field name"
                  value={edit.name}
                  onChange={(e) => setEdit((s) => ({ ...s, name: e.target.value }))}
                  required
                />

                {/* teaType → dropdown (still a string) */}
                <select
                  className="select select-bordered"
                  value={edit.teaType}
                  onChange={(e) => setEdit((s) => ({ ...s, teaType: e.target.value }))}
                >
                  <option value="">Select tea type…</option>
                  {TEA_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <select
                  className="select select-bordered"
                  value={edit.status}
                  onChange={(e) => setEdit((s) => ({ ...s, status: e.target.value }))}
                >
                  <option>Active</option>
                  <option>Sold</option>
                  <option>Archived</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <input
                  className="input input-bordered"
                  placeholder="Estimated revenue"
                  value={edit.revenue}
                  onChange={(e) => setEdit((s) => ({ ...s, revenue: e.target.value }))}
                />
                <input
                  className="input input-bordered"
                  placeholder="Property value"
                  value={edit.value}
                  onChange={(e) => setEdit((s) => ({ ...s, value: e.target.value }))}
                />
              </div>

              {/* 🗺️ OSM Map Picker handles search + geolocation */}
              <MapPicker
                value={{
                  lat: typeof edit.lat === "number" ? edit.lat : Number(edit.lat) || undefined,
                  lng: typeof edit.lng === "number" ? edit.lng : Number(edit.lng) || undefined,
                  address: edit.address || "",
                }}
                onChange={(loc) =>
                  setEdit((s) => ({
                    ...s,
                    lat: normalizeNumber(loc.lat),
                    lng: normalizeNumber(loc.lng),
                    address: loc.address || s.address,
                  }))
                }
                height={300}
                zoom={15}
              />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Field images</span>
                  <span className="text-xs text-base-content/70">{(Array.isArray(edit.images) ? edit.images.length : 0)}/{MAX_IMAGE_COUNT}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {(Array.isArray(edit.images) ? edit.images : []).map((img) => (
                    <div
                      key={img.id}
                      className="relative h-24 w-32 overflow-hidden rounded-lg border border-base-300 bg-base-200/50"
                    >
                      <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        className="btn btn-xs btn-error absolute right-1 top-1 px-2"
                        onClick={() => removeEditImage(img.id)}
                        title="Remove image"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {(!Array.isArray(edit.images) || edit.images.length < MAX_IMAGE_COUNT) && (
                    <label
                      htmlFor="edit-field-images"
                      className="flex h-24 w-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-base-300 bg-base-200/40 text-xs text-base-content/70 hover:border-primary hover:text-primary"
                    >
                      <ImageIcon className="h-5 w-5" />
                      <span>Add images</span>
                    </label>
                  )}
                </div>
                <input
                  id="edit-field-images"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleEditImages}
                />
                <p className="text-xs text-base-content/60">
                  Up to {MAX_IMAGE_COUNT} images (max {MAX_IMAGE_SIZE_MB} MB each).
                </p>
              </div>


              {/* Coordinates */}
              <div className="grid md:grid-cols-2 gap-3">
                <div className="join w-full">
                  <input
                    className="input input-bordered join-item w-full"
                    placeholder="Latitude"
                    value={edit.lat}
                    inputMode="decimal"
                    onChange={(e) =>
                      setEdit((s) => ({ ...s, lat: e.target.value.replace(/[^0-9.\-]/g, "") }))
                    }
                  />
                  <button
                    type="button"
                    className="btn join-item"
                    onClick={() =>
                      setEdit((s) => ({ ...s, lat: normalizeNumber(s.lat), lng: normalizeNumber(s.lng) }))
                    }
                    title="Normalize"
                  >
                    <LocateFixed className="w-4 h-4 mr-1" /> Fix
                  </button>
                </div>

                <div className="join w-full">
                  <input
                    className="input input-bordered join-item w-full"
                    placeholder="Longitude"
                    value={edit.lng}
                    inputMode="decimal"
                    onChange={(e) =>
                      setEdit((s) => ({ ...s, lng: e.target.value.replace(/[^0-9.\-]/g, "") }))
                    }
                  />
                  <button
                    type="button"
                    className="btn join-item"
                    onClick={() =>
                      setEdit((s) => ({ ...s, lat: normalizeNumber(s.lat), lng: normalizeNumber(s.lng) }))
                    }
                  >
                    <LocateFixed className="w-4 h-4 mr-1" /> Fix
                  </button>
                </div>
              </div>

              <textarea
                className="textarea textarea-bordered w-full"
                rows={3}
                placeholder="Remarks"
                value={edit.remarks}
                onChange={(e) => setEdit((s) => ({ ...s, remarks: e.target.value }))}
              />

              <button className={`btn btn-primary ${savingEdit ? "btn-disabled" : ""}`} type="submit">
                {savingEdit && <span className="loading loading-spinner loading-sm mr-2" />}
                <Save className="w-4 h-4 mr-1" /> Save changes
              </button>
            </form>
          </div>
        )}

        {/* Create form */}
        {showCreate && (
          <div className="mt-6 rounded-2xl bg-base-100 p-6 shadow border border-base-200">
            <h2 className="text-lg font-semibold mb-3">Add New Field</h2>
            <form onSubmit={onCreate} onKeyDown={blockEnter} className="space-y-4">
              <div className="grid md:grid-cols-3 gap-3">
                <input
                  className="input input-bordered"
                  placeholder="Field name"
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  required
                />

                {/* teaType → dropdown (still string) */}
                <select
                  className="select select-bordered"
                  value={form.teaType}
                  onChange={(e) => setForm((s) => ({ ...s, teaType: e.target.value }))}
                >
                  <option value="">Select tea type…</option>
                  {TEA_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <select
                  className="select select-bordered"
                  value={form.status}
                  onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
                >
                  <option>Active</option>
                  <option>Sold</option>
                  <option>Archived</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <input
                  className="input input-bordered"
                  placeholder="Estimated revenue"
                  value={form.revenue}
                  onChange={(e) => setForm((s) => ({ ...s, revenue: e.target.value }))}
                />
                <input
                  className="input input-bordered"
                  placeholder="Property value"
                  value={form.value}
                  onChange={(e) => setForm((s) => ({ ...s, value: e.target.value }))}
                />
              </div>

              {/* 🗺️ OSM Map Picker handles search + geolocation */}
              <MapPicker
                value={{
                  lat: typeof form.lat === "number" ? form.lat : Number(form.lat) || undefined,
                  lng: typeof form.lng === "number" ? form.lng : Number(form.lng) || undefined,
                  address: form.address || "",
                }}
                onChange={(loc) =>
                  setForm((s) => ({
                    ...s,
                    lat: normalizeNumber(loc.lat),
                    lng: normalizeNumber(loc.lng),
                    address: loc.address || s.address,
                  }))
                }
                height={300}
                zoom={15}
              />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Field images</span>
                  <span className="text-xs text-base-content/70">{(Array.isArray(form.images) ? form.images.length : 0)}/{MAX_IMAGE_COUNT}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {(Array.isArray(form.images) ? form.images : []).map((img) => (
                    <div
                      key={img.id}
                      className="relative h-24 w-32 overflow-hidden rounded-lg border border-base-300 bg-base-200/50"
                    >
                      <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        className="btn btn-xs btn-error absolute right-1 top-1 px-2"
                        onClick={() => removeFormImage(img.id)}
                        title="Remove image"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {(!Array.isArray(form.images) || form.images.length < MAX_IMAGE_COUNT) && (
                    <label
                      htmlFor="create-field-images"
                      className="flex h-24 w-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-base-300 bg-base-200/40 text-xs text-base-content/70 hover:border-primary hover:text-primary"
                    >
                      <ImageIcon className="h-5 w-5" />
                      <span>Add images</span>
                    </label>
                  )}
                </div>
                <input
                  id="create-field-images"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFormImages}
                />
                <p className="text-xs text-base-content/60">
                  Up to {MAX_IMAGE_COUNT} images (max {MAX_IMAGE_SIZE_MB} MB each).
                </p>
              </div>


              {/* Coordinates */}
              <div className="grid md:grid-cols-2 gap-3">
                <div className="join w-full">
                  <input
                    className="input input-bordered join-item w-full"
                    placeholder="Latitude"
                    value={form.lat}
                    inputMode="decimal"
                    onChange={(e) =>
                      setForm((s) => ({ ...s, lat: e.target.value.replace(/[^0-9.\-]/g, "") }))
                    }
                  />
                  <button
                    type="button"
                    className="btn join-item"
                    onClick={() =>
                      setForm((s) => ({ ...s, lat: normalizeNumber(s.lat), lng: normalizeNumber(s.lng) }))
                    }
                  >
                    <LocateFixed className="w-4 h-4 mr-1" /> Fix
                  </button>
                </div>

                <div className="join w-full">
                  <input
                    className="input input-bordered join-item w-full"
                    placeholder="Longitude"
                    value={form.lng}
                    inputMode="decimal"
                    onChange={(e) =>
                      setForm((s) => ({ ...s, lng: e.target.value.replace(/[^0-9.\-]/g, "") }))
                    }
                  />
                  <button
                    type="button"
                    className="btn join-item"
                    onClick={() =>
                      setForm((s) => ({ ...s, lat: normalizeNumber(s.lat), lng: normalizeNumber(s.lng) }))
                    }
                  >
                    <LocateFixed className="w-4 h-4 mr-1" /> Fix
                  </button>
                </div>
              </div>

              <textarea
                className="textarea textarea-bordered w-full"
                rows={3}
                placeholder="Remarks"
                value={form.remarks}
                onChange={(e) => setForm((s) => ({ ...s, remarks: e.target.value }))}
              />

              <button className={`btn btn-primary ${creating ? "btn-disabled" : ""}`} type="submit">
                {creating && <span className="loading loading-spinner loading-sm mr-2" />}
                Save Field
              </button>
            </form>
          </div>
        )}

        {/* Toolbar */}
        <div className="mt-6 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 opacity-60 absolute left-3 top-3.5" />
            <input
              className="input input-bordered w-full pl-9"
              placeholder="Search by name, tea type, status, address…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button className="btn btn-primary ml-3" onClick={exportPdf}>
            <Download className="w-4 h-4 mr-1" /> Export PDF
          </button>
        </div>

        {/* Table */}
        <div className="mt-4 rounded-2xl bg-base-100 p-4 shadow border border-base-200">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Tea Type</th>
                  <th>Status</th>
                  <th>Estimated revenue</th>
                  <th>Property value</th>
                  <th>Address</th>
                  <th>Lat/Lng</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r._id || r.id}>
                    <td>{r.name}</td>
                    <td className="capitalize">{r.teaType}</td>
                    <td>{r.status}</td>
                    <td>{r.revenue || "-"}</td>
                    <td>{r.value || "-"}</td>
                    <td>{r.address || "-"}</td>
                    <td>{r.lat ?? "-"}, {r.lng ?? "-"}</td>
                    <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "-"}</td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => viewImages(r)}
                          title="View images"
                          aria-label="View images"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => openEdit(r)}
                          title="Edit field"
                          aria-label="Edit field"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-error"
                          onClick={() => onDelete(r._id || r.id)}
                          title="Delete field"
                          aria-label="Delete field"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={9} className="text-center text-base-content/60">
                      No fields
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {loading && <div className="mt-3 text-sm opacity-70">Loading…</div>}
        </div>
      </div>
    </div>
  );
}
