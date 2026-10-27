import mongoose from 'mongoose';

// Calificación que deja el cliente después de una cita completada (una por cita).
const reviewSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  // Nombre público abreviado ("Ana P."), para no exponer el nombre completo del cliente.
  authorName: {
    type: String,
    trim: true,
    default: ''
  },
  service: {
    type: String,
    required: true,
    trim: true
  },
  stylist: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  }
}, {
  timestamps: true
});

reviewSchema.index({ createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
