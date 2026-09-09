// ================== server.js ==================
// এটাই ব্যাকএন্ডের মূল এন্ট্রি পয়েন্ট। এখানে Express app সেটআপ, DB কানেকশন
// এবং সব রাউট মাউন্ট করা হয়েছে।

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');
const attemptRoutes = require('./routes/attemptRoutes');

const app = express();

// আপলোড ফোল্ডার না থাকলে বানিয়ে নাও
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ডাটাবেসের সাথে কানেক্ট হও
connectDB();

// মিডলওয়্যার
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' })); // JSON বডি পার্স করার জন্য
app.use(express.urlencoded({ extended: true }));

// আপলোড করা ফাইল (PDF) স্ট্যাটিকভাবে সার্ভ করার জন্য (প্রয়োজনে)
app.use('/uploads', express.static(uploadDir));

// রাউট গুলো মাউন্ট করা হলো
app.use('/api/auth', authRoutes);       // লগইন/রেজিস্ট্রেশন (Teacher & Student)
app.use('/api/exams', examRoutes);      // পরীক্ষা তৈরি, PDF আপলোড, সেটিংস, রেজাল্ট
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
