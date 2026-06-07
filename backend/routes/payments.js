/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment APIs
 */

/**
 * @swagger
 * /api/payments/deposit:
 *   post:
 *     summary: Create deposit intent
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deposit intent created
 * /api/payments/deposit/confirm:
 *   post:
 *     summary: Confirm deposit
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deposit confirmed
 * /api/payments/transfer:
 *   post:
 *     summary: Transfer funds
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Funds transferred
 * /api/payments/withdraw:
 *   post:
 *     summary: Withdraw funds
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Funds withdrawn
 * /api/payments/transactions:
 *   get:
 *     summary: Get user transactions
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of transactions
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const {
  createDepositIntent,
  confirmDeposit,
  transferFunds,
  withdrawFunds,
  getTransactions
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// All payment routes require authentication
router.use(protect);

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

router.post('/deposit', [
  body('amount').isNumeric().withMessage('Amount must be a number').isFloat({ min: 1 }).withMessage('Amount must be at least $1'),
  validate
], createDepositIntent);

router.post('/deposit/confirm', [
  body('transactionId').notEmpty().withMessage('Transaction ID is required'),
  body('paymentIntentId').notEmpty().withMessage('Payment Intent ID is required'),
  validate
], confirmDeposit);

router.post('/transfer', [
  body('recipientId').notEmpty().withMessage('Recipient ID is required'),
  body('amount').isNumeric().withMessage('Amount must be a number').isFloat({ min: 1 }).withMessage('Amount must be at least $1'),
  validate
], transferFunds);

router.post('/withdraw', [
  body('amount').isNumeric().withMessage('Amount must be a number').isFloat({ min: 1 }).withMessage('Amount must be at least $1'),
  validate
], withdrawFunds);

router.get('/transactions', getTransactions);

module.exports = router;
