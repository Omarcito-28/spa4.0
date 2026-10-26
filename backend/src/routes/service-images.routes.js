import express, { Router } from 'express';
import { serviceImageController as images, authMiddleware as auth } from '../container.js';
import { ValidationError } from '../errors/index.js';

const router = Router();

// Acepta cualquier tipo declarado: el servicio valida el formato real por sus bytes.
const parseRawImage = express.raw({ type: () => true, limit: '5mb' });
const rawImage = (req, res, next) => parseRawImage(req, res, error => {
  if (error?.type === 'entity.too.large') return next(new ValidationError('La imagen no puede superar 5 MB.'));
  next(error);
});

router.get('/', auth.authenticate, auth.requireRole(['ADMIN']), images.handle('list'));
router.post('/', auth.authenticate, auth.requireRole(['ADMIN']), rawImage, images.handle('upload'));
router.get('/:id', images.handle('show'));

export default router;
