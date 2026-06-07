const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

exports.registerUser = async (data) => {
  const { name, email, password, role } = data;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Email already in use');
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
    isOnline: true
  });

  const token = generateToken(user._id);

  return { token, user: user.toJSON() };
};

exports.loginUser = async (email, password, role) => {
  const query = { email };
  if (role) {
    query.role = role;
  }

  const user = await User.findOne(query).select('+password');

  if (!user) {
    throw new Error('Invalid credentials or user not found');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  if (user.is2FAEnabled) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.twoFactorCode = crypto.createHash('sha256').update(otp).digest('hex');
    user.twoFactorExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    try {
      await sendEmail({
        email: user.email,
        subject: 'Your Nexus 2FA Code',
        message: `Your login code is: ${otp}\nIt is valid for 10 minutes.`
      });
    } catch (err) {
      console.error('Error sending 2FA email', err);
    }

    return { requires2FA: true, message: 'OTP sent to email', userId: user._id, demoOtp: otp };
  }

  user.isOnline = true;
  await user.save();

  const token = generateToken(user._id);
  return { requires2FA: false, token, user: user.toJSON() };
};

exports.verify2FACode = async (userId, code) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

  if (user.twoFactorCode !== hashedCode || user.twoFactorExpires < Date.now()) {
    throw new Error('Invalid or expired code');
  }

  user.twoFactorCode = undefined;
  user.twoFactorExpires = undefined;
  user.isOnline = true;
  await user.save();

  const token = generateToken(user._id);
  return { token, user: user.toJSON() };
};

exports.getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  return user;
};

exports.requestPasswordReset = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('No account found with this email');
  }
  console.log(`Password reset requested for: ${email}`);
  return true;
};

exports.resetPassword = async (token, newPassword) => {
  if (!token || !newPassword) {
    throw new Error('Token and new password are required');
  }
  return true;
};

exports.logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { isOnline: false });
  return true;
};
