// ================== utils/siteSettings.js ==================
// সিঙ্গেল SiteSettings ডকুমেন্ট পড়া (না থাকলে তৈরি করে)
const SiteSettings = require('../models/SiteSettings');

const getSettings = async () => {
  try {
    return await SiteSettings.findOneAndUpdate({ key: 'main' }, { $setOnInsert: { key: 'main' } }, { upsert: true, new: true });
  } catch (err) {
    // একসাথে দুটো রিকোয়েস্টে upsert রেস হলে আবার পড়ে নাও
    return SiteSettings.findOne({ key: 'main' });
  }
};

module.exports = { getSettings };
