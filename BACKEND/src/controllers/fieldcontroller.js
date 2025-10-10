// BACKEND/src/controllers/fieldcontroller.js
const mongoose = require('mongoose');
const Field = require('../../models/Field');

const MAX_IMAGE_COUNT = 5;

const sanitizeImages = (raw = []) => {
  if (!Array.isArray(raw)) return [];

  const cleaned = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const url = typeof entry.url === 'string' ? entry.url.trim() : '';
    if (!url) continue;
    const name = typeof entry.name === 'string' ? entry.name.trim().slice(0, 120) : '';
    cleaned.push({ name, url });
    if (cleaned.length >= MAX_IMAGE_COUNT) break;
  }

  return cleaned;
};

const isId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET /api/fields
exports.listFields = async (req, res) => {
  try {
    const items = await Field.find().sort({ createdAt: -1 }).lean();
    res.json({ items });
  } catch (e) {
    console.error('[fields list]', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/fields/:id
exports.getField = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ message: 'invalid id' });

    const doc = await Field.findById(id).lean();
    if (!doc) return res.status(404).json({ message: 'Field not found' });

    res.json({ field: { ...doc, images: sanitizeImages(doc.images) } });
  } catch (e) {
    console.error('[fields get]', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/fields
exports.createField = async (req, res) => {
  try {
    const { name, teaType, status, revenue, value, address, remarks, lat, lng, images } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ message: 'name required' });

    const doc = await Field.create({
      name: String(name).trim(),
      teaType: (teaType || '').trim(),
      status: status || 'Active',
      revenue: revenue || '',
      value: value || '',
      address: (address || '').trim(),
      remarks: (remarks || '').trim(),
      lat: typeof lat === 'number' ? lat : (lat === undefined || lat === '' ? undefined : Number(lat)),
      lng: typeof lng === 'number' ? lng : (lng === undefined || lng === '' ? undefined : Number(lng)),
      images: sanitizeImages(images),
    });

    res.status(201).json({ field: doc });
  } catch (e) {
    console.error('[fields create]', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH/PUT /api/fields/:id
exports.updateField = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ message: 'invalid id' });

    const b = req.body || {};
    const update = {
      ...(b.name !== undefined ? { name: String(b.name).trim() } : {}),
      ...(b.teaType !== undefined ? { teaType: String(b.teaType).trim() } : {}),
      ...(b.status !== undefined ? { status: b.status } : {}),
      ...(b.revenue !== undefined ? { revenue: b.revenue } : {}),
      ...(b.value !== undefined ? { value: b.value } : {}),
      ...(b.address !== undefined ? { address: String(b.address).trim() } : {}),
      ...(b.remarks !== undefined ? { remarks: String(b.remarks).trim() } : {}),
    };
    if (b.lat !== undefined) update.lat = b.lat === '' ? undefined : Number(b.lat);
    if (b.lng !== undefined) update.lng = b.lng === '' ? undefined : Number(b.lng);
    if (b.images !== undefined) update.images = sanitizeImages(b.images);

    const saved = await Field.findByIdAndUpdate(id, update, { new: true });
    if (!saved) return res.status(404).json({ message: 'Field not found' });
    res.json({ field: saved });
  } catch (e) {
    console.error('[fields update]', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/fields/:id
exports.deleteField = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ message: 'invalid id' });

    const del = await Field.findByIdAndDelete(id);
    if (!del) return res.status(404).json({ message: 'Field not found' });
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('[fields delete]', e);
    res.status(500).json({ message: 'Server error' });
  }
};
