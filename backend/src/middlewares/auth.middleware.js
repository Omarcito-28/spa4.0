import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../config.js';
import User from '../models/user.model.js';

export const authenticateToken = async (req, res, next) => {
  const [scheme, token] = req.headers.authorization?.split(' ') || [];
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }

  try {
    const user = await User.findById(decoded.id).select('username fullName email role isActive tokenVersion');
    if (!user) return res.status(401).json({ error: 'La cuenta asociada a la sesión no existe.' });
    if (user.isActive === false) return res.status(403).json({ error: 'La cuenta está desactivada.' });
    if ((decoded.tokenVersion || 0) !== user.tokenVersion) {
      return res.status(403).json({ error: 'La sesión expiró. Inicia sesión nuevamente.' });
    }
    req.user = {
      id: user._id.toString(),
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    };
    next();
  } catch (error) {
    console.error('Error al validar la sesión:', error.message);
    res.status(503).json({ error: 'No se pudo validar la sesión.' });
  }
};

export const requireRole = roles => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Acceso denegado. Permisos insuficientes.' });
  }
  next();
};
