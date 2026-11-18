/**
 * Formatting utilities for Indian PG operations
 */

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'available':
    case 'paid':
    case 'resolved':
    case 'success':
    case 'active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'occupied':
    case 'overdue':
    case 'rejected':
    case 'failed':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'maintenance':
    case 'partially_paid':
    case 'in_progress':
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'inactive':
    case 'cancelled':
    case 'checked_out':
    case 'transferred':
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};
