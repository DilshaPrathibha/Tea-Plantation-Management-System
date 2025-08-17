// BACKEND/src/controllers/fieldcontroller.js
const Field = require('../../models/Field');

// POST /api/fields
exports.createField = async (req, res) => {
  try {
    console.log('[FIELDS create] body:', req.body);
    const { name, teaType, estimatedRevenue, propertyValue, remarks, status, location } = req.body || {};
    if (!name) return res.status(400).json({ message: 'name required' });

    const field = await Field.create({
      name,
      teaType: teaType || '',
      estimatedRevenue: Number(estimatedRevenue) || 0,
      propertyValue: Number(propertyValue) || 0,
      remarks: remarks || '',
      status: status || 'active',
      location: {
        address: location?.address || '',
        lat: typeof location?.lat === 'number' ? location.lat : null,
        lng: typeof location?.lng === 'number' ? location.lng : null,
      },
    });

    res.status(201).json({ field });
  } catch (e) {
    console.error('[FIELDS create] ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/fields
exports.listFields = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [items, total] = await Promise.all([
      Field.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Field.countDocuments(filter),
    ]);

    res.json({ items, total, page, limit });
  } catch (e) {
    console.error('[FIELDS list] ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/fields/:id
exports.updateField = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, teaType, estimatedRevenue, propertyValue, remarks, status, location } = req.body || {};

    const field = await Field.findById(id);
    if (!field) return res.status(404).json({ message: 'Field not found' });

    if (name !== undefined) field.name = name;
    if (teaType !== undefined) field.teaType = teaType;
    if (estimatedRevenue !== undefined) field.estimatedRevenue = Number(estimatedRevenue) || 0;
    if (propertyValue !== undefined) field.propertyValue = Number(propertyValue) || 0;
    if (remarks !== undefined) field.remarks = remarks;
    if (status !== undefined) field.status = status;

    if (location !== undefined) {
      field.location.address = location?.address ?? field.location.address;
      field.location.lat = typeof location?.lat === 'number' ? location.lat : field.location.lat;
      field.location.lng = typeof location?.lng === 'number' ? location.lng : field.location.lng;
    }

    await field.save();
    res.json({ field });
  } catch (e) {
    console.error('[FIELDS update] ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/fields/:id
exports.deleteField = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Field.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Field not found' });
    res.json({ message: 'Field deleted' });
  } catch (e) {
    console.error('[FIELDS delete] ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};
