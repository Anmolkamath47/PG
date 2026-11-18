import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  emergencyContact: {
    name: String,
    relation: String,
    phone: String,
  },
  idProof: {
    type: {
      type: String,
      enum: ['aadhaar', 'pan', 'passport', 'voter_id', 'driving_license', 'college_id', 'other'],
      default: 'aadhaar'
    },
    number: String,
    documentUrl: String,
  },
  occupation: {
    type: String,
    enum: ['student', 'working_professional', 'job_seeker', 'other'],
    default: 'working_professional'
  },
  companyOrCollege: String,
  currentAllocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BedAllocation',
    default: null,
  },
  status: {
    type: String,
    enum: ['active', 'invited', 'checked_out', 'suspended'],
    default: 'active'
  }
}, {
  timestamps: true,
});

export const Tenant = mongoose.model('Tenant', tenantSchema);
