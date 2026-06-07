const { validationResult, body } = require('express-validator');
const authService = require('../services/authService');

exports.registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .isIn(['entrepreneur', 'investor'])
    .withMessage('Role must be entrepreneur or investor')
];

exports.loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const result = await authService.registerUser(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    console.error('Register error:', error);
    res.status(error.message === 'Email already in use' ? 400 : 500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, password, role } = req.body;
    const result = await authService.loginUser(email, password, role);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Invalid credentials'
    });
  }
};

exports.verify2FA = async (req, res) => {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) {
      return res.status(400).json({ success: false, message: 'User ID and code are required' });
    }

    const result = await authService.verify2FACode(userId, code);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Verify 2FA error:', error);
    res.status(400).json({ success: false, message: error.message || 'Invalid or expired code' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    await authService.requestPasswordReset(req.body.email);
    res.json({ success: true, message: 'Password reset instructions sent to your email' });
  } catch (error) {
    console.error('ForgotPassword error:', error);
    res.status(404).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('ResetPassword error:', error);
    res.status(400).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    await authService.logoutUser(req.user._id);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
