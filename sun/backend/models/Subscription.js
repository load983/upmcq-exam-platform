// ================== models/Subscription.js ==================
// একটি ডকুমেন্ট = একটি কেনা/দেওয়া সাবস্ক্রিপশন + তার পেমেন্টের তথ্য।
// status: pending (পেমেন্ট যাচাই বাকি) | active | rejected | failed | cancelled | suspended
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
    // প্ল্যান পরে বদলালেও যেন পুরনো রেকর্ড ঠিক থাকে, তাই স্ন্যাপশট রাখা হচ্ছে
    planName: { type: String, required: true },
    durationDays: { type: Number, required: true },
    amount: { type: Number, required: true, default: 0 }, // শিক্ষক আসলে যত টাকা দিয়েছে (ছাড়ের পর)
    // প্রোমো কোড ব্যবহার করলে: কোড, ছাড়ের % ও আসল দাম
    promoCode: { type: String, index: true },
    discountPercent: { type: Number, default: 0 },
    originalAmount: { type: Number },
    // প্ল্যানের এক্সাম-সীমার স্ন্যাপশট (planName-এর মতোই — প্ল্যান পরে বদলালেও পুরনো সাবস্ক্রিপশন ঠিক থাকে)
    examLimitType: { type: String, enum: ['unlimited', 'limited'], default: 'unlimited' },
    examLimit: { type: Number, default: 0 },

    method: { type: String, enum: ['manual', 'gateway', 'admin'], required: true },
    provider: { type: String }, // bkash | nagad | rocket | sslcommerz | promo (১০০% ছাড়)
    senderNumber: { type: String },
    trxId: { type: String, index: true }, // ম্যানুয়াল পেমেন্টের ট্রানজেকশন আইডি
    tranId: { type: String, unique: true, sparse: true }, // গেটওয়ের নিজস্ব ট্রানজেকশন আইডি
    gatewayValId: { type: String },

    status: {
      type: String,
      enum: ['pending', 'active', 'rejected', 'failed', 'cancelled', 'suspended'],
      default: 'pending',
      index: true,
    },
    startsAt: { type: Date },
    expiresAt: { type: Date },
    suspendedAt: { type: Date },

    note: { type: String, default: '' },
    rejectReason: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
