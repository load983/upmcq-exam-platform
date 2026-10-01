// ================== models/Announcement.js ==================
// শিক্ষকের পাঠানো মেসেজ (লেখা + ঐচ্ছিক ছবি) অথবা নতুন পরীক্ষা পাবলিশের অটোমেটিক নোটিফিকেশন।
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // যেসব শ্রেণীর স্টুডেন্টরা এটা দেখবে
    classRefs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
    kind: { type: String, enum: ['message', 'exam'], default: 'message' },
    text: { type: String, default: '', maxlength: 2000 },
    imagePath: { type: String }, // যেমন: /uploads/123-456.jpg
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' }, // kind = exam হলে
    editedAt: { type: Date },
  },
  { timestamps: true }
);

announcementSchema.index({ classRefs: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
