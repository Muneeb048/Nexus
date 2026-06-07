const Meeting = require('../models/Meeting');

// @desc    Create a meeting
// @route   POST /api/meetings
// @access  Private
exports.createMeeting = async (req, res, next) => {
  try {
    const { title, description, startTime, endTime, attendeeId } = req.body;

    if (!attendeeId) {
      return res.status(400).json({ success: false, message: 'Attendee ID is required' });
    }

    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    const meeting = await Meeting.create({
      title,
      description,
      startTime,
      endTime,
      organizerId: req.user._id,
      attendeeId
    });

    await meeting.populate('organizerId', 'name avatarUrl role');
    await meeting.populate('attendeeId', 'name avatarUrl role');

    res.status(201).json({
      success: true,
      meeting
    });
  } catch (error) {
    console.error('Create Meeting error:', error);
    if (error.statusCode === 409) {
      return res.status(409).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user's meetings
// @route   GET /api/meetings
// @access  Private
exports.getMeetings = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get meetings where user is either organizer or attendee
    const meetings = await Meeting.find({
      $or: [{ organizerId: userId }, { attendeeId: userId }]
    })
      .populate('organizerId', 'name avatarUrl role email')
      .populate('attendeeId', 'name avatarUrl role email')
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      count: meetings.length,
      meetings
    });
  } catch (error) {
    console.error('Get Meetings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update meeting status
// @route   PUT /api/meetings/:id/status
// @access  Private
exports.updateMeetingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['accepted', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    // Only attendee can accept/reject
    if ((status === 'accepted' || status === 'rejected') && meeting.attendeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the attendee can accept or reject the meeting' });
    }

    // Either can cancel
    if (status === 'cancelled' && meeting.attendeeId.toString() !== req.user._id.toString() && meeting.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this meeting' });
    }

    meeting.status = status;
    await meeting.save(); // This will trigger the pre-save hook to check conflicts again just in case

    await meeting.populate('organizerId', 'name avatarUrl role');
    await meeting.populate('attendeeId', 'name avatarUrl role');

    res.status(200).json({
      success: true,
      meeting
    });
  } catch (error) {
    console.error('Update Meeting Status error:', error);
    if (error.statusCode === 409) {
      return res.status(409).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
