/**
 * @swagger
 * components:
 *   schemas:
 *     Document:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         fileUrl:
 *           type: string
 *         uploadedBy:
 *           type: string
 *         type:
 *           type: string
 *         status:
 *           type: string
 */

const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  version: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  },
  signatureUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Document', documentSchema);
