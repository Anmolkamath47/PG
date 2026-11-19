import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Smartphone,
  Building,
  Sparkles,
  Download,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Modal } from '../../components/common/Modal.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Loader } from '../../components/common/Loader.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { useNotification } from '../../context/NotificationContext.jsx';
import api from '../../services/api.js';

export const PayRent = () => {
  const { toast } = useNotification();
  const [invoices, setInvoices] = useState([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [loading, setLoading] = useState(true);

  // Checkout Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('upi'); // 'upi', 'card', 'netbanking'
  const [upiId, setUpiId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rent/my-invoices');
      if (res.data.success) {
        setInvoices(res.data.invoices || []);
        setTotalOutstanding(res.data.totalOutstanding || 0);
      }
    } catch (err) {
      toast.error('Failed to load rent invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleInitiatePayment = async (inv) => {
    setSelectedInvoice(inv);
    setPaymentSuccessData(null);
    try {
      // Create session on server
      const res = await api.post('/payments/create-session', {
        invoiceId: inv._id,
      });
      if (res.data.success) {
        setSessionData(res.data);
        setIsPayModalOpen(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initialize payment session');
    }
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice || !sessionData) return;
    setProcessing(true);
    try {
      const res = await api.post('/payments/verify-process', {
        invoiceId: selectedInvoice._id,
        paymentId: sessionData.session?.paymentId,
        paymentMethod: selectedMethod,
        methodDetails: {
          vpa: upiId,
        },
        idempotencyKey: sessionData.idempotencyKey,
      });

      if (res.data.success) {
        // Fire celebration confetti!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        toast.success('Rent payment processed and verified successfully!');
        setPaymentSuccessData(res.data.payment);
        fetchInvoices();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <Loader message="Fetching rent invoices and dues..." />;
  }

  const pendingInvoices = invoices.filter((i) => i.status !== 'paid');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure Indian Payments Orchestration</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-brand-600" />
            <span>Pay Monthly PG Rent Online</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Zero convenience fees on UPI payments. Digital rent receipts generated with instant GST/PAN compliance for HRA claims.
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Total Outstanding Balance
          </span>
          <span className="text-2xl font-black text-slate-900">
            {formatCurrency(totalOutstanding)}
          </span>
        </div>
      </div>

      {/* Due Invoices List */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-slate-900 text-base">Pending Rent Invoices</h3>

        {pendingInvoices.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900">All Rent Cleared!</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You have no pending rent invoices. Your account is in good standing.
            </p>
          </div>
        ) : (
          pendingInvoices.map((inv) => (
            <div
              key={inv._id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-300 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-base">
                    Rent for {inv.billingMonth}
                  </span>
                  <Badge status={inv.status} />
                </div>
                <p className="text-xs text-slate-500">
                  Invoice Number: <strong className="font-mono text-slate-700">{inv.invoiceNumber}</strong> • Due: <strong>{formatDate(inv.dueDate)}</strong>
                </p>
                <div className="text-xs text-slate-600 flex items-center gap-4 pt-1">
                  <span>Base Rent: {formatCurrency(inv.baseRent)}</span>
                  {inv.electricityCharges > 0 && <span>Electricity: {formatCurrency(inv.electricityCharges)}</span>}
                  {inv.maintenanceCharges > 0 && <span>Maintenance: {formatCurrency(inv.maintenanceCharges)}</span>}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Amount Payable
                  </span>
                  <span className="text-2xl font-black text-rose-600">
                    {formatCurrency(inv.balanceDue)}
                  </span>
                </div>

                <button
                  onClick={() => handleInitiatePayment(inv)}
                  className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pay Now</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment Checkout Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Secure Rent Payment"
        subtitle={`Invoice ${selectedInvoice?.invoiceNumber} • ${selectedInvoice?.billingMonth}`}
      >
        {paymentSuccessData ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Payment Successful!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Transaction ID: <span className="font-mono font-bold text-slate-800">{paymentSuccessData.transactionId}</span>
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid</span>
                <span className="font-bold text-slate-900">{formatCurrency(paymentSuccessData.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Mode</span>
                <span className="font-bold text-slate-900 uppercase">{paymentSuccessData.paymentMethod?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Verification</span>
                <span className="font-bold text-emerald-700">Server Verified & Signed</span>
              </div>
            </div>

            <button
              onClick={() => setIsPayModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all"
            >
              Done & View Receipts
            </button>
          </div>
        ) : (
          <form onSubmit={handleProcessPayment} className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Rent Payable</span>
                <span className="text-2xl font-black text-slate-900">
                  {formatCurrency(sessionData?.invoice?.balanceDue)}
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Sandbox Test Mode
              </span>
            </div>

            {/* Payment Method Switcher */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-2">
                Select Indian Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('upi')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    selectedMethod === 'upi'
                      ? 'border-brand-500 bg-brand-50 text-brand-900 font-bold ring-2 ring-brand-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Smartphone className="w-5 h-5 mx-auto mb-1 text-brand-600" />
                  <span className="text-xs">UPI Intent / VPA</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('card')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    selectedMethod === 'card'
                      ? 'border-brand-500 bg-brand-50 text-brand-900 font-bold ring-2 ring-brand-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mx-auto mb-1 text-brand-600" />
                  <span className="text-xs">Debit/Credit Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('netbanking')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    selectedMethod === 'netbanking'
                      ? 'border-brand-500 bg-brand-50 text-brand-900 font-bold ring-2 ring-brand-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building className="w-5 h-5 mx-auto mb-1 text-brand-600" />
                  <span className="text-xs">Net Banking</span>
                </button>
              </div>
            </div>

            {/* UPI Option */}
            {selectedMethod === 'upi' && (
              <div className="space-y-2 p-3 bg-brand-50/50 rounded-2xl border border-brand-100">
                <label className="block text-xs font-semibold uppercase text-brand-900">
                  Enter UPI ID (Virtual Payment Address)
                </label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. yourname@okhdfcbank"
                  className="w-full bg-white border border-brand-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-[10px] text-slate-500">
                  Supports Google Pay, PhonePe, Paytm, BHIM, and Cred UPI.
                </p>
              </div>
            )}

            {/* Card Option */}
            {selectedMethod === 'card' && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600">
                <span>Secure domestic card payment via Visa / Mastercard / RuPay</span>
              </div>
            )}

            {/* NetBanking Option */}
            {selectedMethod === 'netbanking' && (
              <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <label className="block font-semibold text-slate-700">Select Bank</label>
                <select className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold">
                  <option>HDFC Bank</option>
                  <option>State Bank of India</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={processing}
              className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50 mt-2"
            >
              {processing ? 'Processing Payment with Provider...' : `Pay ${formatCurrency(sessionData?.invoice?.balanceDue)}`}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};
