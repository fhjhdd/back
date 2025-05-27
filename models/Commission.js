const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // receiver
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // user who triggered it
  level: { type: Number, required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Commission', commissionSchema);
