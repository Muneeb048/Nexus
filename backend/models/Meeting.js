/**
 * @swagger
 * components:
 *   schemas:
 *     Meeting:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 */

const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a meeting title'],
    trim: true,
    maxlength: [100, 'Title can not be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description can not be more than 500 characters']
  },
  startTime: {
    type: Date,
    required: [true, 'Please provide a start time']
  },
  endTime: {
    type: Date,
    required: [true, 'Please provide an end time']
  },
  organizerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  attendeeId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  callRoomId: {
    type: String
  }
}, {
  timestamps: true
});

// Check for conflicting meetings before saving
meetingSchema.pre('save', async function(next) {
  // Only check conflicts if the meeting is new or changing time/status
  if (!this.isModified('startTime') && !this.isModified('endTime') && !this.isModified('status')) {
    return next();
  }

  // If status is rejected or cancelled, no conflict check needed
  if (this.status === 'rejected' || this.status === 'cancelled') {
    return next();
  }

  // Conflict logic: new meeting overlaps with an existing accepted/pending meeting
  // for either the organizer or the attendee
  const overlappingMeeting = await this.constructor.findOne({
    _id: { $ne: this._id }, // Exclude current meeting if updating
    status: { $in: ['pending', 'accepted'] },
    $or: [
      { organizerId: this.organizerId },
      { attendeeId: this.organizerId },
      { organizerId: this.attendeeId },
      { attendeeId: this.attendeeId }
    ],
    $and: [
      { startTime: { $lt: this.endTime } },
      { endTime: { $gt: this.startTime } }
    ]
  });

  if (overlappingMeeting) {
    const err = new Error('Meeting conflict detected: One of the participants is already booked during this time.');
    err.statusCode = 409; // Conflict
    return next(err);
  }

  // Generate a random room ID for WebRTC video calls if not exists
  if (!this.callRoomId) {
    this.callRoomId = Math.random().toString(36).substring(2, 15);
  }

  next();
});

module.exports = mongoose.model('Meeting', meetingSchema);
