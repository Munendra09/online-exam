
/* ===== 404 Not Found ===== */
function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
}

/* ===== Global Error Handler ===== */
function errorHandler(err, req, res, next) {
  // Dev logging
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR] ${req.method} ${req.url}:`, err.message);
    if (err.stack) console.error(err.stack);
  }

  // Sequelize Validation Error
  if (
    err.name === 'SequelizeValidationError' ||
    err.name === 'SequelizeUniqueConstraintError'
  ) {
    const messages = err.errors?.map(e => e.message) || [err.message];

    return res.status(422).json({
      success: false,
      message: messages[0] || 'Validation error.',
      errors: messages,
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please login again.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Session expired. Please login again.',
    });
  }

  // Default Error
  const status = err.status || err.statusCode || 500;

  const message =
    status === 500
      ? 'Something went wrong on the server. Please try again.'
      : err.message || 'An error occurred.';

  res.status(status).json({
    success: false,
    message,
  });
}

/* ===== EXPORT ===== */
module.exports = {
  notFound,
  errorHandler,
};