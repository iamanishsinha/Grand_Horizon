import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import {
  CreditCard,
  Plus,
  Trash2,
  Filter,
  IndianRupee,
  CheckCircle2,
  Smartphone,
  Banknote,
  Building,
  Receipt
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState('');

  // Record Payment Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    invoice_id: '',
    amount: '',
    payment_method: 'upi',
    transaction_ref: '',
    notes: ''
  });

  const { hasRole } = useAuth();

  const fetchData = async () => {
    try {
      const [payRes, invRes] = await Promise.all([
        api.get('/payments', { params: { method: methodFilter } }),
        api.get('/invoices')
      ]);
      setPayments(payRes.data);
      // Filter invoices that still have an outstanding balance
      const due = invRes.data.filter((inv) => (inv.total_amount - inv.amount_paid) > 0.01);
      setUnpaidInvoices(due);
    } catch (err) {
      toast.error('Failed to load payments data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [methodFilter]);

  const openRecordModal = () => {
    const firstDue = unpaidInvoices[0];
    const defaultBalance = firstDue ? (firstDue.total_amount - firstDue.amount_paid).toFixed(2) : '';
    setFormData({
      invoice_id: firstDue?.id || '',
      amount: defaultBalance,
      payment_method: 'upi',
      transaction_ref: '',
      notes: ''
    });
    setModalOpen(true);
  };

  const handleInvoiceSelect = (invId) => {
    const selected = unpaidInvoices.find((i) => String(i.id) === String(invId));
    setFormData({
      ...formData,
      invoice_id: invId,
      amount: selected ? (selected.total_amount - selected.amount_paid).toFixed(2) : ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.invoice_id) {
      toast.error('Please select an invoice');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('Please enter a valid positive payment amount');
      return;
    }

    try {
      await api.post('/payments', formData);
      toast.success('Payment recorded successfully');
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record payment');
    }
  };

  const handleDelete = async (payment) => {
    if (!window.confirm(`Delete payment of ₹${payment.amount} for ${payment.invoice_number}?`)) return;
    try {
      await api.delete(`/payments/${payment.id}`);
      toast.success('Payment removed and balance updated');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete payment');
    }
  };

  const getMethodIcon = (m) => {
    switch (m) {
      case 'upi':
        return <Smartphone className="w-4 h-4 text-purple-600" />;
      case 'cash':
        return <Banknote className="w-4 h-4 text-emerald-600" />;
      case 'card':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'bank_transfer':
        return <Building className="w-4 h-4 text-slate-600" />;
      default:
        return <CreditCard className="w-4 h-4 text-gold-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif-heading text-2xl font-bold text-navy-900 tracking-tight">
            Payment & Transaction Ledger
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Collect and record multi-channel payments (Cash, UPI, Credit Card, NEFT/RTGS).
          </p>
        </div>

        <button
          onClick={openRecordModal}
          disabled={unpaidInvoices.length === 0}
          className="px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 self-start sm:self-auto disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4 text-gold-400" />
          <span>Record New Payment</span>
        </button>
      </div>

      {/* Filter and stats */}
      <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gold-600" />
          <span className="text-xs font-semibold text-slate-700">Payment Channel:</span>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-cream-50/50 focus:outline-none focus:ring-1 focus:ring-gold-500 font-medium"
          >
            <option value="">All Methods</option>
            <option value="upi">UPI (GPay, PhonePe, Paytm)</option>
            <option value="cash">Cash Counter</option>
            <option value="card">Credit / Debit Card</option>
            <option value="bank_transfer">Direct Bank Transfer</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          {payments.length} {payments.length === 1 ? 'Transaction' : 'Transactions'}
        </span>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-cream-100/70 border-b border-cream-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Receipt # / Date</th>
                <th className="py-3.5 px-4">Invoice Ref</th>
                <th className="py-3.5 px-4">Guest</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Transaction Ref</th>
                <th className="py-3.5 px-4">Amount Paid</th>
                <th className="py-3.5 px-4">Cashier</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-cream-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-navy-900">
                        #PAY-{String(p.id).padStart(4, '0')}
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.paid_at}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-semibold text-slate-800">
                        {p.invoice_number}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {p.guest_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700 capitalize">
                        {getMethodIcon(p.payment_method)}
                        <span>{p.payment_method.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {p.transaction_ref || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-navy-900 text-sm">
                      ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {p.recorded_by_name || 'System'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {hasRole('admin') && (
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete payment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No payment transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Guest Payment"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Outstanding Invoice *
            </label>
            <select
              required
              value={formData.invoice_id}
              onChange={(e) => handleInvoiceSelect(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 focus:outline-none bg-white font-medium"
            >
              <option value="">-- Choose Invoice to Settle --</option>
              {unpaidInvoices.map((inv) => {
                const bal = inv.total_amount - inv.amount_paid;
                return (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_number} • {inv.guest_name} (Balance Due: ₹{bal.toFixed(2)})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="Amount to collect"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 focus:outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Method *
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 focus:outline-none bg-white font-medium"
              >
                <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                <option value="cash">Cash Counter</option>
                <option value="card">Credit / Debit Card</option>
                <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Transaction Reference / UTR Number
            </label>
            <input
              type="text"
              value={formData.transaction_ref}
              onChange={(e) => setFormData({ ...formData, transaction_ref: e.target.value })}
              placeholder="e.g. UPI Ref 3829103982 / Card Auth #8839"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any remarks, receipt book ref, etc."
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-navy-900 text-white rounded-xl text-xs font-semibold hover:bg-navy-800 transition-colors shadow-sm"
            >
              Record Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
