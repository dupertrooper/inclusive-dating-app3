const mongoose = require('mongoose');

const bannedUserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reason: String,
    ips: [String],
    bannedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    bannedAt: {
        type: Date,
        default: Date.now
    },
    unbanAt: Date,
    isPermanent: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('BannedUser', bannedUserSchema);