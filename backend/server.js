require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');
const spotifyRoutes = require('./routes/spotify');
// middleware
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const securityHeaders = require('./middleware/security');
const logger = require('./middleware/logger');
const productionErrorHandler = require('./middleware/errorHandler');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Parse FRONTEND_URL to handle multiple origins
const getFrontendUrls = () => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8000';
    return frontendUrl.split(',').map(url => url.trim());
};

const allowedOrigins = getFrontendUrls();

// Socket.io setup
const io = socketIO(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl requests, etc)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('CORS blocked'));
        }
    },
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Security headers
app.use(securityHeaders);

// Logging
app.use(logger);

// Rate limiting
app.use(generalLimiter);

// Database connection and server start encapsulated in an async startup function
async function start() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/heart-dating', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✓ MongoDB connected successfully');
    } catch (err) {
        console.error('✗ MongoDB connection error:', err.message);
        process.exit(1);
    }

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`
    ╔════════════════════════════════════════╗
    ║  💕 Heart Dating App - Backend         ║
    ║  Running on port ${PORT}                ║
    ║  Environment: ${process.env.NODE_ENV || 'development'}              ║
    ╚════════════════════════════════════════╝
    `);
    });
}

// Routes
// Routes
// Mount auth routes (rate limiting applied to login only)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/spotify', spotifyRoutes);

// Serve frontend statically in production if available (assumes root index.html)
if (process.env.NODE_ENV === 'production') {
    const frontendIndex = path.join(__dirname, '..', 'index.html');
    const frontendDir = path.join(__dirname, '..');
    if (fs.existsSync(frontendIndex)) {
        app.use(express.static(frontendDir));
        app.get('*', (req, res) => {
            res.sendFile(frontendIndex);
        });
    }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date() });
});

// Socket.io Connection Handling
io.on('connection', (socket) => {
    console.log('✓ New user connected:', socket.id);

    // User joins room for messages
    socket.on('join-chat', (userId) => {
        socket.join(`chat-${userId}`);
        console.log(`User ${userId} joined chat room`);
    });

    // Handle incoming messages
    socket.on('new-message', (data) => {
        const { from, to, text } = data;

        // Send to recipient
        io.to(`chat-${to}`).emit('receive-message', {
            from,
            text,
            timestamp: new Date().toISOString()
        });

        // Acknowledge sender
        socket.emit('message-sent', { success: true });
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
        const { from, to } = data;
        io.to(`chat-${to}`).emit('user-typing', { from });
    });

    socket.on('stopped-typing', (data) => {
        const { from, to } = data;
        io.to(`chat-${to}`).emit('user-stopped-typing', { from });
    });

    socket.on('disconnect', () => {
        console.log('✗ User disconnected:', socket.id);
    });
});

// Production-aware error handler
app.use(productionErrorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// If requested, start an in-memory MongoDB instance for testing
(async() => {
    if (process.env.FORCE_IN_MEMORY_DB === 'true') {
        try {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongod = await MongoMemoryServer.create();
            process.env.MONGODB_URI = mongod.getUri();
            global.__MONGOD = mongod; // keep reference
            console.log('Using in-memory MongoDB for tests:', process.env.MONGODB_URI);
        } catch (err) {
            console.error('Failed to start in-memory MongoDB:', err);
            process.exit(1);
        }
    }

    await start();
})();

module.exports = { app, io };