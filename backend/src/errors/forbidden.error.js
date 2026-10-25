import AppError from './app.error.js';

export default class ForbiddenError extends AppError {
  constructor(message, options) {
    super(message, 403, options);
  }
}
