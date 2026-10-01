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

    // ---------- ওয়েবসাইট কাস্টমাইজ (অ্যাডমিন প্যানেল → ওয়েবসাইট কাস্টমাইজ) ----------
    // লোগো ডাটাবেসেই থাকে (হোস্টিং রিস্টার্ট হলেও হারায় না); select:false — সাধারণ কোয়েরিতে আসে না
    logo: {
      data: { type: Buffer, select: false },
      contentType: { type: String, default: '' },
      updatedAt: { type: Date },
    },

    // যেকোনো লেখা বদলানো: key = ফ্রন্টএন্ডের অনুবাদ key, bn/en = নতুন লেখা (ফাঁকা = ডিফল্ট)
    textOverrides: [
      {
        _id: false,
        key: { type: String, required: true },
        bn: { type: String, default: '' },
        en: { type: String, default: '' },
      },
    ],

    // ফুটারের "Important Links" — প্রতিটা লিংক নিজস্ব পেজ (/page/:slug) অথবা বাইরের লিংক
    footerLinks: {
      type: [
        {
          _id: false,
          slug: { type: String, required: true },
          titleBn: { type: String, default: '' },
          titleEn: { type: String, default: '' },
          contentBn: { type: String, default: '' },
          contentEn: { type: String, default: '' },
          externalUrl: { type: String, default: '' },
          enabled: { type: Boolean, default: true },
        },
      ],
      default: () => [
        { slug: 'terms', titleBn: 'শর্তাবলী', titleEn: 'Terms and Conditions', enabled: true },
        { slug: 'privacy', titleBn: 'গোপনীয়তা নীতি', titleEn: 'Privacy Policy', enabled: true },
        { slug: 'refund', titleBn: 'রিটার্ন ও রিফান্ড নীতি', titleEn: 'Return and Refund Policy', enabled: true },
      ],
    },

    helplineNote: { type: String, default: '' }, // যেমন: "সকাল ১০টা – রাত ৯টা"
    chatEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
