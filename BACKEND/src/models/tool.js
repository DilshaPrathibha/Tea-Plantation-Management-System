const mongoose = require('mongoose');

const toolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Tool', toolSchema);
