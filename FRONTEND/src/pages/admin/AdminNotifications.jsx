import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { Sweet } from "@/utils/sweet";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

const ROLE_OPTIONS = [
  { value: "worker", label: "Workers" },
  { value: "field_supervisor", label: "Field Supervisors" },
  { value: "production_manager", label: "Production Managers" },
  { value: "inventory_manager", label: "Inventory Managers" },
  { value: "admin", label: "Admins" },
];

const ROLE_LABELS = ROLE_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const describeAudience = (audience) => {
  const list = Array.isArray(audience)
    ? audience
    : typeof audience === "string"
    ? [audience]
    : [];

  if (list.length === 0 || list.length === ROLE_OPTIONS.length) {
    return "All groups";
  }

  return list.map((role) => ROLE_LABELS[role] || role).join(", ");
};

export default function AdminNotifications() {
  const token = localStorage.getItem("token");
  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [audience, setAudience] = useState(ROLE_OPTIONS.map((role) => role.value));
  const [notifications, setNotifications] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const allAudienceSelected = audience.length === ROLE_OPTIONS.length;

  const toggleAudience = (value) => {
    setAudience((prev) =>
      prev.includes(value) ? prev.filter((role) => role !== value) : [...prev, value]
    );
  };

  const selectAllAudience = () => setAudience(ROLE_OPTIONS.map((role) => role.value));
  const clearAudience = () => setAudience([]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API}/api/notifications`, { headers: authHeader });
      setNotifications(Array.isArray(res.data.items) ? res.data.items : []);
    } catch (e) {
      Sweet.error(e?.response?.data?.message || "Failed to load notifications");
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      return Sweet.error("Title and content required");
    }
    if (audience.length === 0) {
      return Sweet.error("Select at least one user group");
    }
    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        audience,
      };
      await axios.post(`${API}/api/notifications`, payload, {
        headers: { ...authHeader, "Content-Type": "application/json" },
      });
      setTitle("");
      setContent("");
      Sweet.success(`Notification sent to ${describeAudience(audience)}`);
      fetchNotifications();
    } catch (e) {
      Sweet.error(e?.response?.data?.message || "Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (notif) => {
    setEditId(notif._id);
    setEditTitle(notif.title);
    setEditContent(notif.content);
  };

  const handleEditSave = async (id) => {
    if (!editTitle.trim() || !editContent.trim()) {
      return Sweet.error("Title and content required");
    }
    setEditLoading(true);
    try {
      await axios.patch(
        `${API}/api/notifications/${id}`,
        { title: editTitle, content: editContent },
        { headers: { ...authHeader, "Content-Type": "application/json" } }
      );
      Sweet.success("Notification updated");
      setEditId(null);
      setEditTitle("");
      setEditContent("");
      fetchNotifications();
    } catch (e) {
      Sweet.error(e?.response?.data?.message || "Failed to update notification");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await Sweet.confirm("Delete this notification?");
    if (!ok) return;
    try {
      await axios.delete(`${API}/api/notifications/${id}`, { headers: authHeader });
      Sweet.success("Notification deleted");
      fetchNotifications();
    } catch (e) {
      Sweet.error(e?.response?.data?.message || "Failed to delete notification");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-base-100 rounded-xl shadow mt-8">
      <h2 className="text-2xl font-bold mb-4">Send Notifications</h2>
      <form onSubmit={handleSend} className="space-y-4 mb-8">
        <input
          className="input input-bordered w-full"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="textarea textarea-bordered w-full"
          rows={4}
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="rounded-lg border border-base-200 bg-base-200/30 p-3">
          <div className="flex items-center justify-between gap-2 text-sm font-semibold">
            <span>Select recipients</span>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => (allAudienceSelected ? clearAudience() : selectAllAudience())}
            >
              {allAudienceSelected ? "Clear all" : "Select all"}
            </button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {ROLE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition ${
                  audience.includes(option.value)
                    ? "border-primary/60 bg-primary/10"
                    : "border-base-200 hover:border-primary/40"
                }`}
              >
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={audience.includes(option.value)}
                  onChange={() => toggleAudience(option.value)}
                />
                <span className="text-sm font-medium">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
        <button className="btn btn-primary w-full" type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Notifications"}
        </button>
      </form>

      <h3 className="text-xl font-semibold mb-2">All Notifications</h3>
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="opacity-70">No notifications to show.</div>
        ) : (
          notifications.map((n) => (
            <div key={n._id} className="p-4 rounded-xl border bg-base-200 flex flex-col gap-2">
              {editId === n._id ? (
                <>
                  <input
                    className="input input-bordered w-full mb-2"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <textarea
                    className="textarea textarea-bordered w-full mb-2"
                    rows={3}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                  <div className="text-xs text-primary/80 mb-2">
                    Audience: {describeAudience(n.audience)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleEditSave(n._id)}
                      disabled={editLoading}
                    >
                      {editLoading ? "Saving..." : "Save"}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="font-semibold text-lg">{n.title}</div>
                  <div className="text-sm opacity-70">
                    {(() => {
                      const stamp = n.updatedAt || n.createdAt;
                      if (!stamp) return "";
                      const label = new Date(stamp).toLocaleString();
                      return n.updatedAt && n.updatedAt !== n.createdAt ? `${label} (updated)` : label;
                    })()}
                  </div>
                  <div className="text-xs text-primary/80">
                    Audience: {describeAudience(n.audience)}
                  </div>
                  <div>{n.content}</div>
                  <div className="flex gap-2 mt-2">
                    <button className="btn btn-outline btn-sm" onClick={() => handleEdit(n)}>
                      Edit
                    </button>
                    <button className="btn btn-error btn-sm" onClick={() => handleDelete(n._id)}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
