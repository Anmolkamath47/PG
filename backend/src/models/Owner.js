import mongoose from 'mongoose';

const ownerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  businessName: {
    type: String,
    required: true,
    trim: true,
    default: 'My PG Group',
  },
  contactPhone: {
    type: String,
    trim: true,
  },
  alternatePhone: String,
  upiId: {
    type: String,
    trim: true,
  },
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
  },
  notificationSettings: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: true },
  }
}, {
  timestamps: true,
});

export const Owner = mongoose.model('Owner', ownerSchema);
