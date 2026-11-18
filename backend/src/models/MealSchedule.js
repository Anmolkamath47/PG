import mongoose from 'mongoose';

const mealScheduleSchema = new mongoose.Schema({
  building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    required: true,
    unique: true,
  },
  breakfast: {
    startTime: { type: String, default: '07:30' },
    endTime: { type: String, default: '10:00' },
    isActive: { type: Boolean, default: true }
  },
  lunch: {
    startTime: { type: String, default: '12:30' },
    endTime: { type: String, default: '15:00' },
    isActive: { type: Boolean, default: true }
  },
  dinner: {
    startTime: { type: String, default: '19:30' },
    endTime: { type: String, default: '22:30' },
    isActive: { type: Boolean, default: true }
  }
}, {
  timestamps: true,
});

export const MealSchedule = mongoose.model('MealSchedule', mealScheduleSchema);
