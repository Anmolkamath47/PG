import mongoose from 'mongoose';

const rentInvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bedAllocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BedAllocation',
    required: true,
  },
  building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  billingMonth: {
    type: String, // Format: YYYY-MM
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  baseRent: {
    type: Number,
    required: true,
    min: 0,
  },
  electricityCharges: {
    type: Number,
    default: 0,
  },
  maintenanceCharges: {
    type: Number,
    default: 0,
  },
  otherCharges: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  amountPaid: {
    type: Number,
    default: 0,
  },
  balanceDue: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'partially_paid', 'paid', 'overdue', 'cancelled'],
    default: 'pending',
  },
  paidAt: {
    type: Date,
    default: null,
  },
  lastPaymentDate: {
    type: Date,
    default: null,
  },
  notes: {
    type: String,
    default: '',
  }
}, {
  timestamps: true,
});

// Prevent duplicate invoices for the same tenant and billing period
rentInvoiceSchema.index({ tenant: 1, billingMonth: 1 }, { unique: true });
rentInvoiceSchema.index({ owner: 1, status: 1 });
rentInvoiceSchema.index({ building: 1, billingMonth: 1 });

export const RentInvoice = mongoose.model('RentInvoice', rentInvoiceSchema);
