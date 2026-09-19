import { ApiError } from './ApiError.js';

export class ValidationError extends ApiError {
  constructor(message = 'Validation failed', errors = []) {
    super(400, message, errors);
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required or token invalid') {
    super(401, message);
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'Forbidden: insufficient permissions') {
    super(403, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Resource conflict or duplicate operation') {
    super(409, message);
  }
}
