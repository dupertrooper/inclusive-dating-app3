const morgan = require('morgan');

// Custom morgan format for logging
const morganFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms';

// Create logger middleware
const logger = morgan(morganFormat, {
    skip: (req, res) => {
        // Skip logging health checks
        return req.path === '/api/health';
    }
});

module.exports = logger;