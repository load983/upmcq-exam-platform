// ================== models/Attempt.js ==================
// প্রতিটি স্টুডেন্টের একটি পরীক্ষা দেয়ার রেকর্ড এখানে সেভ হয়
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    selectedOptionIndex: { type: Number, default: null }, // null = স্কিপ করেছে
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },

    // Student এর তথ্য (নাম/রোল/ফোন দিয়ে জয়েন করে, আলাদা account না থাকলেও চলবে)
    studentName: { type: String, required: true },
    studentRoll: { type: String, required: true },
    studentPhone: { type: String },
    ipAddress: { type: String },

    // প্রশ্নগুলোর ক্রম এই স্টুডেন্টের জন্য কীভাবে শাফল হয়েছে সেটা সেভ রাখা হয়
    questionOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    optionOrderMap: { type: mongoose.Schema.Types.Mixed }, // { questionId: [শাফলড ইনডেক্স ম্যাপিং] }

    answers: [answerSchema],

    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    autoSubmitted: { type: Boolean, default: false },

    // ফলাফল
    totalCorrect: { type: Number, default: 0 },
    totalWrong: { type: Number, default: 0 },
    totalSkipped: { type: Number, default: 0 },
    obtainedMarks: { type: Number, default: 0 },

    status: { type: String, enum: ['in-progress', 'submitted'], default: 'in-progress' },
  },
  { timestamps: true }
);

// রোল অনুযায়ী দ্রুত খোঁজার জন্য ইনডেক্স (ইউনিক না — Repetition অন থাকলে একই রোল একাধিকবার Attempt নিতে পারে)
attemptSchema.index({ exam: 1, studentRoll: 1 });

module.exports = mongoose.model('Attempt', attemptSchema);
