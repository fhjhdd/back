const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');

exports.getWithdrawals = async (req, res) => {
    try {
      const { status } = req.query;
      const filter = status ? { status } : {};
      const withdrawals = await Withdrawal.find(filter);
  
      const withdrawalsWithNames = await Promise.all(withdrawals.map(async (w) => {
        let recipientName = null;
        let recipientId = null;  // declare here
      
        if (w.method === 'uniqueId') {
          const recipient = await User.findOne({ uniqueId: w.address });
          recipientName = recipient ? recipient.name : null;
          recipientId = recipient ? recipient._id : null;  // assign safely
        }
      
        return {
          ...w.toObject(),
          recipientName,
          recipientId,  // include here so it's part of response
        };
      }));
  
      res.json(withdrawalsWithNames);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  };
  

  exports.getUserWithdrawals = async (req, res) => {
    try {
      const { userId } = req.params;
      const withdrawals = await Withdrawal.find({ userId });
  
      const withdrawalsWithNames = await Promise.all(withdrawals.map(async (w) => {
        let recipientName = null;
        let recipientId = null;  // declare here
      
        if (w.method === 'uniqueId') {
          const recipient = await User.findOne({ uniqueId: w.address });
          recipientName = recipient ? recipient.name : null;
          recipientId = recipient ? recipient._id : null;  // assign safely
        }
      
        return {
          ...w.toObject(),
          recipientName,
          recipientId,  // include here so it's part of response
        };
      }));
      res.json(withdrawalsWithNames);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  };
  

exports.createWithdrawal = async (req, res, next) => {
  try {
    const { userId, amount, method, address, notes } = req.body;

    // Check for existing pending withdrawal
    const existingPending = await Withdrawal.findOne({
      userId,
      status: 'pending',
    });

    if (existingPending) {
      return res.status(403).json({
        success: false,
        message: 'You already have a pending withdrawal request. Please wait until it is approved or rejected.',
      });
    }

    // Proceed with creating withdrawal
    const withdrawal = await Withdrawal.create({
      userId,
      amount,
      notes,
       method, address,
      status: 'pending',
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully.',
      withdrawal,
    });
  } catch (error) {
    next(error);
  }
};


exports.approveWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).send('Withdrawal not found');

    withdrawal.status = 'approved';
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    const user = await User.findOne({ uniqueId: withdrawal.userId });
    console.log(user)
    if (user) {
      user.balance -= withdrawal.amount;
      user.totalWithdrawals += withdrawal.amount;
      await user.save();
    }

    res.json(withdrawal);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.rejectWithdrawal = async (req, res) => {
  try {
    const { notes } = req.body;
    console.log(req.params.id)
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).send('Withdrawal not found');

    withdrawal.status = 'rejected';
    withdrawal.notes = notes;
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    res.json(withdrawal);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
