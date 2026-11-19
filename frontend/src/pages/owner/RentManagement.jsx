import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  CreditCard,
  Plus,
  Send,
  DollarSign,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
  Building,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { Loader } from '../../components/common/Loader.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { useNotification } from '../../context/NotificationContext.jsx';
import api from '../../services/api.js';

export const RentManagement = () => {
  const { selectedBuildingId, buildings } = useOutletContext();
  const { toast } = useNotification();

  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7)); // 'YYYY-MM'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Manual payment modal state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [manualPayAmount, setManualPayAmount] = useState('');
  const [manualMethod, setManualMethod] = useState('manual_cash');
  const [manualNotes, setManualNotes] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  const fetchRentData = async () => {
    if (!selectedBuildingId) {
      setLoading(false);
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/rent/dashboard', {
        params: { buildingId: selectedBuildingId, month, search },
      });
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      toast.error('Failed to load rent dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentData();
  }, [selectedBuildingId, month]);

  const handleGenerateInvoices = async () => {
    try {
      const res = await api.post('/rent/generate-monthly', { month });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchRentData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate monthly invoices');
    }
  };

  const handleSendReminder = async (invoiceId) => {
    try {
      const res = await api.post(`/rent/remind/${invoiceId}`);
      if (res.data.success) {
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error('Failed to send reminder');
    }
  };

  const handleRecordManualPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setProcessingPayment(true);
    try {
      const res = await api.post('/rent/manual-payment', {
        invoiceId: selectedInvoice._id,
        amount: Number(manualPayAmount),
        paymentMethod: manualMethod,
        notes: manualNotes,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setIsManualModalOpen(false);
        fetchRentData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment recording failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const summary = data?.summary || {};
  const invoices = data?.invoices || [];

  if (loading) {
    return <Loader message="Calculating rent collections and ledger..." />;
  }

  if (!selectedBuildingId && (!buildings || buildings.length === 0)) {
    return (
      <EmptyState
        title="No PG Building Found"
        description="Please add your first PG building before monitoring rent collections and generating invoices."
        action={
          <Link
            to="/owner/buildings"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Building</span>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-brand-600" />
            <span>Monthly Rent Collections & Billing</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Automated monthly rent invoice generation, online payment verification, and manual cash recording.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <button
            onClick={handleGenerateInvoices}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-md shadow-brand-500/20"
          >
            <Calendar className="w-4 h-4" />
            <span>Auto-Generate Monthly Invoices</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Expected Rent"
          value={formatCurrency(summary.expectedRent || 0)}
          subtext={`Billing month: ${month}`}
          icon={CreditCard}
          iconBg="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Rent Collected"
          value={formatCurrency(summary.collectedRent || 0)}
          subtext={`${summary.collectionRate || 0}% collection rate`}
          trend={`${summary.collectionRate || 0}% collected`}
          trendPositive={summary.collectionRate >= 80}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Pending Rent"
          value={formatCurrency(summary.pendingRent || 0)}
          subtext={`${summary.totalActiveTenants || 0} active tenants`}
          trend={summary.overdueCount > 0 ? `${summary.overdueCount} overdue` : 'No overdue'}
          trendPositive={summary.overdueCount === 0}
          iconBg="bg-rose-50 text-rose-600"
        />
        <StatCard
          title="Active Tenants"
          value={summary.totalActiveTenants || 0}
          subtext="Under current building"
          iconBg="bg-brand-50 text-brand-600"
        />
      </div>

      {/* Invoices Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by resident name or invoice #..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Showing {invoices.length} invoices
          </p>
        </div>

        {loading ? (
          <Loader message="Loading rent invoices..." />
        ) : invoices.length === 0 ? (
          <EmptyState
            title="No rent invoices generated for this month"
            description="Click 'Auto-Generate Monthly Invoices' above to create invoices for all active resident bed allocations."
            action={
              <button
                onClick={handleGenerateInvoices}
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold"
              >
                Generate Invoices Now
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Resident</th>
                  <th className="px-6 py-3.5">Room & Bed</th>
                  <th className="px-6 py-3.5">Due Date</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Balance Due</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{inv.tenant?.name}</p>
                      <p className="text-[11px] text-slate-400">{inv.tenant?.phone}</p>
                    </td>

                    <td className="px-6 py-4 text-slate-600 font-medium">
                      Room {inv.bedAllocation?.room?.roomNumber || 'N/A'} ({inv.bedAllocation?.bed?.bedNumber || 'N/A'})
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(inv.dueDate)}
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-900">
                      {formatCurrency(inv.totalAmount)}
                    </td>

                    <td className="px-6 py-4 font-bold text-rose-600">
                      {formatCurrency(inv.balanceDue)}
                    </td>

                    <td className="px-6 py-4">
                      <Badge status={inv.status} />
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inv.status !== 'paid' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setManualPayAmount(inv.balanceDue);
                                setIsManualModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200 transition-colors"
                              title="Record offline cash/bank payment"
                            >
                              Record Payment
                            </button>

                            <button
                              onClick={() => handleSendReminder(inv._id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                              title="Send rent reminder"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {inv.status === 'paid' && (
                          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Paid</span>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Manual Payment Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Record Offline Rent Payment"
        subtitle={`Invoice ${selectedInvoice?.invoiceNumber} • ${selectedInvoice?.tenant?.name}`}
      >
        <form onSubmit={handleRecordManualPayment} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-400 block font-semibold uppercase">Total Balance Due</span>
              <span className="text-base font-bold text-rose-600">
                {formatCurrency(selectedInvoice?.balanceDue)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold uppercase">Resident</span>
              <span className="text-xs font-bold text-slate-800">
                {selectedInvoice?.tenant?.name}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Payment Amount Received (₹)
            </label>
            <input
              type="number"
              required
              max={selectedInvoice?.balanceDue}
              value={manualPayAmount}
              onChange={(e) => setManualPayAmount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Payment Mode
            </label>
            <select
              value={manualMethod}
              onChange={(e) => setManualMethod(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
            >
              <option value="manual_cash">Cash in Hand</option>
              <option value="manual_upi">Direct UPI Transfer (GPay / PhonePe / Paytm)</option>
              <option value="manual_bank_transfer">Direct Bank IMPS / NEFT</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Manager Note / Reference
            </label>
            <input
              type="text"
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              placeholder="e.g. Handed cash at reception desk"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={processingPayment}
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition-all mt-4 disabled:opacity-50"
          >
            {processingPayment ? 'Processing...' : 'Confirm & Generate Receipt'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
