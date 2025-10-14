// FRONTEND/src/pages/tickets/AdminTicketsPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Sweet } from '@/utils/sweet';
import {
  Ticket as TicketIcon,
  RefreshCw,
  Filter,
  MessageCircle,
  UserCircle,
  MapPin,
  Flag
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'replied', label: 'Replied' },
  { value: 'resolved', label: 'Resolved' }
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'field_issue', label: 'Field Issue' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'production', label: 'Production' },
  { value: 'transport', label: 'Transport' },
  { value: 'other', label: 'Other' }
];

const ROLE_OPTIONS = [
  { value: 'field_supervisor', label: 'Field Supervisor' },
  { value: 'production_manager', label: 'Production Manager' },
  { value: 'inventory_manager', label: 'Inventory Manager' }
];

const STATUS_LABELS = STATUS_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const PRIORITY_LABELS = PRIORITY_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const CATEGORY_LABELS = CATEGORY_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const formatDate = (value) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch (err) {
    return value;
  }
};

const badgeClassForStatus = (status) => {
  switch (status) {
    case 'resolved':
      return 'badge badge-success badge-outline';
    case 'in_progress':
      return 'badge badge-info badge-outline';
    case 'replied':
      return 'badge badge-primary badge-outline';
    default:
      return 'badge badge-warning badge-outline';
  }
};

