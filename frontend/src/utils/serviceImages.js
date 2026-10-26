// Imágenes incluidas en /public; siempre se ofrecen en la galería.
export const BUILT_IN_IMAGES = [
  '/images/services/corte_dama.jpg',
  '/images/services/tintura.webp',
  '/images/services/tratamiento_capilar.webp',
  '/images/services/manicura_clasica.jpg',
  '/images/services/pedicure.jpg',
  '/images/services/peinado_evento.jpg',
  '/images/services/masaje.jpg',
];

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_BYTES = 5 * 1024 * 1024;
const MAX_SIDE = 1600;

// Reduce fotos grandes (por ejemplo de un celular) antes de subirlas.
// Si el navegador no puede procesarla, se sube el archivo original.
export async function shrinkImage(file) {
  if (typeof createImageBitmap !== 'function') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= 1.5 * 1024 * 1024) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.85));
    if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.webp', { type: 'image/webp' });
  } catch {
    return file;
  }
}
