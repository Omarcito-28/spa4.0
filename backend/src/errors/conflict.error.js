import AppError from './app.error.js';

export default class ConflictError extends AppError {
  constructor(message, options) {
    super(message, 409, options);
  }
}