export default function AdminTicketsPage() {
  const token = localStorage.getItem('token');
  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [filters, setFilters] = useState({ status: '', priority: '', role: '', category: '' });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [updating, setUpdating] = useState({});

  const { status, priority, role, category } = filters;

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      if (role) params.append('role', role);
      if (category) params.append('category', category);
      const query = params.toString();
      const url = query ? `${API}/api/tickets?${query}` : `${API}/api/tickets`;
      const { data } = await axios.get(url, { headers: authHeader });
      setTickets(Array.isArray(data?.tickets) ? data.tickets : []);
    } catch (err) {
      console.error('[admin tickets] load', err?.response?.data || err);
      Sweet.error(err?.response?.data?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, priority, role, category]);

  const refresh = () => {
    fetchTickets();
  };

  const updateDraft = (ticketId, patch) => {
    setDrafts((prev) => ({
      ...prev,
      [ticketId]: { ...(prev[ticketId] || {}), ...patch }
    }));
  };

  const resetDraft = (ticketId) => {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[ticketId];
      return next;
    });
  };

  const applyUpdate = async (ticket) => {
    const draft = drafts[ticket._id] || {};
    const { status: updatedStatus, reply: replyMessage } = draft;

    if (!updatedStatus && !replyMessage) {
      Sweet.info('Nothing to update');
      return;
    }

    setUpdating((prev) => ({ ...prev, [ticket._id]: true }));
    try {
      await axios.patch(
        `${API}/api/tickets/${ticket._id}/status`,
        {
          status: updatedStatus,
          replyMessage
        },
        { headers: { ...authHeader, 'Content-Type': 'application/json' } }
      );
      Sweet.success('Ticket updated');
      resetDraft(ticket._id);
      fetchTickets();
    } catch (err) {
      console.error('[admin tickets] update', err?.response?.data || err);
      Sweet.error(err?.response?.data?.message || 'Failed to update ticket');
    } finally {
      setUpdating((prev) => ({ ...prev, [ticket._id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-6xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-base-content">Ticket Inbox</h1>
            <p className="text-base-content/70">
              Filter, reply, and resolve support tickets submitted by field teams.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="bg-base-100 border border-base-200 rounded-2xl p-4 sm:p-6 shadow mb-6">
          <div className="flex items-center gap-2 text-lg font-semibold text-base-content mb-4">
            <Filter className="w-5 h-5" />
            Filters
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="form-control">
              <span className="label-text">Status</span>
              <select
                className="select select-bordered"
                value={status}
                onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
              >
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="form-control">
              <span className="label-text">Priority</span>
              <select
                className="select select-bordered"
                value={priority}
                onChange={(event) => setFilters((prev) => ({ ...prev, priority: event.target.value }))}
              >
                <option value="">All priorities</option>
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="form-control">
              <span className="label-text">Submitted by</span>
              <select
                className="select select-bordered"
                value={role}
                onChange={(event) => setFilters((prev) => ({ ...prev, role: event.target.value }))}
              >
                <option value="">All roles</option>
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="form-control">
              <span className="label-text">Category</span>
              <select
                className="select select-bordered"
                value={category}
                onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
              >
                <option value="">All categories</option>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="bg-base-100 border border-base-200 rounded-2xl shadow">
          <div className="border-b border-base-200 px-6 py-4 flex items-center gap-3">
            <TicketIcon className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-base-content">Tickets</h2>
            <span className="badge badge-primary badge-outline">{tickets.length}</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="loading loading-lg"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-16 text-center text-base-content/60">
              No tickets match the current filters.
            </div>
          ) : (
            <div className="p-4 sm:p-6 space-y-4">
              {tickets.map((ticket) => {
                const draft = drafts[ticket._id] || {};
                const currentStatus = draft.status ?? '';
                const reply = draft.reply ?? '';
                return (
                  <div key={ticket._id} className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-sm text-base-content/70">
                        <UserCircle className="w-4 h-4" />
                        {ticket.createdBy?.name || 'Unknown user'}
                        {ticket.createdBy?.empId && <span className="badge badge-outline">{ticket.createdBy.empId}</span>}
                        <span className="badge badge-outline">{ticket.createdByRole?.replace('_', ' ') || 'Role N/A'}</span>
                        <span className="badge badge-outline">
                          {PRIORITY_LABELS[ticket.priority] || ticket.priority}
                        </span>
                        <span className={badgeClassForStatus(ticket.status)}>
                          {STATUS_LABELS[ticket.status] || ticket.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-base-content">{ticket.subject?.trim() || 'Untitled ticket'}</h3>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {ticket.fieldName || 'Unknown field'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Flag className="w-4 h-4" />
                          {CATEGORY_LABELS[ticket.category] || ticket.category}
                        </span>
                        <span className="text-xs text-base-content/60">
                          Created {formatDate(ticket.createdAt)} | Updated {formatDate(ticket.updatedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-semibold mb-1">Problem</h4>
                      <p className="whitespace-pre-wrap leading-relaxed text-base-content/80">{ticket.description}</p>
                    </div>

                    <div className="mt-4 space-y-2">
                      <h4 className="font-semibold">Conversation</h4>
                      {Array.isArray(ticket.responses) && ticket.responses.length > 0 ? (
                        <div className="space-y-2">
                          {ticket.responses.map((response, index) => (
                            <div key={`${ticket._id}-resp-${index}`} className="rounded-xl border border-base-content/10 bg-base-200 p-3 text-sm">
                              <div className="flex items-center gap-2 text-primary">
                                <MessageCircle className="w-4 h-4" />
                                {response.role?.replace('_', ' ') || 'Admin'}
                                <span className="text-xs text-base-content/60">{formatDate(response.createdAt)}</span>
                              </div>
                              <p className="mt-1 whitespace-pre-wrap text-base-content/80">{response.message}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-base-content/20 p-3 text-sm text-base-content/70">
                          No replies yet.
                        </div>
                      )}
                    </div>

                    <div className="mt-5 rounded-xl border border-base-content/10 bg-base-200/50 p-4">
                      <h4 className="font-semibold mb-3">Resolve or reply</h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="form-control">
                          <span className="label-text">Update status</span>
                          <select
                            className="select select-bordered"
                            value={currentStatus}
                            onChange={(event) => updateDraft(ticket._id, { status: event.target.value })}
                          >
                            <option value="">Keep current ({STATUS_LABELS[ticket.status] || ticket.status})</option>
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </label>

                        <label className="form-control sm:col-span-2">
                          <span className="label-text">Reply message (optional)</span>
                          <textarea
                            className="textarea textarea-bordered h-24"
                            value={reply}
                            onChange={(event) => updateDraft(ticket._id, { reply: event.target.value })}
                            placeholder="Share a quick update with the requester"
                          />
                        </label>
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
                        {drafts[ticket._id] && (
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => resetDraft(ticket._id)}
                            disabled={!!updating[ticket._id]}
                          >
                            Clear
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => applyUpdate(ticket)}
                          disabled={!!updating[ticket._id]}
                        >
                          {updating[ticket._id] && <span className="loading loading-spinner"></span>}
                          Update ticket
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
