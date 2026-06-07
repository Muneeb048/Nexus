const paymentService = require('../services/paymentService');

exports.createDepositIntent = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const result = await paymentService.createDepositIntent(req.user._id, amount);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('Create Deposit Intent error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.confirmDeposit = async (req, res) => {
  try {
    const { transactionId, paymentIntentId } = req.body;
    const transaction = await paymentService.confirmDeposit(transactionId, paymentIntentId);
    res.status(200).json({ success: true, transaction });
  } catch (error) {
    console.error('Confirm Deposit error:', error);
    res.status(404).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.transferFunds = async (req, res) => {
  try {
    const { recipientId, amount, description } = req.body;
    if (!recipientId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid transfer details' });
    }

    const transaction = await paymentService.transferFunds(req.user._id, recipientId, amount, description);
    res.status(200).json({ success: true, transaction });
  } catch (error) {
    console.error('Transfer Funds error:', error);
    res.status(400).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.withdrawFunds = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const transaction = await paymentService.withdrawFunds(req.user._id, amount);
    res.status(200).json({ success: true, transaction });
  } catch (error) {
    console.error('Withdraw Funds error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const result = await paymentService.getTransactionsAndBalance(req.user._id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('Get Transactions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
