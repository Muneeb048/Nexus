/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Document APIs
 */

/**
 * @swagger
 * /api/documents/upload:
 *   post:
 *     summary: Upload a document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Document uploaded
 * /api/documents:
 *   get:
 *     summary: Get documents
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of documents
 * /api/documents/{id}/sign:
 *   post:
 *     summary: Sign a document
 *     tags: [Documents]
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
 *         description: Document signed
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     tags: [Documents]
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
 *         description: Document deleted
 */

const express = require('express');
const router = express.Router();
const {
  uploadDocument,
  getDocuments,
  signDocument,
  deleteDocument
} = require('../controllers/documentController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(protect);

router.post('/upload', upload.single('document'), uploadDocument);
router.get('/', getDocuments);
router.post('/:id/sign', signDocument);
router.delete('/:id', deleteDocument);

module.exports = router;
