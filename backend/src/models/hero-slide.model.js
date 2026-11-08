import mongoose from 'mongoose';

// Imágenes de fondo del carrusel de la portada. El administrador elige cuáles
// se ven, en qué orden y su texto alternativo.
const heroSlideSchema = new mongoose.Schema({
  // Ruta de una imagen incluida (/images/...) o subida desde el panel (/api/service-images/:id).
  image: {
    type: String,
    required: true,
    trim: true
  },
  // Descripción para lectores de pantalla.
  alt: {
    type: String,
    trim: true,
    default: ''
  },
  position: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const HeroSlide = mongoose.model('HeroSlide', heroSlideSchema);
export default HeroSlide;
