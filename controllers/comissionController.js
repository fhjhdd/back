const Commission = require('../models/Commission');
const User = require('../models/User');

const COMMISSION_AMOUNTS = { 1:10, 2: 2.5, 3: 1.5, 4: 1, 5: 1 };

exports.awardReferralCommissions = async(newUser) => {
    let currentReferrerId = newUser.referrerId;
    let level = 1;
  
    while (currentReferrerId && level <= 5) {
      const referrer = await User.findById(currentReferrerId);
      if (!referrer) break;
  
      const amount = COMMISSION_AMOUNTS[level];
  
      await Commission.create({
        userId: referrer._id,
        fromUserId: newUser._id,
        level,
        amount
      });
  
      // Optionally update referrer's balance
      referrer.totalEarnings += amount;
      referrer.balance += amount;
      await referrer.save();
  
      currentReferrerId = referrer.referrerId;
      level++;
    }
  }
  