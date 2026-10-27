import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  service: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    min: 15,
    max: 480,
    default: 60
  },
  price: {
    type: String,
    trim: true,
    default: ''
  },
  stylist: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['CONFIRMED', 'CANCELLED', 'PENDING', 'COMPLETED', 'NO_SHOW'],
    default: 'CONFIRMED'
  },
  // Momento en que se envió el recordatorio del día anterior; se borra al reprogramar.
  reminderSentAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
