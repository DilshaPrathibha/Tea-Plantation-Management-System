const { Types } = require('mongoose');
const FNIItem = require('../../models/FNIItem');
const FNIAdjustment = require('../../models/FNIAdjustment');
const Supplier = require('../../models/Supplier');

const SUPPLIER_FIELDS = 'supplierId name type status contactNumber email contactPerson';

async function validateSuppliers(suppliers, category) {
  if (suppliers == null) return [];
  if (!Array.isArray(suppliers)) {
    const err = new Error('Suppliers must be an array');
    err.statusCode = 400;
    throw err;
  }
  const cleanedIds = Array.from(new Set(
    suppliers
      .filter(Boolean)
      .map(id => id.toString().trim())
      .filter(Boolean)
  ));
  if (cleanedIds.length === 0) return [];
  const invalidId = cleanedIds.find(id => !Types.ObjectId.isValid(id));
  if (invalidId) {
    const err = new Error('One or more supplier IDs are invalid');
    err.statusCode = 400;
    throw err;
  }
  const supplierDocs = await Supplier.find({ _id: { $in: cleanedIds } });
  if (supplierDocs.length !== cleanedIds.length) {
    const missingSet = new Set(cleanedIds);
    supplierDocs.forEach(doc => missingSet.delete(String(doc._id)));
    const err = new Error(`Unknown supplier IDs: ${Array.from(missingSet).join(', ')}`);
    err.statusCode = 404;
    throw err;
  }
  const suspended = supplierDocs.filter(doc => doc.status === 'suspended');
  if (suspended.length > 0) {
    const err = new Error(`Cannot assign suspended suppliers: ${suspended.map(s => s.name).join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  if (category) {
    const mismatched = supplierDocs.filter(doc => doc.type !== category && doc.type !== 'other');
    if (mismatched.length > 0) {
      const err = new Error(`Suppliers ${mismatched.map(s => s.name).join(', ')} do not match the item's category`);
      err.statusCode = 400;
      throw err;
    }
  }
  return cleanedIds;
}

async function createItem(req, res) {
  try {
    const { name, category, unit, openingQty, minQty, note, cost, suppliers } = req.body;
    if (!name || !category || !unit || openingQty == null || cost == null) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const supplierIds = await validateSuppliers(suppliers, category);
    const item = new FNIItem({
      name,
      category,
      unit,
      openingQty,
      qtyOnHand: openingQty,
      minQty: minQty ?? 0,
      note,
      suppliers: supplierIds,
      batches: openingQty > 0 ? [{ qty: openingQty, unitCost: cost, date: new Date() }] : []
    });
    await item.save();
    await item.populate('suppliers', SUPPLIER_FIELDS);
    res.status(201).json(item);
  } catch (err) {
    res.status(err.statusCode || 400).json({ message: err.message });
  }
}

async function listItems(req, res) {
  try {
    const { category, q } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (q) filter.name = { $regex: q, $options: 'i' };
    
    // Use lean() for better performance and select only needed fields
    const items = await FNIItem.find(filter)
      .sort({ updatedAt: -1 })
      .populate('suppliers', SUPPLIER_FIELDS)
      .lean() // Convert to plain JavaScript objects for better performance
      .maxTimeMS(10000); // Set max query time to 10 seconds
    
    res.json(items);
  } catch (err) {
    console.error('listItems error:', err);
    
    // Handle specific MongoDB timeout errors
    if (err.name === 'MongooseError' && err.message.includes('buffering timed out')) {
      return res.status(503).json({ message: 'Database connection issue - please try again' });
    }
    if (err.name === 'MongooseError' && err.message.includes('maxTimeMS')) {
      return res.status(504).json({ message: 'Query timeout - database may be slow' });
    }
    
    res.status(500).json({ message: err.message || 'Failed to fetch items' });
  }
}

async function getItem(req, res) {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });
    const item = await FNIItem.findById(id).populate('suppliers', SUPPLIER_FIELDS);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function updateItem(req, res) {
  try {
    const { id } = req.params;
    const { name, unit, minQty, note, suppliers } = req.body;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });
    const item = await FNIItem.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    item.name = name ?? item.name;
    item.unit = unit ?? item.unit;
    item.minQty = minQty ?? item.minQty;
    item.note = note ?? item.note;
    if (suppliers !== undefined) {
      const supplierIds = await validateSuppliers(suppliers, item.category);
      item.suppliers = supplierIds;
    }
    await item.save();
    await item.populate('suppliers', SUPPLIER_FIELDS);
    res.json(item);
  } catch (err) {
    res.status(err.statusCode || 400).json({ message: err.message });
  }
}

async function deleteItem(req, res) {
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

async function adjustStock(req, res) {
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

async function getRecentAdjustments(req, res) {
  try {
    const adjustments = await FNIAdjustment.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('item', 'name unit category');
    
    const formattedAdjustments = adjustments.map(adj => ({
      _id: adj._id,
      itemName: adj.item?.name || 'Unknown Item',
      unit: adj.item?.unit || '',
      category: adj.item?.category || '',
      delta: adj.delta,
      reason: adj.reason,
      createdAt: adj.createdAt
    }));
    
    res.json(formattedAdjustments);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

module.exports = {
  createItem,
  listItems,
  getItem,
  updateItem,
  deleteItem,
  adjustStock,
  getRecentAdjustments
};
