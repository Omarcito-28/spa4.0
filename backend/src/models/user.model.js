import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    trim: true,
    default: ''
  },
  weeklySchedule: {
    type: [{
      day: { type: Number, min: 0, max: 6, required: true },
      enabled: { type: Boolean, default: false },
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' }
    }],
    default: []
  },
  role: {
    type: String,
    enum: ['ADMIN', 'CLIENT', 'STYLIST'],
    default: 'CLIENT'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  bookingLockVersion: {
    type: Number,
    default: 0,
    select: false
  },
  tokenVersion: {
    type: Number,
    default: 0
  },
  passwordResetTokenHash: {
    type: String,
    select: false
  },
  passwordResetExpiresAt: {
    type: Date,
    select: false
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
export default User;
