import mongoose from 'mongoose';

const bookingLockSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  version: { type: Number, default: 0 }
}, { versionKey: false });

export default mongoose.model('BookingLock', bookingLockSchema);
