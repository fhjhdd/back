const User = require('../models/User');
const generateToken = require('../utils/generateToken');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' , status:401 });
    }

    // Check if user is approved
    if (!user.isApproved) {
      return res.status(403).json({ message: 'User not approved yet',status:403 });
    }

    // Optional: block or expired checks
    if (user.isBlocked) {
      return res.status(403).json({ message: 'User account is blocked',status:403 });
    }
    // if (user.isExpired) {
    //   return res.status(403).json({ message: 'User account has expired' ,status:403});
    // }

    // Generate JWT token
    const token = generateToken(user._id);

    // Return user data - note no "role", but isAdmin instead
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        isApproved: user.isApproved,
        balance: user.balance,
        totalEarnings: user.totalEarnings,
        totalWithdrawals: user.totalWithdrawals,
        uniqueId: user.uniqueId,
        // any other fields you want to expose safely
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user (with default flags)
    const newUser = new User({
      name,
      email,
      password,
      isAdmin: false,
      isVerified: false,
      isApproved: false,
      isBlocked: false,
      isExpired: false,
      totalEarnings: 0,
      totalWithdrawals: 0,
      balance: 0,
      uniqueId: require('crypto').randomBytes(6).toString('hex'),
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    next(error);
  }
};

// controllers/userController.js
exports.getLatestTeamMembers = async (req, res, next) => {
  try {
    const { referrerId } = req.params;

    const referrer = await User.findOne({ uniqueId: referrerId });
    if (!referrer) return res.status(404).json({ success: false, message: 'Referrer not found' });

    const latestMembers = await User.find({ referrerId: referrer._id })
      .sort({ createdAt: -1 })
      .limit(10); // latest 10 members

    res.json({
      success: true,
      message: 'Latest team members fetched successfully',
      data: latestMembers,
    });
  } catch (error) {
    next(error);
  }
};

