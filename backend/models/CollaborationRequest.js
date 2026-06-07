/**
 * @swagger
 * components:
 *   schemas:
 *     CollaborationRequest:
 *       type: object
 *       properties:
 *         sender:
 *           type: string
 *         receiver:
 *           type: string
 *         status:
 *           type: string
 *         message:
 *           type: string
 */

const mongoose = require('mongoose');

const collaborationRequestSchema = new mongoose.Schema({
  investorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  entrepreneurId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: [true, 'Please provide a message'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Prevent duplicate collaboration requests
collaborationRequestSchema.index(
  { investorId: 1, entrepreneurId: 1 },
  { unique: true }
);

module.exports = mongoose.model('CollaborationRequest', collaborationRequestSchema);
