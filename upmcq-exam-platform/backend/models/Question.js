// ================== models/Question.js ==================
// প্রতিটি প্রশ্ন এই স্কিমা অনুযায়ী সেভ হবে। PDF পার্স করার পর এখানে বাল্ক ইনসার্ট হয়।
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    questionText: { type: String, required: true },
    options: {
      type: [String], // ['অপশন A টেক্সট', 'অপশন B টেক্সট', ...]
      required: true,
      validate: (v) => v.length >= 2,
    },
    correctOptionIndex: { type: Number, required: true }, // 0=A, 1=B, 2=C, 3=D
        explanation: { type: String }, // ঐচ্ছিক — কেন এই উত্তরটা সঠিক তার ব্যাখ্যা
    order: { type: Number, default: 0 }, // প্রশ্নের সিরিয়াল (Reorder এর জন্য)
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);
