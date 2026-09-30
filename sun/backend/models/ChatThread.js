// ================== models/ChatThread.js ==================
// একজন ইউজার (শিক্ষক/স্টুডেন্ট/গেস্ট) ও অ্যাডমিনের মধ্যে একটি চ্যাট কথোপকথন।
const mongoose = require('mongoose');

const chatThreadSchema = new mongoose.Schema(
  {
    // লগইন করা ইউজারের ক্ষেত্রে owner, গেস্টের ক্ষেত্রে visitorId (ব্রাউজারে জমা থাকা র‍্যান্ডম আইডি)
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
    visitorId: { type: String, unique: true, sparse: true },

    name: { type: String, default: '' },
    role: { type: String, enum: ['teacher', 'student', 'guest'], default: 'guest' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },

    lastMessageAt: { type: Date, default: Date.now },
    lastMessagePreview: { type: String, default: '' },
    unreadByAdmin: { type: Number, default: 0 },
    unreadByUser: { type: Number, default: 0 },
  },
  { timestamps: true }
);

chatThreadSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('ChatThread', chatThreadSchema);
