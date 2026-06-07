/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       properties:
 *         user:
 *           type: string
 *         amount:
 *           type: number
 *         type:
 *           type: string
 *         status:
 *           type: string
 */

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'transfer'],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending'
  },
  stripePaymentIntentId: {
    type: String
  },
  // If type is 'transfer', this points to the recipient
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
