const Transaction = require('../models/Transaction');
const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_dummy_key');

exports.createDepositIntent = async (userId, amount) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Stripe expects amounts in cents
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      userId: userId.toString()
    }
  });

  const transaction = await Transaction.create({
    user: userId,
    amount,
    type: 'deposit',
    status: 'Pending',
    stripePaymentIntentId: paymentIntent.id,
    description: 'Wallet Deposit'
  });

  return { clientSecret: paymentIntent.client_secret, transactionId: transaction._id };
};

exports.confirmDeposit = async (transactionId, paymentIntentId) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction || transaction.stripePaymentIntentId !== paymentIntentId) {
    throw new Error('Transaction not found or intent mismatch');
  }

  transaction.status = 'Completed';
  await transaction.save();

  return transaction;
};

exports.transferFunds = async (senderId, recipientId, amount, description) => {
  const recipient = await User.findById(recipientId);
  if (!recipient) {
    throw new Error('Recipient not found');
  }

  // Calculate current balance
  const deposits = await Transaction.aggregate([
    { $match: { user: senderId, status: 'Completed', type: 'deposit' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  const withdrawals = await Transaction.aggregate([
    { $match: { user: senderId, status: 'Completed', type: 'withdrawal' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const sentTransfers = await Transaction.aggregate([
    { $match: { user: senderId, status: 'Completed', type: 'transfer' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const receivedTransfers = await Transaction.aggregate([
    { $match: { recipient: senderId, status: 'Completed', type: 'transfer' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const depTotal = deposits.length > 0 ? deposits[0].total : 0;
  const withTotal = withdrawals.length > 0 ? withdrawals[0].total : 0;
  const sentTotal = sentTransfers.length > 0 ? sentTransfers[0].total : 0;
  const recTotal = receivedTransfers.length > 0 ? receivedTransfers[0].total : 0;

  const balance = depTotal + recTotal - withTotal - sentTotal;

  if (balance < amount) {
    throw new Error('Insufficient funds');
  }

  const transaction = await Transaction.create({
    user: senderId,
    recipient: recipientId,
    amount,
    type: 'transfer',
    status: 'Completed',
    description: description || 'Transfer to ' + recipient.name
  });

  return transaction;
};

exports.withdrawFunds = async (userId, amount) => {
  const { balance } = await exports.getTransactionsAndBalance(userId);
  
  if (balance < amount) {
    throw new Error('Insufficient funds');
  }

  const transaction = await Transaction.create({
    user: userId,
    amount,
    type: 'withdrawal',
    status: 'Completed',
    description: 'Withdrawal to bank account'
  });

  return transaction;
};

exports.getTransactionsAndBalance = async (userId) => {
  const transactions = await Transaction.find({
    $or: [
      { user: userId },
      { recipient: userId }
    ]
  })
  .populate('user', 'name avatarUrl')
  .populate('recipient', 'name avatarUrl')
  .sort({ createdAt: -1 });

  let balance = 0;
  transactions.forEach(t => {
    if (t.status === 'Completed') {
      if (t.type === 'deposit') {
        balance += t.amount;
      } else if (t.type === 'withdrawal') {
        balance -= t.amount;
      } else if (t.type === 'transfer') {
        if (t.user._id.toString() === userId.toString()) {
          balance -= t.amount;
        } else {
          balance += t.amount;
        }
      }
    }
  });

  return { balance, transactions };
};
