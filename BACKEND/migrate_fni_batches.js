// Migration script: Add FIFO batches to existing FNI items
// Usage: node migrate_fni_batches.js
import mongoose from 'mongoose';
import FNIItem from './models/FNIItem.fifo.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/your-db-name';

async function migrate() {
  await mongoose.connect(MONGO_URI);
  const items = await FNIItem.find({});
  for (const item of items) {
    if (!item.batches || item.batches.length === 0) {
      // Prompt for cost or use a default (e.g., 0)
      const cost = 0; // TODO: Replace with actual cost if known
      if (item.qtyOnHand > 0) {
        item.batches = [{ qty: item.qtyOnHand, unitCost: cost, date: item.createdAt || new Date() }];
        await item.save();
        console.log(`Migrated item ${item.name} (${item._id}) with qty ${item.qtyOnHand} and cost ${cost}`);
      }
    }
  }
  await mongoose.disconnect();
  console.log('Migration complete.');
}

migrate().catch(e => { console.error(e); process.exit(1); });
