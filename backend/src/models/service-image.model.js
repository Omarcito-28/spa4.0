import mongoose from 'mongoose';

// Imágenes subidas desde el panel. Se guardan en la base porque el disco del
// servidor en Render es efímero y se borra en cada despliegue.
const serviceImageSchema = new mongoose.Schema({
  data: {
    type: Buffer,
    required: true
  },
  contentType: {
    type: String,
    required: true,
    enum: ['image/jpeg', 'image/png', 'image/webp']
  },
  size: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

const ServiceImage = mongoose.model('ServiceImage', serviceImageSchema);
export default ServiceImage;
