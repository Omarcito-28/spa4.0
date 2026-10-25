import ConflictError from './conflict.error.js';

// Conflicto de agenda: el horario no está disponible para reservar.
export default class BookingError extends ConflictError {}
