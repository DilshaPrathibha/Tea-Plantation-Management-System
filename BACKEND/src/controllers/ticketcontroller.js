// BACKEND/src/controllers/ticketcontroller.js
const Ticket = require('../../models/Ticket');
const Field = require('../../models/Field');

const CREATOR_ROLES = ['inventory_manager', 'production_manager', 'field_supervisor'];
const STATUSES = ['pending', 'in_progress', 'replied', 'resolved'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const CATEGORIES = ['general', 'field_issue', 'inventory', 'production', 'transport', 'other'];

const normaliseCategory = (value = '', fallback = null) => {
  const clean = String(value || '').trim().toLowerCase();
  if (CATEGORIES.includes(clean)) return clean;
  return fallback;
};

const normalisePriority = (value = '', fallback = null) => {
  const clean = String(value || '').trim().toLowerCase();
  if (PRIORITIES.includes(clean)) return clean;
  return fallback;
};

const normaliseStatus = (value = '') => {
  const clean = String(value || '').trim().toLowerCase();
  return STATUSES.includes(clean) ? clean : null;
};

exports.createTicket = async (req, res) => {
  try {
    const { category, priority, fieldId, description, subject } = req.body || {};
    const user = req.user;

    if (!user || !CREATOR_ROLES.includes(user.role)) {
      return res.status(403).json({ message: 'Not allowed to create tickets' });
    }

    const trimmedDescription = (description || '').trim();
    if (!trimmedDescription) {
      return res.status(400).json({ message: 'Problem description is required' });
    }

    let field = null;
    if (fieldId) {
      field = await Field.findById(fieldId).select('name');
      if (!field) {
        return res.status(404).json({ message: 'Field not found' });
      }
    }

    const ticket = await Ticket.create({
      subject: (subject || '').trim().slice(0, 140),
      category: normaliseCategory(category, 'other'),
      priority: normalisePriority(priority, 'medium'),
      description: trimmedDescription,
      field: field ? field._id : null,
      fieldName: field ? field.name : '',
      createdBy: user._id,
      createdByRole: user.role,
      status: 'pending'
    });

    res.status(201).json({ ticket });
  } catch (err) {
    console.error('[createTicket] error', err);
    res.status(500).json({ message: 'Failed to create ticket' });
  }
};

exports.listMyTickets = async (req, res) => {
  try {
    const user = req.user;
    const tickets = await Ticket.find({ createdBy: user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ tickets });
  } catch (err) {
    console.error('[listMyTickets] error', err);
    res.status(500).json({ message: 'Failed to load tickets' });
  }
};

exports.updateMyTicket = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { category, priority, fieldId, description, subject } = req.body || {};

    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (!ticket.createdBy.equals(user._id)) {
      return res.status(403).json({ message: 'You can only edit your tickets' });
    }
    if (ticket.status === 'resolved') {
      return res.status(400).json({ message: 'Resolved tickets cannot be edited' });
    }

    if (subject !== undefined) {
      ticket.subject = (subject || '').trim().slice(0, 140);
    }

    if (category) {
      ticket.category = normaliseCategory(category, ticket.category || 'other');
    }
    if (priority) {
      ticket.priority = normalisePriority(priority, ticket.priority || 'medium');
    }
    if (description !== undefined) {
      const trimmedDescription = (description || '').trim();
      if (!trimmedDescription) {
        return res.status(400).json({ message: 'Problem description cannot be empty' });
      }
      ticket.description = trimmedDescription;
    }
    if (fieldId) {
      const field = await Field.findById(fieldId).select('name');
      if (!field) {
        return res.status(404).json({ message: 'Field not found' });
      }
      ticket.field = field._id;
      ticket.fieldName = field.name;
    }

    await ticket.save();
    res.json({ ticket });
  } catch (err) {
    console.error('[updateMyTicket] error', err);
    res.status(500).json({ message: 'Failed to update ticket' });
  }
};

exports.deleteMyTicket = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (!ticket.createdBy.equals(user._id)) {
      return res.status(403).json({ message: 'You can only delete your tickets' });
    }
    if (ticket.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending tickets can be deleted' });
    }

    await ticket.deleteOne();
    res.json({ message: 'Ticket deleted' });
  } catch (err) {
    console.error('[deleteMyTicket] error', err);
    res.status(500).json({ message: 'Failed to delete ticket' });
  }
};

exports.adminListTickets = async (req, res) => {
  try {
    const { status, priority, role, category } = req.query || {};
    const filter = {};

    if (typeof status === 'string' && status.trim()) {
      const statusFilter = normaliseStatus(status);
      if (statusFilter) {
        filter.status = statusFilter;
      }
    }

    if (typeof priority === 'string' && priority.trim()) {
      const priorityFilter = normalisePriority(priority);
      if (priorityFilter) {
        filter.priority = priorityFilter;
      }
    }

    if (typeof role === 'string' && CREATOR_ROLES.includes(role)) {
      filter.createdByRole = role;
    }

    if (typeof category === 'string' && category.trim()) {
      const categoryFilter = normaliseCategory(category);
      if (categoryFilter) {
        filter.category = categoryFilter;
      }
    }

    const tickets = await Ticket.find(filter)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email role empId')
      .lean();

    res.json({ tickets });
  } catch (err) {
    console.error('[adminListTickets] error', err);
    res.status(500).json({ message: 'Failed to load all tickets' });
  }
};

exports.adminUpdateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, replyMessage } = req.body || {};
    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    let touched = false;

    if (typeof status === 'string' && status.trim()) {
      const statusValue = normaliseStatus(status);
      if (!statusValue) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      ticket.status = statusValue;
      ticket.lastStatusChangeBy = req.user._id;
      ticket.lastStatusChangeByName = req.user.name || req.user.email || '';
      touched = true;
    }

    if (replyMessage !== undefined) {
      const trimmed = (replyMessage || '').trim();
      if (trimmed) {
        ticket.responses.push({
          message: trimmed,
          createdBy: req.user._id,
          role: req.user.role,
          createdAt: new Date()
        });
        if (!touched) {
          ticket.status = 'replied';
          ticket.lastStatusChangeBy = req.user._id;
          ticket.lastStatusChangeByName = req.user.name || req.user.email || '';
        }
        touched = true;
      }
    }

    if (!touched) {
      return res.status(400).json({ message: 'No updates provided' });
    }

    await ticket.save();
    await ticket.populate('createdBy', 'name email role empId');

    res.json({ ticket });
  } catch (err) {
    console.error('[adminUpdateTicket] error', err);
    res.status(500).json({ message: 'Failed to update ticket' });
  }
};
