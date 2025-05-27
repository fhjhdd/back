const mongoose = require("mongoose");
const User = require("../models/User");
const dotenv = require("dotenv");
const crypto = require("crypto");

dotenv.config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const run = async () => {
  try {
    const existingAdmin = await User.findOne({ isAdmin: true });
    if (existingAdmin) {
      console.log("Admin already exists:", existingAdmin.email);
      return;
    }

    const admin = new User({
      name: "Admin",
      email: "admin@myteamboost.com",
      password: process.env.ADMIN_PASSWORD || "Admin@123", // use env for real deployment
      uniqueId: crypto.randomBytes(6).toString("hex"), // e.g., '4f3b2c1d'
      level:1,
      isAdmin: true,
      isVerified: true,
      isApproved: true,
      isBlocked: false,
      isExpired: false,
      expiryDate: null, // optional
      totalEarnings: 0,
      totalWithdrawals: 0,
      balance: 0,
    });

    await admin.save();
    console.log("✅ Admin created:", admin.email);
  } catch (err) {
    console.error("❌ Error creating admin:", err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
