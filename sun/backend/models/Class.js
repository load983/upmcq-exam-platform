// ================== models/Class.js ==================
// শিক্ষকের তৈরি করা শ্রেণী (১-১২, Admission, BCS অথবা কাস্টম)। প্রতিটি শ্রেণীর নিজস্ব এক্সেস কোড আছে।
const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    kind: { type: String, enum: ['preset', 'custom'], default: 'preset' },
    accessCode: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

// একই শিক্ষকের দুটি শ্রেণীর নাম এক হতে পারবে না
classSchema.index({ teacher: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);
