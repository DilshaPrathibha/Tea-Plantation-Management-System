import FNIItem from '../../models/FNIItem.js';
import FNIAdjustment from '../../models/FNIAdjustment.js';
import { Types } from 'mongoose';

export async function createItem(req, res) {
  try {
    const { name, category, unit, openingQty, minQty, note } = req.body;
    if (!name || !category || !unit || openingQty == null) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const item = new FNIItem({
      name,
      category,
      unit,
      openingQty,
      qtyOnHand: openingQty,
      minQty: minQty ?? 0,
      note
    });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function listItems(req, res) {
  try {
    const { category, q } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (q) filter.name = { $regex: q, $options: 'i' };
    const items = await FNIItem.find(filter).sort({ updatedAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function getItem(req, res) {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });
    const item = await FNIItem.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function updateItem(req, res) {
  try {
    const { id } = req.params;
    const { name, unit, minQty, note } = req.body;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });
    const item = await FNIItem.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    item.name = name ?? item.name;
    item.unit = unit ?? item.unit;
    item.minQty = minQty ?? item.minQty;
    item.note = note ?? item.note;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function deleteItem(req, res) {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });
    const item = await FNIItem.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function adjustStock(req, res) {
  try {
    const { id } = req.params;
    const { delta, reason, note } = req.body;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });
    if (!delta || typeof delta !== 'number' || delta === 0) {
      return res.status(400).json({ message: 'Delta must be a non-zero number' });
    }
    const filter = { _id: id };
    if (delta < 0) {
      filter.qtyOnHand = { $gte: Math.abs(delta) };
    }
    const update = { $inc: { qtyOnHand: delta } };
    const item = await FNIItem.findOneAndUpdate(filter, update, { new: true });
    if (!item) {
      return res.status(409).json({ message: 'Insufficient stock' });
    }
    await FNIAdjustment.create({
      itemId: id,
      delta,
      reason: reason ?? 'correction',
      note
    });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
