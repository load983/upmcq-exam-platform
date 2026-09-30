// ================== config/db.js ==================
// MongoDB এর সাথে কানেকশন তৈরি করার ফাংশন
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB কানেক্ট হয়েছে');

    // Attempt মডেলের ইনডেক্স সিঙ্ক করা হলো (পুরনো unique constraint স্বয়ংক্রিয়ভাবে সরানোর জন্য)
    const Attempt = require('../models/Attempt');
    await Attempt.syncIndexes();
  } catch (err) {
    console.error('❌ MongoDB কানেকশন ব্যর্থ:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
