const express = require('express');
const User = require('../models/User');
const BannedUser = require('../models/BannedUser');
const AdminLog = require('../models/AdminLog');
const Message = require('../models/Message');
const Like = require('../models/Like');
const VerificationCode = require('../models/VerificationCode');
const { protectAdmin } = require('../middleware/auth');

const router = express.Router();

// @route POST /api/admin/ban/:userId
// @desc Ban a user
router.post('/ban/:userId', protectAdmin, async(req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;

        const user = await User.findByIdAndUpdate(
            userId, { isBanned: true, bannedReason: reason }, { new: true }
        );

        // Create ban record
        const bannedUser = new BannedUser({
            email: user.email,
            userId: user._id,
            reason,
            ips: [user.lastIP],
            bannedBy: req.userId,
            isPermanent: true
        });
        await bannedUser.save();

        // Log action
        const log = new AdminLog({
            adminId: req.userId,
            adminEmail: req.email,
            action: 'BAN_USER',
            targetUserId: userId,
            targetUserEmail: user.email,
            reason
        });
        await log.save();

        res.json({ success: true, message: 'User banned successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @route POST /api/admin/unban/:email
// @desc Unban a user
router.post('/unban/:email', protectAdmin, async(req, res) => {
    try {
        const { email } = req.params;

        const user = await User.findOneAndUpdate({ email: email.toLowerCase() }, { isBanned: false }, { new: true });

        await BannedUser.deleteOne({ email: email.toLowerCase() });

        // Log action
        const log = new AdminLog({
            adminId: req.userId,
            adminEmail: req.email,
            action: 'UNBAN_USER',
            targetUserEmail: email.toLowerCase()
        });
        await log.save();

        res.json({ success: true, message: 'User unbanned' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @route DELETE /api/admin/photos/:userId
// @desc Delete user's photos
router.delete('/photos/:userId', protectAdmin, async(req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndUpdate(
            userId, { profilePhotos: [] }, { new: true }
        );

        // Log action
        const log = new AdminLog({
            adminId: req.userId,
            adminEmail: req.email,
            action: 'DELETE_PHOTOS',
            targetUserId: userId,
            targetUserEmail: user.email
        });
        await log.save();

        res.json({ success: true, message: 'Photos deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @route GET /api/admin/users
// @desc Get all users (admin only)
router.get('/users', protectAdmin, async(req, res) => {
    try {
        const users = await User.find({}).select('-password').limit(100);
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @route GET /api/admin/banned
// @desc Get banned users list
router.get('/banned', protectAdmin, async(req, res) => {
    try {
        const bannedUsers = await BannedUser.find({}).sort({ bannedAt: -1 });
        res.json({ success: true, bannedUsers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @route GET /api/admin/logs
// @desc Get admin activity logs
router.get('/logs', protectAdmin, async(req, res) => {
    try {
        const logs = await AdminLog.find({}).sort({ createdAt: -1 }).limit(200);
        res.json({ success: true, logs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @route GET /api/admin/photos
// @desc Get all photos uploaded by all users
router.get('/photos', protectAdmin, async(req, res) => {
    try {
        const users = await User.find({ profilePhotos: { $exists: true, $ne: [] } }, { email: 1, fullName: 1, profilePhotos: 1, createdAt: 1 }).sort({ createdAt: -1 });

        const allPhotos = users.map(user => ({
            userId: user._id,
            email: user.email,
            fullName: user.fullName,
            photos: user.profilePhotos,
            userCreatedAt: user.createdAt
        }));

        res.json({ success: true, totalPhotos: allPhotos.length, photos: allPhotos });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @route GET /api/admin/photos/:userId
// @desc Get photos for a specific user
router.get('/photos/:userId', protectAdmin, async(req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select('email fullName profilePhotos createdAt');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            userId: user._id,
            email: user.email,
            fullName: user.fullName,
            photos: user.profilePhotos,
            userCreatedAt: user.createdAt
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @route DELETE /api/admin/users/:userId
// @desc Delete a user account and all associated data
router.delete('/users/:userId', protectAdmin, async(req, res) => {
    try {
        const { userId } = req.params;

        // Fetch user info before deletion
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userEmail = user.email;

        // Delete user account
        await User.findByIdAndDelete(userId);

        // Delete associated data
        await Message.deleteMany({ $or: [{ from: userId }, { to: userId }] });
        await Like.deleteMany({ $or: [{ from: userId }, { to: userId }] });
        await VerificationCode.deleteMany({ userId });
        await BannedUser.deleteOne({ userId });

        // Log action
        const log = new AdminLog({
            adminId: req.userId,
            adminEmail: req.email,
            action: 'DELETE_USER_ACCOUNT',
            targetUserId: userId,
            targetUserEmail: userEmail,
            reason: 'Admin deleted user account'
        });
        await log.save();

        res.json({
            success: true,
            message: `User account ${userEmail} and all associated data deleted permanently`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;