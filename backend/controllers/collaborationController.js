const CollaborationRequest = require('../models/CollaborationRequest');

// @desc    Create collaboration request
// @route   POST /api/collaborations
// @access  Private (investor only)
exports.createRequest = async (req, res) => {
  try {
    // Only investors can send collaboration requests
    if (req.user.role !== 'investor') {
      return res.status(403).json({
        success: false,
        message: 'Only investors can send collaboration requests'
      });
    }

    const { entrepreneurId, message } = req.body;

    // Check for existing request
    const existing = await CollaborationRequest.findOne({
      investorId: req.user._id,
      entrepreneurId
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already sent a collaboration request to this entrepreneur'
      });
    }

    const request = await CollaborationRequest.create({
      investorId: req.user._id,
      entrepreneurId,
      message
    });

    // Populate investor and entrepreneur info
    await request.populate([
      { path: 'investorId', select: 'name email avatarUrl role' },
      { path: 'entrepreneurId', select: 'name email avatarUrl role' }
    ]);

    res.status(201).json({
      success: true,
      request
    });
  } catch (error) {
    console.error('CreateRequest error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get collaboration requests for current user
// @route   GET /api/collaborations
// @access  Private
exports.getRequests = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'entrepreneur') {
      query.entrepreneurId = req.user._id;
    } else {
      query.investorId = req.user._id;
    }

    const requests = await CollaborationRequest.find(query)
      .populate('investorId', 'name email avatarUrl role investmentInterests investmentStage')
      .populate('entrepreneurId', 'name email avatarUrl role startupName industry')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('GetRequests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update collaboration request status
// @route   PUT /api/collaborations/:id
// @access  Private (entrepreneur only — request recipient)
exports.updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be accepted or rejected'
      });
    }

    const request = await CollaborationRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration request not found'
      });
    }

    // Only the entrepreneur who received the request can update it
    if (request.entrepreneurId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this request'
      });
    }

    request.status = status;
    await request.save();

    await request.populate([
      { path: 'investorId', select: 'name email avatarUrl role' },
      { path: 'entrepreneurId', select: 'name email avatarUrl role' }
    ]);

    res.json({
      success: true,
      request
    });
  } catch (error) {
    console.error('UpdateRequestStatus error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
