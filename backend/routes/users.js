const express = require('express');
const User = require('../models/User');
const Like = require('../models/Like');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route GET /api/users/profile
// @desc Get user profile
router.get('/profile', protect, async(req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @route PUT /api/users/profile
// @desc Update user profile
router.put('/profile', protect, async(req, res) => {
    try {
        const { fullName, bio, age, gender, orientations, location, lookingFor } = req.body;

        const user = await User.findByIdAndUpdate(
            req.userId, {
                fullName,
                bio,
                age,
                gender,
                orientation: orientations ? orientations.join(', ') : '',
                location,
                lookingFor: lookingFor ? lookingFor.join(', ') : '',
                updatedAt: new Date()
            }, { new: true }
        ).select('-password');

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @route POST /api/users/photos
// @desc Add profile photo
router.post('/photos', protect, async(req, res) => {
    try {
        const { photo } = req.body; // Base64 encoded photo

        if (!photo) {
            return res.status(400).json({ error: 'Photo required' });
        }

        const user = await User.findById(req.userId);

        if (user.profilePhotos.length >= 7) {
            return res.status(400).json({ error: 'Maximum 7 photos allowed' });
        }

        user.profilePhotos.push({
            url: photo,
            uploadedAt: new Date()
        });

        await user.save();

        res.json({ success: true, photos: user.profilePhotos });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @route DELETE /api/users/photos/:photoIndex
// @desc Delete profile photo
router.delete('/photos/:photoIndex', protect, async(req, res) => {
    try {
        const { photoIndex } = req.params;
        const user = await User.findById(req.userId);

        if (photoIndex >= user.profilePhotos.length) {
            return res.status(400).json({ error: 'Photo not found' });
        }

        user.profilePhotos.splice(photoIndex, 1);
        await user.save();

        res.json({ success: true, photos: user.profilePhotos });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @route GET /api/users/discover
// @desc Get profiles to discover (exclude current user, liked, and matched)
router.get('/discover', protect, async(req, res) => {
    try {
        const user = await User.findById(req.userId);

        // Get liked user IDs
        const likedUsers = await Like.find({ from: req.userId });
        const likedIds = likedUsers.map(l => l.to);

        // Get matched user IDs
        const matchedIds = user.matches.map(m => m.userId);

        // Combined exclude list
        const excludeIds = [req.userId, ...likedIds, ...matchedIds];

        // Find profiles
        const profiles = await User.find({
                _id: { $nin: excludeIds },
                isBanned: false,
                isVerified: true
            })
            .select('-password -lastIP')
            .limit(50);

        res.json({ success: true, profiles });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @route POST /api/users/like/:toUserId
// @desc Like a user
router.post('/like/:toUserId', protect, async(req, res) => {
    try {
        const { toUserId } = req.params;

        // Check if already liked
        const existingLike = await Like.findOne({
            from: req.userId,
            to: toUserId
        });

        if (existingLike) {
            return res.status(400).json({ error: 'Already liked this user' });
        }

        // Create like
        const like = new Like({
            from: req.userId,
            to: toUserId
        });
        await like.save();

        // Check if mutual like (match)
        const mutualLike = await Like.findOne({
            from: toUserId,
            to: req.userId
        });

        if (mutualLike) {
            // Create match
            const currentUser = await User.findById(req.userId);
            const likedUser = await User.findById(toUserId);

            currentUser.matches.push({ userId: toUserId });
            likedUser.matches.push({ userId: req.userId });

            await currentUser.save();
            await likedUser.save();

            return res.json({
                success: true,
                message: 'It\'s a match!',
                isMatch: true
            });
        }

        res.json({ success: true, message: 'Liked user', isMatch: false });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @route POST /api/users/pass/:toUserId
// @desc Pass on a user
router.post('/pass/:toUserId', protect, async(req, res) => {
    try {
        // Just move on, no like created
        res.json({ success: true, message: 'Passed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @route GET /api/users/matches
// @desc Get user's matches
router.get('/matches', protect, async(req, res) => {
    try {
        const user = await User.findById(req.userId).populate('matches.userId', '-password -lastIP');
        res.json({ success: true, matches: user.matches });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @route GET /api/users/:userId
// @desc Get user by ID
router.get('/:userId', protect, async(req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password -lastIP');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;