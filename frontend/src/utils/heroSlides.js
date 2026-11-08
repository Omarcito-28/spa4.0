// Imágenes de la portada mientras el administrador no elija las suyas.
export const DEFAULT_HERO_SLIDES = [
  { image: '/images/services/corte_dama.jpg', alt: 'Corte de cabello para dama' },
  { image: '/images/services/tintura.webp', alt: 'Tintura de cabello' },
  { image: '/images/services/tratamiento_capilar.webp', alt: 'Tratamiento capilar' },
];

export const MAX_HERO_SLIDES = 10;

// Misma regla que el backend: solo imágenes del sitio (incluidas o subidas al panel).
const HERO_IMAGE_PATTERN = /^(\/api\/service-images\/[a-f0-9]{24}|\/images\/[a-z0-9_-]+(\/[a-z0-9_-]+)*\.(jpe?g|png|webp))$/i;

export const isHeroImage = src => HERO_IMAGE_PATTERN.test(src || '');
