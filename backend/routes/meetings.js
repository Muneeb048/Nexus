/**
 * @swagger
 * tags:
 *   name: Meetings
 *   description: Meeting APIs
 */

/**
 * @swagger
 * /api/meetings:
 *   post:
 *     summary: Create a meeting
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Meeting created
 *   get:
 *     summary: Get meetings
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of meetings
 * /api/meetings/{id}/status:
 *   put:
 *     summary: Update meeting status
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Meeting status updated
 */

const express = require('express');
const router = express.Router();
const {
  createMeeting,
  getMeetings,
  updateMeetingStatus
} = require('../controllers/meetingController');
const { protect } = require('../middleware/auth');

// All meeting routes require authentication
router.use(protect);

router.post('/', createMeeting);
router.get('/', getMeetings);
router.put('/:id/status', updateMeetingStatus);

module.exports = router;
