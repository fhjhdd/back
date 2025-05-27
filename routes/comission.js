const express = require('express');
const router = express.Router();
const Commission = require('../models/Commission');
const User = require('../models/User');

router.get('/:userId', async (req, res) => {
  try {
    const commissions = await Commission.find({ userId: req.params.userId })
      .populate('fromUserId', 'name email');
    res.json(commissions);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch commissions', error: err.message });
  }
});

module.exports = router;
