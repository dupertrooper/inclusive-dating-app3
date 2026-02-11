// Production error handler middleware
const productionErrorHandler = (err, req, res, next) => {
    // Log error
    console.error('Error:', {
        message: err.message,
        status: err.status || 500,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Don't leak error details in production
    const status = err.status || 500;
    const isDevelopment = process.env.NODE_ENV === 'development';

    res.status(status).json({
        error: isDevelopment ? err.message : 'Internal server error',
        status: status,
        ...(isDevelopment && { stack: err.stack })
    });
};

module.exports = productionErrorHandler;