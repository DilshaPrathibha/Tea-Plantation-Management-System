// Migration script: Add missing FIFO batches to FNI items with qtyOnHand > 0 and empty batches
// Usage: node migrate_fni_add_batches.js

import mongoose from 'mongoose';
import FNIItem from './models/FNIItem.fifo.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function migrate() {
  await mongoose.connect(MONGO_URI);
  const items = await FNIItem.find({});
  for (const item of items) {
    if ((!item.batches || item.batches.length === 0) && item.qtyOnHand > 0) {
      // Use a default cost (0) or prompt for real cost if needed
      const cost = 0;
      item.batches = [{ qty: item.qtyOnHand, unitCost: cost, date: item.updatedAt || new Date() }];
      await item.save();
      console.log(`Migrated item ${item.name} (${item._id}) with qty ${item.qtyOnHand} and cost ${cost}`);
    }
  }
  await mongoose.disconnect();
  console.log('Migration complete.');
}

migrate().catch(e => { console.error(e); process.exit(1); });
