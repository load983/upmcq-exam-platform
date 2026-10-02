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

    // এই প্ল্যানে শিক্ষক কতগুলো পরীক্ষা তৈরি/আপলোড করতে পারবে — 'unlimited' হলে আগের মতোই কোনো বাধা নেই
    examLimitType: { type: String, enum: ['unlimited', 'limited'], default: 'unlimited' },
    examLimit: { type: Number, default: 0, min: 0 }, // শুধু examLimitType='limited' হলে অর্থবহ
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plan', planSchema);
