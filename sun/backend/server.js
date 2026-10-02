// ================== server.js ==================
// এটাই ব্যাকএন্ডের মূল এন্ট্রি পয়েন্ট। এখানে Express app সেটআপ, DB কানেকশন
// এবং সব রাউট মাউন্ট করা হয়েছে।

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');
const attemptRoutes = require('./routes/attemptRoutes');
const classRoutes = require('./routes/classRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const supportRoutes = require('./routes/supportRoutes');
const siteRoutes = require('./routes/siteRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { ensureAdmin } = require('./utils/ensureAdmin');

const app = express();

// আপলোড ফোল্ডার না থাকলে বানিয়ে নাও
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ডাটাবেসের সাথে কানেক্ট হও
connectDB();

// একবারের মাইগ্রেশন: আগের একক classRef থাকলে সেটা classRefs অ্যারেতে নিয়ে যাওয়া (নিরাপদ — বারবার চললেও সমস্যা নেই)
mongoose.connection.once('open', async () => {
  try {
    await mongoose.connection.collection('exams').updateMany(
      { classRef: { $exists: true, $ne: null }, $or: [{ classRefs: { $exists: false } }, { classRefs: { $size: 0 } }] },
      [{ $set: { classRefs: ['$classRef'] } }, { $unset: 'classRef' }]
    );
  } catch (err) {
    console.error('classRef migration skipped:', err.message);
  }
});

// .env-এর ইমেইল/পাসওয়ার্ড দিয়ে একমাত্র অ্যাডমিন একাউন্ট নিজে থেকে তৈরি/সিঙ্ক হয়
mongoose.connection.once('open', ensureAdmin);

// CORS কনফিগারেশন (credentials: true থাকলে specific origin প্রয়োজন)
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://upmcq-exam-platform.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Postman বা Server-to-Server রিকোয়েস্টে origin না থাকলে allow করবে
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS Not Allowed'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' })); // JSON বডি পার্স করার জন্য
app.use(express.urlencoded({ extended: true }));

// আপলোড করা ফাইল (PDF) স্ট্যাটিকভাবে সার্ভ করার জন্য
app.use('/uploads', express.static(uploadDir));

// রাউট গুলো মাউন্ট করা হলো
app.use('/api/auth', authRoutes);       // লগইন/রেজিস্ট্রেশন (Teacher & Student)
app.use('/api/exams', examRoutes);      // পরীক্ষা তৈরি, PDF আপলোড, সেটিংস, রেজাল্ট
app.use('/api/classes', classRoutes);     // শিক্ষকের শ্রেণী ও প্রতি শ্রেণীর এক্সেস কোড
app.use('/api/subscription', subscriptionRoutes); // শিক্ষকের সাবস্ক্রিপশন, পেমেন্ট ও গেটওয়ে কলব্যাক
app.use('/api/admin', adminRoutes);      // অ্যাডমিন প্যানেল
app.use('/api/support', supportRoutes);  // হেল্পলাইন: যোগাযোগ তথ্য ও অ্যাডমিন চ্যাট
app.use('/api/site', siteRoutes);        // ওয়েবসাইট কাস্টমাইজ (লোগো, লেখা, ফুটার পেজ) — পাবলিক
app.use('/api/messages', messageRoutes); // শিক্ষকের মেসেজ/নোটিফিকেশন ও স্টুডেন্টের ডিভাইস পুশ
app.use('/api/attempts', attemptRoutes); // স্টুডেন্টের এক্সাম দেয়া, সাবমিট, রেজাল্ট

// হেলথ চেক
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// গ্লোবাল এরর হ্যান্ডলার
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'সার্ভারে একটি সমস্যা হয়েছে',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server চলছে পোর্ট ${PORT} এ`));
