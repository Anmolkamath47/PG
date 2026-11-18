import mongoose from 'mongoose';

const auditEntrySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  status: { type: String, required: true },
  message: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  paymentNumber: {
    type: String,
    required: true,
    unique: true,
  },
  rentInvoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentInvoice',
    required: true,
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  paymentMethod: {
    type: String,
    enum: [
      'hyperswitch_upi',
      'hyperswitch_card',
      'hyperswitch_netbanking',
      'sandbox_upi',
      'sandbox_card',
      'manual_cash',
      'manual_bank_transfer',
      'manual_upi'
    ],
    required: true,
  },
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  providerOrderId: {
    type: String,
    default: null,
  },
  providerReference: {
    type: String,
    default: null,
  },
  idempotencyKey: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'refunded'],
    default: 'pending',
  },
  signatureVerified: {
    type: Boolean,
    default: false,
  },
  receiptUrl: {
    type: String,
    default: '',
  },
  failureReason: {
    type: String,
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  auditTrail: [auditEntrySchema],
}, {
  timestamps: true,
});

paymentSchema.index({ tenant: 1, createdAt: -1 });
paymentSchema.index({ owner: 1, createdAt: -1 });
paymentSchema.index({ rentInvoice: 1 });

export const Payment = mongoose.model('Payment', paymentSchema);
