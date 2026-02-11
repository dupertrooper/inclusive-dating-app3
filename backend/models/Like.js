const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isMatch: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Composite index to prevent duplicate likes
likeSchema.index({ from: 1, to: 1 }, { unique: true });

module.exports = mongoose.model('Like', likeSchema);