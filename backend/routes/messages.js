const express = require('express');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route GET /api/messages/:otherUserId
// @desc Get message history with another user
router.get('/:otherUserId', protect, async(req, res) => {
    try {
        const { otherUserId } = req.params;

        const messages = await Message.find({
                $or: [
                    { from: req.userId, to: otherUserId },
                    { from: otherUserId, to: req.userId }
                ]
            })
            .sort({ createdAt: 1 })
            .limit(100);

        // Mark messages as read
        await Message.updateMany({ from: otherUserId, to: req.userId, isRead: false }, { isRead: true, readAt: new Date() });

        res.json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @route POST /api/messages
// @desc Send message
router.post('/', protect, async(req, res) => {
    try {
        const { to, text } = req.body;

        if (!to || !text) {
            return res.status(400).json({ error: 'Recipient and text required' });
        }

        const message = new Message({
            from: req.userId,
            to,
            text,
            createdAt: new Date()
        });

        await message.save();

        res.json({ success: true, message });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @route GET /api/messages/conversations
// @desc Get all conversations (latest message with each user)
router.get('/conversations', protect, async(req, res) => {
    try {
        // Get unique users user has messaged
        const messages = await Message.aggregate([{
                $match: {
                    $or: [
                        { from: req.userId },
                        { to: req.userId }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$from', req.userId] },
                            '$to',
                            '$from'
                        ]
                    },
                    lastMessage: { $first: '$text' },
                    lastMessageTime: { $first: '$createdAt' },
                    unreadCount: {
                        $sum: {
                            $cond: [{
                                    $and: [
                                        { $eq: ['$to', req.userId] },
                                        { $eq: ['$isRead', false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $sort: { lastMessageTime: -1 }
            }
        ]);

        res.json({ success: true, conversations: messages });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;