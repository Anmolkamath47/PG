import mongoose from 'mongoose';

const mealItemSchema = new mongoose.Schema({
  items: { type: String, required: true },
  description: { type: String, default: '' },
  timing: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  isSpecial: { type: Boolean, default: false }
}, { _id: false });

const menuSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    required: true,
  },
  dayOfWeek: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true,
  },
  breakfast: {
    type: mealItemSchema,
    default: () => ({ items: 'Idli, Sambar, Coconut Chutney, Tea/Coffee', timing: '07:30 - 09:30' }),
  },
  lunch: {
    type: mealItemSchema,
    default: () => ({ items: 'Steamed Rice, Dal Tadka, Seasonal Sabzi, Curd, Chapati', timing: '12:30 - 14:30' }),
  },
  dinner: {
    type: mealItemSchema,
    default: () => ({ items: 'Tawa Roti, Paneer Butter Masala, Jeera Rice, Salad', timing: '19:30 - 21:30' }),
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

menuSchema.index({ building: 1, dayOfWeek: 1 }, { unique: true });

export const Menu = mongoose.model('Menu', menuSchema);
