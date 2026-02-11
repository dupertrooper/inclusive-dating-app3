const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    fullName: String,
    age: Number,
    bio: String,
    gender: String,
    lookingFor: String,
    orientation: String,
    location: String,
    latitude: Number,
    longitude: Number,
    isVerified: {
        type: Boolean,
        default: false
    },
    profilePhotos: [{
        url: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    profileCompleteness: {
        type: Number,
        default: 0
    },
    likes: [{
        userId: mongoose.Schema.Types.ObjectId,
        likedAt: { type: Date, default: Date.now }
    }],
    matches: [{
        userId: mongoose.Schema.Types.ObjectId,
        matchedAt: { type: Date, default: Date.now }
    }],
    isBanned: {
        type: Boolean,
        default: false
    },
    bannedReason: String,
    lastIP: String,
    preferences: {
        ageMin: Number,
        ageMax: Number,
        distanceMax: Number,
        seekingFriends: Boolean,
        seekingDating: Boolean
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);