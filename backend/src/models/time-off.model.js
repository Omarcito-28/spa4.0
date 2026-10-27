import mongoose from 'mongoose';

// Fechas en que no se atiende: días libres o vacaciones de un estilista, o un
// cierre del spa completo (festivo, mantenimiento) cuando `stylist` está vacío.
const timeOffSchema = new mongoose.Schema({
  stylist: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  // "YYYY-MM-DD", ambos incluidos.
  start: {
    type: String,
    required: true
  },
  end: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    trim: true,
    maxlength: 120,
    default: ''
  },
  createdBy: {
    type: String,
    trim: true,
    lowercase: true,
    required: true
  }
}, {
  timestamps: true
});

timeOffSchema.index({ stylist: 1, start: 1, end: 1 });

const TimeOff = mongoose.model('TimeOff', timeOffSchema);
export default TimeOff;
