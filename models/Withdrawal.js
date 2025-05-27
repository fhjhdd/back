const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  userId: { type:String, ref: 'User', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['uniqueId', 'crypto'], required: true },
  address: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  processedAt: { type: Date }
});

module.exports = mongoose.models.Withdrawal || mongoose.model('Withdrawal', withdrawalSchema);

