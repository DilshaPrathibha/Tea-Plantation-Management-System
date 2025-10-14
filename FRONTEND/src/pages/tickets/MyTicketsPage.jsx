// FRONTEND/src/pages/tickets/MyTicketsPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Sweet } from '@/utils/sweet';
import {
  Ticket as TicketIcon,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  MessageCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'field_issue', label: 'Field Issue' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'production', label: 'Production' },
  { value: 'transport', label: 'Transport' },
  { value: 'other', label: 'Other' }
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

const STATUS_STYLES = {
  pending: 'badge badge-warning badge-outline',
  in_progress: 'badge badge-info badge-outline',
  replied: 'badge badge-primary badge-outline',
  resolved: 'badge badge-success badge-outline'
};

const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  replied: 'Replied',
  resolved: 'Resolved'
};

const makeBlankForm = () => ({
  subject: '',
  category: 'general',
  priority: 'medium',
  description: ''
});

const formatDate = (value) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch (err) {
    return value;
  }
};

export default function MyTicketsPage({ title = 'Support Tickets' }) {
  const token = localStorage.getItem('token');
  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formTicketId, setFormTicketId] = useState(null);
  const [formData, setFormData] = useState(() => makeBlankForm());

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/api/tickets/my`, { headers: authHeader });
      setTickets(Array.isArray(data?.tickets) ? data.tickets : []);
    } catch (err) {
      console.error('[tickets] load my tickets', err?.response?.data || err);
      Sweet.error(err?.response?.data?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCreate = () => {
    setFormMode('create');
    setFormTicketId(null);
    setFormData(makeBlankForm());
    setFormOpen(true);
  };

  const startEdit = (ticket) => {
    setFormMode('edit');
    setFormTicketId(ticket._id);
    setFormData({
      subject: ticket.subject || '',
      category: ticket.category || 'general',
      priority: ticket.priority || 'medium',
      description: ticket.description || ''
    });
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormTicketId(null);
    setFormData(makeBlankForm());
    setFormMode('create');
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (!formData.description.trim()) {
      Sweet.error('Problem description is required');
      return;
    }

    const payload = {
      ...formData,
      description: formData.description.trim()
    };

    try {
      setSaving(true);
      if (formMode === 'create') {
        await axios.post(`${API}/api/tickets`, payload, {
          headers: { ...authHeader, 'Content-Type': 'application/json' }
        });
        Sweet.success('Ticket submitted');
      } else if (formTicketId) {
        await axios.patch(`${API}/api/tickets/${formTicketId}`, payload, {
          headers: { ...authHeader, 'Content-Type': 'application/json' }
        });
        Sweet.success('Ticket updated');
      }
      closeForm();
      fetchTickets();
    } catch (err) {
      console.error('[tickets] submit', err?.response?.data || err);
      Sweet.error(err?.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setSaving(false);
    }
  };

  const deleteTicket = async (ticket) => {
    if (!ticket?._id) return;
    const ok = await Sweet.confirm('Delete this ticket? Pending tickets only can be deleted.');
    if (!ok) return;
    try {
      await axios.delete(`${API}/api/tickets/${ticket._id}`, { headers: authHeader });
      Sweet.success('Ticket deleted');
      fetchTickets();
    } catch (err) {
      console.error('[tickets] delete', err?.response?.data || err);
      Sweet.error(err?.response?.data?.message || 'Failed to delete ticket');
    }
  };

  const renderResponses = (ticket) => {
    if (!Array.isArray(ticket.responses) || ticket.responses.length === 0) {
      return <div className="text-sm text-base-content/60">No replies yet.</div>;
    }

    return (
      <div className="mt-2 space-y-2">
        {ticket.responses.map((response, index) => (
          <div key={`${ticket._id}-resp-${index}`} className="rounded-lg border border-base-content/10 bg-base-200 p-3">
            <div className="flex items-center gap-2 text-primary">
              <MessageCircle className="w-4 h-4" />
              {response.role?.replace('_', ' ') || 'Admin'}
              <span className="text-xs text-base-content/60">{formatDate(response.createdAt)}</span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-base-content/80">{response.message}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-5xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-base-content">{title}</h1>
            <p className="text-base-content/70">
              Submit issues to the admin team and track their responses.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={fetchTickets}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={startCreate}
            >
              <Plus className="w-4 h-4" />
              New Ticket
            </button>
          </div>
        </div>

        {formOpen && (
          <div className="mb-6 rounded-2xl bg-base-100 p-6 shadow border border-base-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 text-primary p-2">
                  <TicketIcon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold">
                  {formMode === 'create' ? 'Submit a ticket' : 'Update ticket'}
                </h2>
              </div>
              <button type="button" className="btn btn-ghost" onClick={closeForm}>
                Cancel
              </button>
            </div>

            <form onSubmit={submitForm} className="space-y-4">
              <label className="form-control">
                <span className="label-text">Subject (optional)</span>
                <input
                  className="input input-bordered"
                  placeholder="Short summary"
                  value={formData.subject}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, subject: event.target.value.slice(0, 140) }))
                  }
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="form-control">
                  <span className="label-text">Priority</span>
                  <select
                    className="select select-bordered"
                    value={formData.priority}
                    onChange={(event) => setFormData((prev) => ({ ...prev, priority: event.target.value }))}
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="form-control">
                  <span className="label-text">Category</span>
                  <select
                    className="select select-bordered"
                    value={formData.category}
                    onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="form-control">
                <span className="label-text">Describe the problem</span>
                <textarea
                  className="textarea textarea-bordered h-32"
                  value={formData.description}
                  onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                  required
                />
              </label>

              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-ghost" onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving && <span className="loading loading-spinner"></span>}
                  {formMode === 'create' ? 'Submit' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-3">My tickets</h2>
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="loading loading-lg"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-base-content/20 p-8 text-center">
              <AlertCircle className="w-10 h-10 mx-auto text-base-content/50" />
              <p className="mt-3 text-base-content/70">No tickets yet. Submit your first ticket to reach the admin team.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket._id} className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-base-content/70">
                        <Clock className="w-4 h-4" />
                        Created {formatDate(ticket.createdAt)}
                        <span className="mx-2">|</span>
                        Updated {formatDate(ticket.updatedAt)}
                      </div>
                      <h3 className="text-lg font-semibold text-base-content">
                        {ticket.subject?.trim() || 'Untitled ticket'}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-sm">
                        {ticket.fieldName && (
                          <span className="badge badge-outline">Field: {ticket.fieldName}</span>
                        )}
                        <span className="badge badge-outline">Category: {CATEGORY_OPTIONS.find((c) => c.value === ticket.category)?.label || ticket.category}</span>
                        <span className="badge badge-outline">Priority: {PRIORITY_OPTIONS.find((p) => p.value === ticket.priority)?.label || ticket.priority}</span>
                        <span className={STATUS_STYLES[ticket.status] || 'badge badge-outline'}>
                          {STATUS_LABELS[ticket.status] || ticket.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 self-end sm:self-start">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => startEdit(ticket)}
                        disabled={ticket.status === 'resolved'}
                        title={ticket.status === 'resolved' ? 'Resolved tickets cannot be edited' : 'Edit ticket'}
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        className="btn btn-ghost btn-sm text-error"
                        onClick={() => deleteTicket(ticket)}
                        disabled={ticket.status !== 'pending'}
                        title={ticket.status !== 'pending' ? 'Only pending tickets can be deleted' : 'Delete ticket'}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-semibold mb-1">Problem</h4>
                    <p className="whitespace-pre-wrap leading-relaxed text-base-content/80">{ticket.description}</p>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-semibold mb-1">Admin replies</h4>
                    {renderResponses(ticket)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

