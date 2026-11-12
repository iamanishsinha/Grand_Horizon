import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import {
  Receipt,
  Printer,
  Edit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  MapPin,
  Calendar,
  Percent,
  IndianRupee,
  CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Printable Invoice Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Discount Modal
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountInvoice, setDiscountInvoice] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const { hasRole } = useAuth();

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices', { params: { status: statusFilter } });
      setInvoices(res.data);
    } catch (err) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const openInvoiceDetails = async (inv) => {
    setSelectedInvoice(inv);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/invoices/${inv.id}`);
      setInvoiceDetails(res.data);
    } catch (err) {
      toast.error('Failed to load invoice details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const openDiscountModal = (inv) => {
    setDiscountInvoice(inv);
    setDiscountAmount(inv.discount_amount || 0);
    setDiscountModalOpen(true);
  };

  const handleDiscountSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/invoices/${discountInvoice.id}`, { discount_amount: discountAmount });
      toast.success('Discount updated and taxes recalculated');
      setDiscountModalOpen(false);
      fetchInvoices();
      if (selectedInvoice?.id === discountInvoice.id) {
        openInvoiceDetails(discountInvoice);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update discount');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif-heading text-2xl font-bold text-navy-900 tracking-tight">
            Billing & Invoices Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Automated tax invoice generation, 18% GST calculation, discounts, and payment tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-medium focus:ring-1 focus:ring-gold-500 shadow-sm"
          >
            <option value="">All Invoices</option>
            <option value="pending">Pending Payment</option>
            <option value="partial">Partially Paid</option>
            <option value="paid">Fully Settled (Paid)</option>
          </select>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-cream-100/70 border-b border-cream-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Guest</th>
                <th className="py-3.5 px-4">Rooms</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Paid</th>
                <th className="py-3.5 px-4">Balance Due</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : invoices.length > 0 ? (
                invoices.map((inv) => {
                  const isPaid = inv.status === 'paid';
                  const isPartial = inv.status === 'partial';

                  return (
                    <tr key={inv.id} className="hover:bg-cream-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-navy-900">
                        {inv.invoice_number}
                        <p className="text-[10px] text-slate-400 font-sans font-normal">
                          {inv.created_at?.slice(0, 10)}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{inv.guest_name}</p>
                        <p className="text-[10px] font-mono text-slate-400">{inv.guest_phone}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-mono">
                        {inv.room_numbers ? `Room ${inv.room_numbers}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-navy-900">
                        ₹{Number(inv.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-600 font-semibold">
                        ₹{Number(inv.amount_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-rose-600">
                        ₹{Number(inv.balance_due).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isPartial
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openInvoiceDetails(inv)}
                            className="px-2.5 py-1 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="View & Print Official Invoice"
                          >
                            <Printer className="w-3.5 h-3.5 text-gold-400" />
                            <span>Invoice</span>
                          </button>
                          <button
                            onClick={() => openDiscountModal(inv)}
                            className="p-1.5 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Apply Discount"
                          >
                            <Percent className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No invoice records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Invoice Modal */}
      <Modal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={`Tax Invoice: ${selectedInvoice?.invoice_number}`}
        maxWidth="max-w-3xl"
      >
        {loadingDetails || !invoiceDetails ? (
          <div className="py-12 text-center">
            <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top action row */}
            <div className="flex items-center justify-between no-print border-b border-slate-100 pb-3">
              <span className="text-xs text-slate-500">Official Hotel Tax Invoice</span>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs rounded-xl shadow flex items-center gap-2 transition-all"
              >
                <Printer className="w-4 h-4 text-gold-400" />
                <span>Print Invoice</span>
              </button>
            </div>

            {/* Printable Document Box */}
            <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-800 print-shadow-none">
              {/* Hotel Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                  <h1 className="font-serif-heading text-2xl font-bold text-navy-900 tracking-wide">
                    {invoiceDetails.hotel.name}
                  </h1>
                  <p className="text-xs text-gold-600 font-semibold tracking-wider uppercase mt-0.5">
                    {invoiceDetails.hotel.tagline}
                  </p>
                  <p className="text-xs text-slate-500 mt-2 max-w-sm">
                    {invoiceDetails.hotel.address}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Phone: {invoiceDetails.hotel.phone} • Email: {invoiceDetails.hotel.email}
                  </p>
                  <p className="text-[11px] font-mono text-slate-600 mt-1">
                    GSTIN: {invoiceDetails.hotel.gstin}
                  </p>
                </div>

                <div className="sm:text-right">
                  <div className="inline-block px-3 py-1 bg-gold-100 text-gold-800 rounded-lg text-xs font-bold uppercase tracking-wider mb-2">
                    Tax Invoice
                  </div>
                  <p className="font-mono text-base font-extrabold text-navy-900">
                    {invoiceDetails.invoice_number}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Date: {invoiceDetails.created_at?.slice(0, 10)}
                  </p>
                  <p className="text-xs font-semibold text-slate-700 capitalize mt-1">
                    Payment Status: <span className="text-gold-600">{invoiceDetails.status}</span>
                  </p>
                </div>
              </div>

              {/* Guest & Stay Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1.5">
                    Billed To:
                  </p>
                  <p className="font-bold text-slate-900 text-sm">{invoiceDetails.guest_name}</p>
                  <p className="text-slate-600 font-mono mt-0.5">{invoiceDetails.guest_phone}</p>
                  {invoiceDetails.guest_email && (
                    <p className="text-slate-600 mt-0.5">{invoiceDetails.guest_email}</p>
                  )}
                  {invoiceDetails.guest_address && (
                    <p className="text-slate-500 mt-1">{invoiceDetails.guest_address}</p>
                  )}
                  {invoiceDetails.id_proof_number && (
                    <p className="text-[11px] text-slate-400 font-mono mt-1">
                      ID: {invoiceDetails.id_proof_type} - {invoiceDetails.id_proof_number}
                    </p>
                  )}
                </div>

                <div className="sm:text-right">
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1.5">
                    Stay Particulars:
                  </p>
                  <p className="text-slate-700">
                    Check-in: <strong>{invoiceDetails.check_in_date}</strong>
                  </p>
                  <p className="text-slate-700 mt-0.5">
                    Check-out: <strong>{invoiceDetails.check_out_date}</strong>
                  </p>
                  <p className="text-slate-700 mt-0.5 font-medium">
                    Duration: <strong>{invoiceDetails.nights} Night(s)</strong>
                  </p>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="py-6 border-b border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="pb-2">Description</th>
                      <th className="pb-2 text-center">Nights</th>
                      <th className="pb-2 text-right">Tariff / Night</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoiceDetails.rooms?.map((rm, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5">
                          <p className="font-semibold text-slate-900">Room {rm.room_number}</p>
                          <p className="text-[11px] text-slate-500">{rm.type_name} ({rm.floor})</p>
                        </td>
                        <td className="py-2.5 text-center text-slate-700">{invoiceDetails.nights}</td>
                        <td className="py-2.5 text-right font-mono text-slate-700">
                          ₹{rm.base_price?.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                          ₹{(rm.base_price * invoiceDetails.nights)?.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculations Total Row */}
              <div className="pt-6 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                {/* Bank / Remittance info */}
                <div className="p-3.5 bg-cream-50 rounded-xl border border-cream-200 text-[11px] space-y-1 text-slate-600 max-w-xs">
                  <p className="font-bold text-navy-900 uppercase tracking-wider text-[10px]">Settlement / NEFT Details:</p>
                  <p>Bank: <strong>State Bank of India (White Town Branch)</strong></p>
                  <p>A/C Name: <strong>Grand Horrizon Hospitality LLP</strong></p>
                  <p>A/C Number: <strong className="font-mono">384910398412</strong></p>
                  <p>IFSC Code: <strong className="font-mono">SBIN0001234</strong></p>
                  <p className="text-[10px] text-slate-400 pt-1">UPI ID: grandhorrizon@sbi</p>
                </div>

                <div className="w-80 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Room Charges (Subtotal):</span>
                    <span className="font-mono">₹{invoiceDetails.room_charges?.toFixed(2)}</span>
                  </div>
                  {invoiceDetails.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Special Discount:</span>
                      <span className="font-mono">-₹{invoiceDetails.discount_amount?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>CGST (9.0%):</span>
                    <span className="font-mono">₹{(invoiceDetails.tax_amount / 2)?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>SGST (9.0%):</span>
                    <span className="font-mono">₹{(invoiceDetails.tax_amount / 2)?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-semibold border-t border-slate-100 pt-1">
                    <span>Total Tax (18% GST):</span>
                    <span className="font-mono">₹{invoiceDetails.tax_amount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-sm text-navy-900">
                    <span>Total Net Amount:</span>
                    <span className="font-mono">₹{invoiceDetails.total_amount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                    <span>Total Paid:</span>
                    <span className="font-mono">₹{invoiceDetails.amount_paid?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-extrabold text-sm text-rose-600">
                    <span>Balance Outstanding:</span>
                    <span className="font-mono">₹{invoiceDetails.balance_due?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Records Section */}
              {invoiceDetails.payments?.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Payment Receipts
                  </p>
                  <div className="space-y-1.5 text-xs">
                    {invoiceDetails.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-2 bg-cream-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 uppercase text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200">
                            {p.payment_method}
                          </span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            Ref: {p.transaction_ref || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 text-[10px]">{p.paid_at}</span>
                          <span className="font-mono font-bold text-navy-900">
                            ₹{p.amount?.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoice Footer Sign-off */}
              <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
                <p className="font-medium text-slate-600">
                  Thank you for staying at Grand Horrizon!
                </p>
                <p className="text-[11px] mt-0.5">
                  This is a computer generated invoice managed by Grand Horrizon DBMS.
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Discount Modal */}
      <Modal
        isOpen={discountModalOpen}
        onClose={() => setDiscountModalOpen(false)}
        title={`Apply Discount: ${discountInvoice?.invoice_number}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleDiscountSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Flat Discount Amount (₹)
            </label>
            <input
              type="number"
              min="0"
              step="10"
              required
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Taxes (18% GST) and Total Amount will be recalculated automatically in SQLite.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDiscountModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-navy-900 text-white rounded-xl text-xs font-semibold hover:bg-navy-800 transition-colors shadow-sm"
            >
              Apply Discount
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
