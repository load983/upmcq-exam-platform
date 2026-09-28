// ================== models/PromoCode.js ==================
// অ্যাডমিনের তৈরি প্রোমো কোড: কোড + ছাড়ের শতাংশ (সব প্ল্যানে প্রযোজ্য)
const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    isActive: { type: Boolean, default: true },
    maxUses: { type: Number, default: 0, min: 0 }, // 0 = সীমাহীন
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PromoCode', promoCodeSchema);
