import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { Sweet } from '@/utils/sweet';

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function AdminNotifications() {
  console.log('[AdminNotifications] Component mounted');
  const token = localStorage.getItem("token");
  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  // Fetch notifications
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
    setLoading(true);
    try {
      await axios.post(`${API}/api/notifications`, { title, content }, { headers: { ...authHeader, 'Content-Type': 'application/json' } });
      setTitle("");
      setContent("");
      Sweet.success("Notification sent to all workers");
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
      await axios.patch(`${API}/api/notifications/${id}`, { title: editTitle, content: editContent }, { headers: { ...authHeader, 'Content-Type': 'application/json' } });
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
      <h2 className="text-2xl font-bold mb-4">Send Notification to Workers</h2>
      <form onSubmit={handleSend} className="space-y-4 mb-8">
        <input
          className="input input-bordered w-full"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          className="textarea textarea-bordered w-full"
          rows={4}
          placeholder="Content"
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <button className="btn btn-primary w-full" type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Notification"}
        </button>
      </form>

      <h3 className="text-xl font-semibold mb-2">All Notifications</h3>
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="opacity-70">No notifications to show.</div>
        ) : (
          notifications.map(n => (
            <div key={n._id} className="p-4 rounded-xl border bg-base-200 flex flex-col gap-2">
              {editId === n._id ? (
                <>
                  <input
                    className="input input-bordered w-full mb-2"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                  />
                  <textarea
                    className="textarea textarea-bordered w-full mb-2"
                    rows={3}
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button className="btn btn-success btn-sm" onClick={() => handleEditSave(n._id)} disabled={editLoading}>
                      {editLoading ? 'Saving...' : 'Save'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="font-semibold text-lg">{n.title}</div>
                  <div className="text-sm opacity-70">{new Date(n.createdAt).toLocaleString()}</div>
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
