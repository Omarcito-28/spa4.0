import mongoose from 'mongoose';

// Nota interna del equipo sobre un cliente (alergias, tinte usado, preferencias).
// El cliente no la ve.
const clientNoteSchema = new mongoose.Schema({
  client: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  author: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  authorName: {
    type: String,
    trim: true,
    default: ''
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: true
});

clientNoteSchema.index({ client: 1, createdAt: -1 });

const ClientNote = mongoose.model('ClientNote', clientNoteSchema);
export default ClientNote;
