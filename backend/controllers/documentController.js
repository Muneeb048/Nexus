const Document = require('../models/Document');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// @desc    Upload a document
// @route   POST /api/documents/upload
// @access  Private
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    // Convert local path to a URL accessible path (assuming server runs on same host for MVP)
    const fileUrl = `/uploads/${req.file.filename}`;

    const document = await Document.create({
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: fileUrl,
      uploadedBy: req.user._id
    });

    await document.populate('uploadedBy', 'name avatarUrl role');

    res.status(201).json({
      success: true,
      document
    });
  } catch (error) {
    console.error('Upload Document error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user's documents
// @route   GET /api/documents
// @access  Private
exports.getDocuments = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get documents uploaded by user or shared with user
    const documents = await Document.find({
      $or: [
        { uploadedBy: userId },
        { sharedWith: userId }
      ],
      status: 'active'
    })
      .populate('uploadedBy', 'name avatarUrl role')
      .populate('sharedWith', 'name avatarUrl role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    console.error('Get Documents error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Sign a document
// @route   POST /api/documents/:id/sign
// @access  Private
exports.signDocument = async (req, res, next) => {
  try {
    const { signatureImage } = req.body; // Expects base64 data URL

    if (!signatureImage) {
      return res.status(400).json({ success: false, message: 'Signature image is required' });
    }

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // For simplicity, anyone with access can sign in this MVP
    // You could restrict this to specific roles or assigned signers

    // Process base64 string
    const matches = signatureImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, message: 'Invalid signature image format' });
    }

    const imageBuffer = Buffer.from(matches[2], 'base64');
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const signatureFilename = `signature-${Date.now()}-${uniqueSuffix}.png`;
    const signaturePath = path.join(__dirname, '..', 'uploads', signatureFilename);

    // Save signature image to uploads folder
    fs.writeFileSync(signaturePath, imageBuffer);

    // Update document
    document.signatureUrl = `/uploads/${signatureFilename}`;
    await document.save();

    await document.populate('uploadedBy', 'name avatarUrl role');

    res.status(200).json({
      success: true,
      document
    });
  } catch (error) {
    console.error('Sign Document error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a document (soft delete)
// @route   DELETE /api/documents/:id
// @access  Private
exports.deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Only owner can delete
    if (document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this document' });
    }

    document.status = 'archived';
    await document.save();

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete Document error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
