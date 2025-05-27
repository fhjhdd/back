const User = require('../models/User');
const generatePassword = require('../utils/generatePassword');
const { awardReferralCommissions} = require('./comissionController');
const bcrypt = require('bcrypt');

exports.addUser = async (req, res, next) => {
  try {
    const { name, email, password, referrerId } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User Email already exists' });
    }
    const creator = await User.findOne({ uniqueId: referrerId });
    if (!creator) return res.status(404).json({ message: 'Invalid ReferrerID' });

    // Get the most recently created user to determine the last uniqueId number
    const lastUser = await User.findOne({})
      .sort({ createdAt: -1 })
      .select('uniqueId')
      .lean();

    let newNumber = 1001;
    if (lastUser && lastUser.uniqueId && lastUser.uniqueId.startsWith('USER')) {
      const lastNumber = parseInt(lastUser.uniqueId.replace('USER', ''), 10);
      if (!isNaN(lastNumber)) {
        newNumber = lastNumber + 1;
      }
    }

    const generatedUniqueId = `USER${newNumber}`;

    const newUser = await User.create({
      name,
      email,
      password,
      uniqueId: generatedUniqueId,
      referrerId: creator._id,
      isApproved: false,
      level: creator.level + 1,
      isBlocked: false,
      isVerified: false,
      isAdmin: false,
      isExpired: false,
      expiryDate: null,
    });

    res.status(201).json({ user: newUser.name, email: newUser.email, password });
  } catch (error) {
    next(error);
  }
};

  

exports.approveUser = async (req, res, next) => {
  try {
    const { uniqueId } = req.params;
    const { expiryDuration } = req.body;

    const user = await User.findOne({ uniqueId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const admin = await User.findById(req.user);
    if (!admin?.isAdmin) return res.status(403).json({ message: 'Only admin can approve users' });

    user.isApproved = true;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (expiryDuration));
    user.expiryDate = expiryDate;

    // Mark as approved and not expired
    user.isApproved = true;
    if (expiryDate > new Date()) {
      user.isExpired = false;
    }

    await user.save();

    await awardReferralCommissions(user);

    res.status(200).json({ message: 'User approved and commission awarded' });
  } catch (error) {
    next(error);
  }
};


exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// controllers/referralController.ts

exports.getSpecificUserTeamData = async (req, res) => {
  try {
    const { uniqueId } = req.params;

    // 1. Find the root user by uniqueId
    const rootUser = await User.findOne({ uniqueId }).lean();
    if (!rootUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Fetch all users
    const users = await User.find().lean();

    // 3. Build the referral tree using MongoDB _id as linkage
    const buildReferralTree = (rootMongoId) => {
      const referrals = [];

      const recurse = (currentId, level) => {
        users.forEach(user => {
          if (user.referrerId?.toString() === currentId.toString()) {
            referrals.push({
              id: (referrals.length + 1).toString(),
              referrerId: currentId.toString(),
              refereeId: user.uniqueId,
              level,
              createdAt: user.createdAt
            });
            recurse(user._id, level + 1);
          }
        });
      };

      recurse(rootMongoId, 1);
      return referrals;
    };

    // 4. Generate and return tree
    const referralData = buildReferralTree(rootUser._id);
    res.json(referralData);

  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch referral data', error: err.message });
  }
};

exports.getUsersByIdsHandler = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string')) {
      return res.status(400).json({ message: 'Invalid or missing user IDs' });
    }

    const users = await User.find({ uniqueId: { $in: ids } }).select('-password'); // Exclude password

    res.json(users);
  } catch (error) {
    console.error('Error fetching users by IDs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// exports.approveUser = async (req, res, next) => {
//   try {
//     const { expiryDuration } = req.body; // in days
//     const user = await User.findById(req.params.id);
//     const admin = await User.findById(req.user);

//     if (!user) return res.status(404).json({ message: 'User not found' });
//     if (!admin || !admin.isAdmin) return res.status(403).json({ message: 'Only admin can approve users' });

//     // Mark as approved
//     user.isApproved = true;

//     // Set expiry date
//     if (expiryDuration && !isNaN(expiryDuration)) {
//       const now = new Date();
//       now.setDate(now.getDate() + Number(expiryDuration));
//       user.expiryDate = now;
//     }

//     await user.save();

//     // Award referral commissions
//     const { awardReferralCommissions } = require('./comissionController');
//     await awardReferralCommissions(user);

//     res.status(200).json({ message: 'User approved successfully and commissions awarded.' });
//   } catch (error) {
//     console.error('Approval error:', error);
//     next(error);
//   }
// };


exports.getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
  .select('+expiryDate');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};



exports.getUserByUniqueId = async (req, res) => {
  try {
    const { uniqueId } = req.params;
    const user = await User.findOne({ uniqueId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.blockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    await User.findOneAndUpdate( { uniqueId: userId }, { isBlocked: true });
    res.json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    next(error);
  }
};

// Unblock user
exports.unblockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    await User.findOneAndUpdate( { uniqueId: userId }, { isBlocked: false });
    res.json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    next(error);
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate(
      { uniqueId: userId },
      { password: hashedPassword }
    );

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getLatestTeamMembers = async (req, res, next) => {
  try {
    const { referrerId } = req.params;

    const referrer = await User.findOne({ uniqueId: referrerId });
    if (!referrer) return res.status(404).json({ success: false, message: 'Referrer not found' });

    const latestMembers = await User.find({ referrerId: referrer._id })
      .sort({ createdAt: -1 })
      .limit(5); // latest 5 members

    res.json({
      success: true,
      message: 'Latest team members fetched successfully',
      data: latestMembers,
    });
  } catch (error) {
    next(error);
  }
};