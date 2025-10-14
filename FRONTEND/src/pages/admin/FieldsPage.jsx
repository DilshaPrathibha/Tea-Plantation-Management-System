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
  ArrowUpAZ,
  ArrowDownAZ,
} from "lucide-react";
import MapPicker from "../../components/MapPickerOSM.jsx"; // ⬅️ OSM

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Sweet } from "@/utils/sweet";


import toast from "react-hot-toast";

import { uploadFieldImage, deriveStoragePath } from "@/utils/supabaseUpload";



const API = import.meta.env.VITE_API_URL || "http://localhost:5001";
const COMPANY = { name: "Celloanleaf", email: "ceylonleaf@gmail.com", phone: "" };

const CEYLONLEAF_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
     fill="none" stroke="#22C55E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
</svg>
`;

const svgToPngDataUrl = (svgMarkup, targetPx = 28) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const scale = targetPx / (img.width || 28);
      const w = Math.max(1, Math.round((img.width || 28) * scale));
      const h = Math.max(1, Math.round((img.height || 28) * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = reject;
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgMarkup);
  });

const formatCurrency = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(num);
};


// Dropdown list, but we still store a plain string in `teaType`

const TEA_TYPES = ["Black", "Green", "White", "Oolong", "Herbal", "Other"];

const FIELD_SORT_OPTIONS = [
  { value: "createdAt", label: "Recently added" },
  { value: "value", label: "Property value" },
  { value: "revenue", label: "Estimated revenue" },
  { value: "name", label: "Name (A–Z)" },
  { value: "teaType", label: "Tea type" },
  { value: "status", label: "Status" },
];

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

// Validation function to allow only numbers and decimal point
function validateNumberInput(value) {
  // Remove any characters that are not digits or decimal point
  return value.replace(/[^0-9.]/g, '');
}



export default function FieldsPage() {

  const token = localStorage.getItem("token");

  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);



  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");


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

  const totalFields = filtered.length;
  const statusSummary = filtered.reduce((acc, field) => {
    const key = (field.status || "other").toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const activeCount = statusSummary["active"] || 0;
  const soldCount = statusSummary["sold"] || 0;
  const archivedCount = statusSummary["archived"] || 0;
  const totalRevenue = filtered.reduce(
    (sum, field) => sum + (Number(field.revenue) || 0),
    0
  );
  const totalValue = filtered.reduce(
    (sum, field) => sum + (Number(field.value) || 0),
    0
  );
  const uniqueTeaTypes = new Set(
    filtered.map((f) => (f.teaType || "").trim()).filter(Boolean)
  ).size;

  const sortedFields = useMemo(() => {
    const arr = [...filtered];
    const direction = sortDir === "asc" ? 1 : -1;

    const compareStrings = (a = "", b = "") =>
      a.localeCompare(b, undefined, { sensitivity: "base" }) || 0;

    arr.sort((a, b) => {
      let result = 0;
      switch (sortKey) {
        case "value":
          result = (Number(a.value) || 0) - (Number(b.value) || 0);
          break;
        case "revenue":
          result = (Number(a.revenue) || 0) - (Number(b.revenue) || 0);
          break;
        case "name":
          result = compareStrings(a.name, b.name);
          break;
        case "teaType":
          result = compareStrings(a.teaType, b.teaType);
          break;
        case "status":
          result = compareStrings(a.status, b.status);
          break;
        default:
          result =
            new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
      }
      if (result === 0) {
        result = compareStrings(a.name, b.name);
      }
      return result * direction;
    });

    return arr;
  }, [filtered, sortKey, sortDir]);

const exportPdf = async () => {
  if (!filtered.length) {
    toast.error("No field data to export");
    return;
  }
  try {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 48;
    const marginY = 42;

    const logoDataUrl = await svgToPngDataUrl(CEYLONLEAF_SVG, 30);
    const generatedAt = new Date();

    const renderHeader = () => {
      const logoSize = 28;
      const baseline = marginY + 18;
      if (logoDataUrl) {
        doc.addImage(logoDataUrl, "PNG", marginX, marginY - 6, logoSize, logoSize);
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(34, 197, 94);
      doc.text(COMPANY.name || "CeylonLeaf", marginX + logoSize + 8, baseline);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Generated on ${generatedAt.toLocaleString()}`, pageWidth - marginX, marginY, { align: "right" });
      doc.text(`Fields Shown: ${filtered.length}`, pageWidth - marginX, marginY + 12, { align: "right" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(17, 24, 39);
      doc.text("Tea Fields Report", pageWidth / 2, marginY + 32, { align: "center" });
    };

    const renderFooter = (pageNumber) => {
      const footerTop = pageHeight - 72;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(marginX, footerTop, pageWidth - marginX, footerTop);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(34, 197, 94);
      doc.text("CeylonLeaf Plantations", pageWidth / 2, footerTop + 18, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("No. 123, Tea Estate Road, Nuwara Eliya, Sri Lanka", pageWidth / 2, footerTop + 32, { align: "center" });
      doc.text("Cultivating excellence in every leaf.", pageWidth / 2, footerTop + 46, { align: "center" });

      doc.setFontSize(8);
      doc.text(`Page ${pageNumber}`, pageWidth - marginX, footerTop + 46, { align: "right" });
    };

    renderHeader();

    autoTable(doc, {
      body: [
        [
          { content: `Total Fields: ${totalFields}`, styles: { textColor: [30, 41, 59], fontStyle: "bold" } },
          { content: `Active: ${activeCount}`, styles: { textColor: [34, 197, 94], fontStyle: "bold" } },
          { content: `Sold: ${soldCount}`, styles: { textColor: [59, 130, 246], fontStyle: "bold" } },
        ],
        [
          { content: `Archived: ${archivedCount}`, styles: { textColor: [107, 114, 128], fontStyle: "bold" } },
          { content: `Tea Types: ${uniqueTeaTypes}`, styles: { textColor: [30, 41, 59], fontStyle: "bold" } },
          { content: `Total Revenue: ${formatCurrency(totalRevenue)}`, styles: { textColor: [249, 115, 22], fontStyle: "bold" } },
        ],
        [
          { content: `Total Property Value: ${formatCurrency(totalValue)}`, colSpan: 3, styles: { fontStyle: "bold", textColor: [30, 41, 59], halign: "center" } },
        ],
      ],
      theme: "plain",
      styles: { fontSize: 11 },
      margin: { left: marginX, right: marginX },
      startY: marginY + 46,
    });

    let tableStartY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : marginY + 66;

    const filterNotes = [];
    if (q.trim()) {
      filterNotes.push(`Search: "${q.trim()}"`);
    }
    const sortLabel =
      FIELD_SORT_OPTIONS.find((option) => option.value === sortKey)?.label || "Recently added";
    filterNotes.push(`Sort: ${sortLabel} (${sortDir.toUpperCase()})`);

    if (filterNotes.length) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(94, 104, 118);
      doc.text(filterNotes.join(" | "), marginX, tableStartY);
      tableStartY += 16;
    }

    const statusColors = {
      active: [34, 197, 94],
      sold: [59, 130, 246],
      archived: [107, 114, 128],
    };

    const body = sortedFields.map((field) => [
      field.name || "-",
      field.teaType || "-",
      { content: field.status || "-", statusKey: (field.status || "other").toLowerCase() },
      formatCurrency(field.revenue),
      formatCurrency(field.value),
      field.address || "-",
      field.createdAt ? new Date(field.createdAt).toLocaleDateString() : "-",
    ]);

    autoTable(doc, {
      head: [["Name", "Tea Type", "Status", "Est. Revenue", "Property Value", "Address", "Created"]],
      body: body.length
        ? body
        : [["-", "-", { content: "-", statusKey: "other" }, "-", "-", "-", "-"]],
      startY: tableStartY,
      margin: { top: marginY + 60, left: marginX, right: marginX, bottom: 90 },
      styles: { fontSize: 10, cellPadding: 6, lineWidth: 0.2, lineColor: [226, 232, 240] },
      headStyles: { fillColor: [34, 197, 94], textColor: [17, 24, 39], fontSize: 11, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 3: { halign: "right" }, 4: { halign: "right" }, 5: { cellWidth: 150 }, 6: { cellWidth: 110 } },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 2) {
          const key = typeof data.cell.raw === "object" ? data.cell.raw.statusKey : "other";
          const color = statusColors[key] || [30, 41, 59];
          data.cell.styles.textColor = color;
          data.cell.styles.fontStyle = "bold";
          data.cell.text = [typeof data.cell.raw === "object" ? data.cell.raw.content : data.cell.raw];
        }
      },
      didDrawPage: (data) => {
        renderHeader();
        renderFooter(data.pageNumber);
      },
    });

    const blobUrl = doc.output("bloburl");
    window.open(blobUrl, "_blank");
    toast.success("Fields report ready");
  } catch (error) {
    console.error("[fields pdf] error", error);
    toast.error("Failed to generate fields PDF");
  }
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

                  onChange={(e) => setEdit((s) => ({ ...s, revenue: validateNumberInput(e.target.value) }))}

                />

                <input

                  className="input input-bordered"

                  placeholder="Property value"

                  value={edit.value}

                  onChange={(e) => setEdit((s) => ({ ...s, value: validateNumberInput(e.target.value) }))}

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

                  onChange={(e) => setForm((s) => ({ ...s, revenue: validateNumberInput(e.target.value) }))}

                />

                <input

                  className="input input-bordered"

                  placeholder="Property value"

                  value={form.value}

                  onChange={(e) => setForm((s) => ({ ...s, value: validateNumberInput(e.target.value) }))}

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
        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 opacity-60 absolute left-3 top-3.5" />
            <input
              className="input input-bordered w-full pl-9"
              placeholder="Search by name, tea type, status, address…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 md:ml-4">
            <select
              className="select select-bordered"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              title="Sort fields"
            >
              {FIELD_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              title="Toggle sort direction"
            >
              {sortDir === "asc" ? (
                <>
                  <ArrowUpAZ className="w-4 h-4 mr-1" /> Asc
                </>
              ) : (
                <>
                  <ArrowDownAZ className="w-4 h-4 mr-1" /> Desc
                </>
              )}
            </button>
            <button className="btn btn-primary" onClick={exportPdf}>
              <Download className="w-4 h-4 mr-1" /> Export PDF
            </button>
          </div>
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
                  <th>Created</th>
                  <th className="text-right">Actions</th>

                </tr>

              </thead>

              <tbody>

                {sortedFields.map((r) => (
                  <tr key={r._id || r.id}>

                    <td>{r.name}</td>

                    <td className="capitalize">{r.teaType}</td>

                    <td>{r.status}</td>

                    <td>{formatCurrency(r.revenue)}</td>
                    <td>{formatCurrency(r.value)}</td>
                    <td>{r.address || "-"}</td>
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

                {sortedFields.length === 0 && !loading && (
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

