// ================== models/Plan.js ==================
// অ্যাডমিনের তৈরি করা সাবস্ক্রিপশন প্ল্যান (নাম, দাম, মেয়াদ)
const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 }, // টাকায়
    durationDays: { type: Number, required: true, min: 1 },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true }, // false হলে শিক্ষকরা নতুন করে কিনতে পারবে না
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plan', planSchema);
