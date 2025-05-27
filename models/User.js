const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  uniqueId: { type: String, required: true, unique: true }, // e.g. referral code or user handle
  referrerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  level: { type: Number, default: 1 },
  isAdmin: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  isExpired: { type: Boolean, default: false },
  expiryDate: { type: Date, default: null },

  totalEarnings: { type: Number, default: 0 },
  totalWithdrawals: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
}, {
  timestamps: true
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Password comparison method
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
