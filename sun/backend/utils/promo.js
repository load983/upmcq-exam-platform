// ================== utils/promo.js ==================
// প্রোমো কোড যাচাই ও ছাড়ের হিসাব — সবসময় সার্ভারে হয়, ক্লায়েন্টের পাঠানো দাম বিশ্বাস করা হয় না
const PromoCode = require('../models/PromoCode');
const Subscription = require('../models/Subscription');

const normalize = (code) => String(code || '').trim().toUpperCase();

// কতবার ব্যবহার হয়েছে (রিজেক্ট/ব্যর্থ/বাতিল বাদে — তাই সেগুলোর কোড আবার ব্যবহার করা যায়)
const usedCount = (code) =>
  Subscription.countDocuments({ promoCode: code, status: { $in: ['pending', 'active', 'suspended'] } });

// ফেরত: { error } অথবা { promo, percent, originalPrice, finalPrice }
const applyPromo = async (rawCode, plan) => {
  const code = normalize(rawCode);
  if (!code) return { error: 'প্রোমো কোড দাও' };
  const promo = await PromoCode.findOne({ code });
  if (!promo || !promo.isActive) return { error: 'প্রোমো কোডটি সঠিক নয় বা চালু নেই' };
  if (promo.maxUses > 0 && (await usedCount(code)) >= promo.maxUses) {
    return { error: 'এই প্রোমো কোডের ব্যবহারের সীমা শেষ হয়ে গেছে' };
  }
  const originalPrice = plan.price;
  const finalPrice = Math.max(0, Math.round(originalPrice * (100 - promo.discountPercent)) / 100);
  return { promo, percent: promo.discountPercent, originalPrice, finalPrice };
};

module.exports = { normalize, applyPromo, usedCount };
