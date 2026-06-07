/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Messaging APIs
 */

/**
 * @swagger
 * /api/messages/conversations:
 *   get:
 *     summary: Get all conversations
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 * /api/messages/{userId}:
 *   get:
 *     summary: Get messages with a specific user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of messages
 * /api/messages:
 *   post:
 *     summary: Send a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Message sent
 */

const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage,
  getConversations
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Important: /conversations must come before /:userId to avoid route conflict
router.get('/conversations', getConversations);
router.get('/:userId', getMessages);
router.post('/', sendMessage);

module.exports = router;
