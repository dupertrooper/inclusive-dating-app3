#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function main() {
    const confirm = process.argv.includes('--yes') || process.argv.includes('-y');
    if (!confirm) {
        console.log('This script will erase all user email addresses in the database.');
        console.log('To proceed, re-run with --yes (or -y).');
        process.exit(0);
    }

    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/heart-dating';
    console.log('Connecting to', uri);
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        const res = await User.updateMany({}, { $set: { email: '' } });
        console.log('Update result:', res);
        console.log('All user email fields have been cleared.');
    } catch (err) {
        console.error('Error clearing emails:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

main();
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