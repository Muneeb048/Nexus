/**
 * @swagger
 * tags:
 *   name: Collaborations
 *   description: Collaboration APIs
 */

/**
 * @swagger
 * /api/collaborations:
 *   post:
 *     summary: Create a collaboration request
 *     tags: [Collaborations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Collaboration request created
 *   get:
 *     summary: Get collaboration requests
 *     tags: [Collaborations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of requests
 * /api/collaborations/{id}:
 *   put:
 *     summary: Update collaboration request status
 *     tags: [Collaborations]
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
 *         description: Collaboration request updated
 */

const express = require('express');
const router = express.Router();
const {
  createRequest,
  getRequests,
  updateRequestStatus
} = require('../controllers/collaborationController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.post('/', createRequest);
router.get('/', getRequests);
router.put('/:id', updateRequestStatus);

module.exports = router;
