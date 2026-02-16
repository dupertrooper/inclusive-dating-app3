// one-time script to clear all emails from User collection
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function main() {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to Mongo');
    const result = await User.updateMany({}, { $set: { email: '' } });
    console.log('Emails cleared:', result.modifiedCount);
    mongoose.disconnect();
}

main().catch(err => {
    console.error(err);
    mongoose.disconnect();
});