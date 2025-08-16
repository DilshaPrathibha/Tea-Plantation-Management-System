const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, unique: true, lowercase: true, trim: true, required: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'worker', 'production_manager', 'inventory_manager', 'field_supervisor'],
      default: 'worker'
    },
    // extra profile fields
    phone: { type: String, trim: true, default: '' },
    estate: { type: String, trim: true, default: '' },
    department: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
