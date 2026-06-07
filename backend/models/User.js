/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *         avatarUrl:
 *           type: string
 *         bio:
 *           type: string
 *         isOnline:
 *           type: boolean
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['entrepreneur', 'investor'],
    required: [true, 'Please specify a role']
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  
  // ── Security Fields ──
  is2FAEnabled: {
    type: Boolean,
    default: true // Enabled by default for mockup purposes
  },
  twoFactorCode: String,
  twoFactorExpires: Date,

  // ── Entrepreneur-specific fields ──
  startupName: { type: String, default: '' },
  pitchSummary: { type: String, default: '' },
  fundingNeeded: { type: String, default: '' },
  industry: { type: String, default: '' },
  location: { type: String, default: '' },
  foundedYear: { type: Number },
  teamSize: { type: Number, default: 0 },

  // ── Investor-specific fields ──
  investmentInterests: [{ type: String }],
  investmentStage: [{ type: String }],
  portfolioCompanies: [{ type: String }],
  totalInvestments: { type: Number, default: 0 },
  minimumInvestment: { type: String, default: '' },
  maximumInvestment: { type: String, default: '' }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password was modified
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Set default avatar URL if none provided
userSchema.pre('save', function(next) {
  if (!this.avatarUrl) {
    this.avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=random`;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
