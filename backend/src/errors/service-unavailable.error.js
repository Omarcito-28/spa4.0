import AppError from './app.error.js';

export default class ServiceUnavailableError extends AppError {
  constructor(message, options) {
    super(message, 503, options);
  }
}
