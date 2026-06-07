import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { paymentsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, CreditCard, Wallet, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe with a test key
const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx'); // Public test key

interface Transaction {
  _id: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'transfer';
  status: 'Pending' | 'Completed' | 'Failed';
  description: string;
  createdAt: string;
  user: { _id: string; name: string };
  recipient?: { _id: string; name: string };
}

// Deposit Form Component (Stripe Elements)
const DepositForm = ({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // 1. Create PaymentIntent on the backend
      const { data } = await paymentsAPI.createDeposit(depositAmount);
      const { clientSecret, transactionId } = data;

      // 2. Confirm the payment on the frontend
      // (Using a mock confirmation if dummy keys are in use, but standard flow here)
      // We will skip actual stripe.confirmCardPayment for this demo to avoid real network 
      // blocks with the dummy secret key, and directly confirm the intent in our backend mock.
      
      const confirmRes = await paymentsAPI.confirmDeposit(transactionId, data.clientSecret.split('_secret')[0]);
      
      toast.success(`Successfully deposited $${depositAmount}`);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            type="number"
            min="1"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-8 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border"
            placeholder="0.00"
          />
        </div>
      </div>
      
      <div className="border border-gray-300 rounded-md p-3 bg-white">
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': { color: '#aab7c4' },
            },
            invalid: { color: '#9e2146' },
          },
        }}/>
      </div>

      <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm flex gap-2">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <p>This is a sandbox integration. Do not use real card details. Use Stripe test cards (e.g., 4242 4242...)</p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!stripe || loading} isLoading={loading}>
          Deposit Funds
        </Button>
      </div>
    </form>
  );
};


export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [activeModal, setActiveModal] = useState<'deposit' | 'withdraw' | 'transfer' | null>(null);

  // Form states
  const [amount, setAmount] = useState('');
  const [recipientId, setRecipientId] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await paymentsAPI.getTransactions();
      setBalance(response.data.balance);
      setTransactions(response.data.transactions);
    } catch (error) {
      toast.error('Failed to load transaction history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await paymentsAPI.withdrawFunds(parseFloat(amount));
      toast.success('Withdrawal successful');
      setActiveModal(null);
      setAmount('');
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Withdrawal failed');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await paymentsAPI.transferFunds(recipientId, parseFloat(amount));
      toast.success('Transfer successful');
      setActiveModal(null);
      setAmount('');
      setRecipientId('');
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Transfer failed');
    }
  };

  const getTransactionIcon = (type: string, isIncoming: boolean) => {
    if (type === 'deposit') return <ArrowDownLeft className="text-green-500" />;
    if (type === 'withdrawal') return <ArrowUpRight className="text-red-500" />;
    if (type === 'transfer') {
      return isIncoming ? <ArrowDownLeft className="text-green-500" /> : <ArrowUpRight className="text-red-500" />;
    }
    return <ArrowRightLeft className="text-gray-500" />;
  };

  return (
    <div className="space-y-6 animate-fade-in relative h-full flex flex-col">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet & Payments</h1>
          <p className="text-gray-600">Manage your funds, deposits, and transfers.</p>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl shadow-lg p-6 text-white flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <Wallet size={32} />
          </div>
          <div>
            <p className="text-primary-100 text-sm font-medium">Available Balance</p>
            <h2 className="text-4xl font-bold">${balance.toFixed(2)}</h2>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setActiveModal('deposit')} leftIcon={<ArrowDownLeft size={18} />}>
            Deposit
          </Button>
          <Button variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10" onClick={() => setActiveModal('withdraw')} leftIcon={<ArrowUpRight size={18} />}>
            Withdraw
          </Button>
          <Button variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10" onClick={() => setActiveModal('transfer')} leftIcon={<ArrowRightLeft size={18} />}>
            Transfer
          </Button>
        </div>
      </div>

      <Card className="flex-1">
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No transactions found.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {transactions.map((tx) => {
                const isIncoming = tx.type === 'deposit' || (tx.type === 'transfer' && tx.recipient?._id === user?.id);
                return (
                  <div key={tx._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${isIncoming ? 'bg-green-100' : 'bg-red-100'}`}>
                        {getTransactionIcon(tx.type, isIncoming)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                          {tx.type === 'transfer' && tx.recipient && (
                            <span className="text-gray-500 font-normal">
                              {isIncoming ? ` from ${tx.user?.name}` : ` to ${tx.recipient?.name}`}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${isIncoming ? 'text-green-600' : 'text-gray-900'}`}>
                        {isIncoming ? '+' : '-'}${tx.amount.toFixed(2)}
                      </p>
                      <Badge variant={tx.status === 'Completed' ? 'success' : tx.status === 'Pending' ? 'warning' : 'error'} size="sm">
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Deposit Modal */}
      {activeModal === 'deposit' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="text-primary-600" />
              <h2 className="text-xl font-bold">Deposit Funds</h2>
            </div>
            <Elements stripe={stripePromise}>
              <DepositForm onSuccess={() => { setActiveModal(null); fetchTransactions(); }} onCancel={() => setActiveModal(null)} />
            </Elements>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {activeModal === 'withdraw' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Withdraw to Bank</h2>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number" min="1" step="0.01" required value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
                <Button type="submit">Withdraw</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {activeModal === 'transfer' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Transfer Funds</h2>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient User ID</label>
                <input
                  type="text" required value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  placeholder="Paste User ID here..."
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number" min="1" step="0.01" required value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
                <Button type="submit">Send Transfer</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
