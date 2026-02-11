const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    adminEmail: String,
    action: {
        type: String,
        enum: ['BAN_USER', 'UNBAN_USER', 'DELETE_PHOTOS', 'DELETE_USER', 'VERIFY_USER', 'VIEW_REPORT'],
        required: true
    },
    targetUserId: mongoose.Schema.Types.ObjectId,
    targetUserEmail: String,
    details: mongoose.Schema.Types.Mixed,
    reason: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

adminLogSchema.index({ adminId: 1, createdAt: -1 });
adminLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AdminLog', adminLogSchema);