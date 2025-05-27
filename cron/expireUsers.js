const cron = require('node-cron');
const User = require('../models/User');

// Runs every day at midnight (00:00)
cron.schedule('0 0 * * *', async () => {
  console.log('Running expiry check...');

  const now = new Date();

  try {
    const result = await User.updateMany(
      {
        expiryDate: { $lt: now },
        isApproved: true
      },
      {
        $set: { isApproved: false, isExpired: true }
      }
    );

    console.log(`✅ Expiry job done: ${result.modifiedCount} user(s) marked as unapproved.`);
  } catch (error) {
    console.error('❌ Error in expiry job:', error);
  }
});
