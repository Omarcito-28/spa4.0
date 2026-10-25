import AppError from './app.error.js';

export default class UnauthorizedError extends AppError {
  constructor(message, options) {
    super(message, 401, options);
  }
}
