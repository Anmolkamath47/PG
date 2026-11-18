import React, { useState, useEffect } from 'react';
import {
  History,
  Download,
  CreditCard,
  CheckCircle2,
  FileText,
  Printer,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Loader } from '../../components/common/Loader.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { formatCurrency, formatDateTime } from '../../utils/formatters.js';
import { useNotification } from '../../context/NotificationContext.jsx';
import api from '../../services/api.js';

export const PaymentHistory = () => {
  const { toast } = useNotification();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const res = await api.get('/payments/history');
        if (res.data.success) {
          setPayments(res.data.payments || []);
        }
      } catch (err) {
        toast.error('Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const handleViewReceipt = async (paymentId) => {
    try {
      const res = await api.get(`/payments/receipt/${paymentId}`);
      if (res.data.success) {
        setSelectedReceipt(res.data.receipt);
        setIsReceiptModalOpen(true);
      }
    } catch (err) {
      toast.error('Failed to generate receipt');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <Loader message="Loading transaction audit history..." />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-brand-600" />
            <span>Rent Payment Transactions & Receipts</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Official immutable receipts for HRA tax deductions and landlord rental proof.
          </p>
        </div>
      </div>

      {payments.length === 0 ? (
        <EmptyState
          title="No payment history yet"
          description="Your completed rent payments and receipts will appear here."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Payment #</th>
                  <th className="px-6 py-3.5">Transaction ID</th>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {p.paymentNumber}
                    </td>

                    <td className="px-6 py-4 font-mono text-slate-500 text-[11px]">
                      {p.transactionId}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {formatDateTime(p.createdAt)}
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-700 capitalize">
                      {p.paymentMethod?.replace('_', ' ')}
                    </td>

                    <td className="px-6 py-4 font-extrabold text-slate-900">
                      {formatCurrency(p.amount)}
                    </td>

                    <td className="px-6 py-4">
                      <Badge status={p.status} />
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleViewReceipt(p._id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] inline-flex items-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official Tax-Compliant Printable Rent Receipt Modal */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Official Rent Receipt"
        maxWidth="max-w-xl"
      >
        {selectedReceipt && (
          <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-5 text-slate-800" id="printable-receipt">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">PGmate E-Receipt</h3>
                <p className="text-xs text-slate-500 mt-0.5">Verified Indian Rent Payment</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 block font-bold">
                  {selectedReceipt.receiptNumber}
                </span>
                <span className="text-xs text-slate-600 font-medium">
                  Date: {formatDateTime(selectedReceipt.paymentDate)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold uppercase text-[10px]">
                  Received From (Tenant)
                </span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {selectedReceipt.tenant?.name}
                </p>
                <p className="text-slate-500">{selectedReceipt.tenant?.phone}</p>
                <p className="text-slate-500">{selectedReceipt.tenant?.email}</p>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold uppercase text-[10px]">
                  Paid To (Landlord / PG)
                </span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {selectedReceipt.owner?.name || 'Property Manager'}
                </p>
                <p className="text-slate-500">PGmate Verified Merchant</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-800 pb-2 border-b border-slate-200">
                <span>Description</span>
                <span>Amount (INR)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Monthly Accommodation Rent ({selectedReceipt.invoice?.billingMonth || 'Current'})</span>
                <span className="font-bold text-slate-900">{formatCurrency(selectedReceipt.amount)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-slate-900 text-base pt-2 border-t border-slate-200">
                <span>Total Amount Paid</span>
                <span className="text-emerald-600">{formatCurrency(selectedReceipt.amount)}</span>
              </div>
            </div>

            <div className="text-xs text-slate-500 space-y-1">
              <p>Transaction ID: <span className="font-mono font-bold text-slate-700">{selectedReceipt.transactionId}</span></p>
              <p>Payment Mode: <span className="font-bold text-slate-700 uppercase">{selectedReceipt.paymentMethod?.replace('_', ' ')}</span></p>
              <p>Status: <span className="font-bold text-emerald-600">Verified & Reconciled</span></p>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                This is a digitally generated e-receipt compliant with Indian IT Act provisions for HRA claims.
              </span>
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
