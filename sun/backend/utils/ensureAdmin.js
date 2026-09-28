// ================== utils/ensureAdmin.js ==================
// সার্ভার চালু হলে .env-এর ADMIN_EMAIL / ADMIN_PASSWORD থেকে অ্যাডমিন একাউন্ট নিজে থেকেই তৈরি/আপডেট হয়।
// কোনো স্ক্রিপ্ট চালাতে হয় না। .env-এর পাসওয়ার্ড বদলালে পরের রিস্টার্টে ডাটাবেসেও বদলে যায়।
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const getAdminEmail = () => String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();

const ensureAdmin = async () => {
  const email = getAdminEmail();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn('⚠️  ADMIN_EMAIL / ADMIN_PASSWORD সেট করা নেই, তাই অ্যাডমিন লগইন বন্ধ থাকবে');
    return;
  }
  try {
    const existing = await User.findOne({ email });
    if (!existing) {
      await User.create({ name: 'Admin', email, password: await bcrypt.hash(password, 10), role: 'admin' });
      console.log('✅ অ্যাডমিন একাউন্ট তৈরি হয়েছে:', email);
      return;
    }
    if (existing.role !== 'admin') {
      console.error('❌ এই ইমেইলে আগে থেকেই শিক্ষক/ছাত্রের একাউন্ট আছে, অ্যাডমিন বানানো যায়নি। অন্য ইমেইল দাও');
      return;
    }
    if (!(await bcrypt.compare(password, existing.password || ''))) {
      existing.password = await bcrypt.hash(password, 10);
      await existing.save();
      console.log('🔑 অ্যাডমিনের পাসওয়ার্ড .env অনুযায়ী আপডেট হয়েছে');
    }
  } catch (err) {
    console.error('অ্যাডমিন সেটআপে সমস্যা:', err.message);
  }
};

module.exports = { ensureAdmin, getAdminEmail };
