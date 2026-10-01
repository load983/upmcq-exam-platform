// ================== models/PushSubscription.js ==================
// স্টুডেন্টের ডিভাইস/ব্রাউজারের Web Push সাবস্ক্রিপশন (নোটিফিকেশন bar-এ পাঠানোর জন্য)
const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
