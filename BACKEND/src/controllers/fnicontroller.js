import { Types } from 'mongoose';

export async function createItem(req, res) {
  try {
    const { name, category, unit, openingQty, minQty, note, cost } = req.body;
    if (!name || !category || !unit || openingQty == null || cost == null) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const item = new FNIItem({
      name,
      category,
      unit,
      openingQty,
      qtyOnHand: openingQty,
      minQty: minQty ?? 0,
      note,
      batches: openingQty > 0 ? [{ qty: openingQty, unitCost: cost, date: new Date() }] : []
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
    console.log('--- adjustStock called ---');
    console.log('params:', req.params);
    console.log('body:', req.body);
    const { id } = req.params;
    const { delta, reason, note, cost } = req.body;
    if (!Types.ObjectId.isValid(id)) {
      console.error('Invalid ID');
      return res.status(400).json({ message: 'Invalid ID' });
    }
    if (!delta || typeof delta !== 'number' || delta === 0) {
      console.error('Invalid delta:', delta);
      return res.status(400).json({ message: 'Delta must be a non-zero number' });
    }
    const item = await FNIItem.findById(id);
    if (!item) {
      console.error('Item not found');
      return res.status(404).json({ message: 'Item not found' });
    }

    // FIFO logic for batches
    if (delta > 0 && reason === 'purchase') {
      if (cost == null || isNaN(cost) || cost < 0) {
        console.error('Cost is required for purchase:', cost);
        return res.status(400).json({ message: 'Cost is required for purchase' });
      }
      item.qtyOnHand += delta;
      item.batches.push({ qty: delta, unitCost: cost, date: new Date() });
    } else if (delta < 0 && (reason === 'usage' || reason === 'wastage')) {
      let qtyToRemove = Math.abs(delta);
      let totalCost = 0;
      while (qtyToRemove > 0 && item.batches.length > 0) {
        const batch = item.batches[0];
        if (batch.qty <= qtyToRemove) {
          totalCost += batch.qty * batch.unitCost;
          qtyToRemove -= batch.qty;
          item.batches.shift();
        } else {
          totalCost += qtyToRemove * batch.unitCost;
          batch.qty -= qtyToRemove;
          qtyToRemove = 0;
        }
      }
      if (qtyToRemove > 0) {
        console.error('Insufficient stock in batches');
        return res.status(409).json({ message: 'Insufficient stock in batches' });
      }
      item.qtyOnHand += delta;
    } else {
      item.qtyOnHand += delta;
    }

    await item.save();
    await FNIAdjustment.create({
      itemId: id,
      delta,
      reason: reason ?? 'correction',
      note
    });
    res.json(item);
  } catch (err) {
    console.error('adjustStock error:', err);
    res.status(400).json({ message: err.message });
  }
}
import FNIItem from '../../models/FNIItem.fifo.js';
import FNIAdjustment from '../../models/FNIAdjustment.js';
