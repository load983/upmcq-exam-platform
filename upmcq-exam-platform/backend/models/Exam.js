// ================== models/Exam.js ==================
// একটি পরীক্ষার সব সেটিংস এবং মেটাডেটা এখানে থাকে
const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },

    // মূল PDF ফাইলের পাথ (স্টুডেন্ট শেষে এই PDF ডাউনলোড করতে পারবে)
    sourcePdfPath: { type: String },

    // Exam Settings (শিক্ষক যা On/Off করবে)
    settings: {
      totalTimeMinutes: { type: Number, default: 30 },
      marksPerQuestion: { type: Number, default: 1 },
      totalQuestionsToUse: { type: Number, default: 0 }, // 0 মানে সব প্রশ্ন
      negativeMarking: {
        enabled: { type: Boolean, default: false },
        marksPerWrong: { type: Number, default: 0.25 },
      },
      shuffleQuestions: { type: Boolean, default: false },
      shuffleOptions: { type: Boolean, default: false },
      showResultInstantly: { type: Boolean, default: true },
            allowRepetition: { type: Boolean, default: false }, // অন থাকলে একই স্টুডেন্ট বারবার পরীক্ষা দিতে পারবে
      schedule: {
        enabled: { type: Boolean, default: false },
        startAt: { type: Date },
        endAt: { type: Date },
      },
    },

    // শেয়ারযোগ্য লিংকের জন্য ইউনিক কোড + অতিরিক্ত এক্সেস কোড (ঐচ্ছিক পাসকোড)
    examCode: { type: String, required: true, unique: true },
    accessCode: { type: String },
// পরীক্ষা শেষে স্টুডেন্টকে দেখানোর জন্য অতিরিক্ত রিসোর্স (Google Drive লিংক অথবা PDF — যেকোনো একটা)
    resource: {
      kind: { type: String, enum: ['link', 'pdf', null], default: null },
      link: { type: String },
      pdfPath: { type: String },
      pdfOriginalName: { type: String },
    },
    status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Exam', examSchema);
