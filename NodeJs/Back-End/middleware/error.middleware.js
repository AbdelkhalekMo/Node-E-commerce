// Custom error class for API errors
export class APIError extends Error {
  constructor(message, statusCode, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

// Mongoose validation error handler
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(error => error.message);
  return new APIError('Validation Error', 400, errors);
};

// Mongoose duplicate key error handler
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new APIError(
    `Duplicate field value: ${field}. Please use another value.`,
    400
  );
};

// Mongoose cast error handler
const handleCastError = (err) => {
  return new APIError(`Invalid ${err.path}: ${err.value}`, 400);
};

// JWT error handler
const handleJWTError = () => {
  return new APIError('Invalid token. Please log in again.', 401);
};

// JWT expired error handler
const handleJWTExpiredError = () => {
  return new APIError('Your token has expired. Please log in again.', 401);
};

// Main error handling middleware
export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // Production error handling
  if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err.name === 'ValidationError') error = handleValidationError(err);
    if (err.code === 11000) error = handleDuplicateKeyError(err);
    if (err.name === 'CastError') error = handleCastError(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    // Handle operational errors
    if (error.isOperational) {
      return res.status(error.statusCode).json({
        status: error.status,
        message: error.message,
        errors: error.errors
      });
    }

    // Handle programming or unknown errors
    console.error('ERROR 💥', error);
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
};

// Catch async errors
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Not found handler
export const notFound = (req, res, next) => {
  const error = new APIError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};