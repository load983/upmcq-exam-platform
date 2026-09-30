// ================== models/SiteSettings.js ==================
// সাইটের সিঙ্গেল সেটিংস ডকুমেন্ট — অ্যাডমিনের দেওয়া যোগাযোগ (হেল্পলাইন) তথ্য এখানে জমা থাকে।
const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },

    // নির্দিষ্ট কিছু যোগাযোগ মাধ্যম (ফাঁকা থাকলে ইউজারকে দেখানো হয় না)
    contacts: {
      phone: { type: String, default: '' },
      whatsapp: { type: String, default: '' },
      email: { type: String, default: '' },
      facebook: { type: String, default: '' },
      messenger: { type: String, default: '' },
      telegram: { type: String, default: '' },
      instagram: { type: String, default: '' },
      youtube: { type: String, default: '' },
      twitter: { type: String, default: '' },
      tiktok: { type: String, default: '' },
      website: { type: String, default: '' },
    },

    // অ্যাডমিনের নিজের ইচ্ছামতো যেকোনো লিংক/নাম্বার (যেমন: IMO, Viber, Line...)
    extras: [
      {
        _id: false,
        label: { type: String, default: '' },
        value: { type: String, default: '' },
      },
    ],

    // "Test Web": নতুন শিক্ষক একাউন্টের অটো ফ্রি ট্রায়াল সেটিং
    trial: {
      enabled: { type: Boolean, default: false },
      durationDays: { type: Number, default: 7, min: 1 },
      features: { type: [String], default: [] },
      examLimit: { type: Number, default: 0, min: 0 }, // ০ = সীমাহীন পরীক্ষা
    },

    helplineNote: { type: String, default: '' }, // যেমন: "সকাল ১০টা – রাত ৯টা"
    chatEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
