const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const VerificationCode = require('../models/VerificationCode');
const BannedUser = require('../models/BannedUser');
const nodemailer = require('nodemailer');

const router = express.Router();
const { authLimiter } = require('../middleware/rateLimiter');

// Email transporter configuration
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Generate JWT token
const generateToken = (id, email) => {
    return jwt.sign({ id, email },
        process.env.JWT_SECRET || 'your_jwt_secret_key', { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Generate verification code
const generateVerificationCode = () => {
    return Math.random().toString().substring(2, 8);
};

// Send verification email
const sendVerificationEmail = async(email, code) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'noreply@heart-dating.com',
            to: email,
            subject: 'Heart Dating App - Email Verification',
            html: `
                <h2>Verify Your Email Address</h2>
                <p>Your verification code is:</p>
                <h1 style="letter-spacing: 5px;">${code}</h1>
                <p>This code expires in 15 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        });
        return true;
    } catch (error) {
        console.error('Email send error:', error);
        return false;
    }
};

// @route POST /api/auth/register
// @desc Register new user
router.post('/register', async(req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Check if user is banned
        const isBanned = await BannedUser.findOne({ email: email.toLowerCase() });
        if (isBanned) {
            return res.status(403).json({ error: 'This email has been banned' });
        }

        // Create user (mark as verified - email verification disabled for now)
        const user = new User({ email: email.toLowerCase(), password, isVerified: true });
        await user.save();

        // Generate token
        const token = generateToken(user._id, user.email);

        res.json({
            success: true,
            message: 'User registered. Verification code sent to email.',
            token,
            userId: user._id,
            email: user.email,
            isVerified: user.isVerified,
            profileComplete: false
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: error.message });
    }
});

// @route POST /api/auth/login
// @desc Login user
router.post('/login', authLimiter, async(req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if banned
        if (user.isBanned) {
            return res.status(403).json({ error: 'This account has been banned' });
        }

        // Check password
        const isPasswordValid = await user.matchPassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user._id, user.email);

        // Update last IP
        user.lastIP = req.ip || req.connection.remoteAddress;
        await user.save();

        res.json({
            success: true,
            message: 'Logged in successfully',
            token,
            userId: user._id,
            isVerified: user.isVerified,
            profileComplete: user.fullName && user.age && user.gender && user.orientation && user.location,
            email: user.email,
            isVerified: user.isVerified
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Middleware to protect verify-email
const { protect } = require('../middleware/auth');

// @route POST /api/auth/verify-email
// @desc Verify email with code
router.post('/verify-email', protect, async(req, res) => {
    try {
        const { code } = req.body;
        const email = req.email; // Get from JWT

        if (!code) {
            return res.status(400).json({ error: 'Verification code required' });
        }

        // Find verification code
        const verCode = await VerificationCode.findOne({
            email: email.toLowerCase(),
            code,
            isUsed: false
        });

        if (!verCode) {
            return res.status(400).json({ error: 'Invalid or expired code' });
        }

        // Update user
        const user = await User.findOneAndUpdate({ email: email.toLowerCase() }, { isVerified: true }, { new: true });

        // Mark code as used
        verCode.isUsed = true;
        await verCode.save();

        res.json({
            success: true,
            message: 'Email verified successfully',
            isVerified: true,
            user: {
                id: user._id,
                email: user.email,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({ error: error.message });
    }
});

// @route POST /api/auth/request-code
// @desc Request new verification code
router.post('/request-code', protect, async(req, res) => {
    try {
        const email = req.email; // Get from JWT

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate new code
        const code = generateVerificationCode();
        const verificationCode = new VerificationCode({
            email: email.toLowerCase(),
            code
        });
        await verificationCode.save();

        // Send email
        await sendVerificationEmail(email.toLowerCase(), code);

        res.json({
            success: true,
            message: 'New verification code sent to email'
        });
    } catch (error) {
        console.error('Request code error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;