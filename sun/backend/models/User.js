const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true }, // Teacher-এর জন্য
    password: { type: String }, // Teacher ও Registered Student-এর জন্য
    role: { type: String, enum: ['teacher', 'student', 'admin'], required: true },

    roll: { type: String },
    phone: { type: String, unique: true, sparse: true }, // Student-এর জন্য

    // Teacher-এর ইউনিক এক্সেস কোড — স্টুডেন্ট এই কোড দিয়ে এই শিক্ষকের সাথে যুক্ত হবে
    accessCode: { type: String, unique: true, sparse: true },

    // Student যেসব শিক্ষকের এক্সেস কোড যোগ করেছে তাদের আইডি এখানে জমা থাকে
    connectedTeachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // পুরনো শিক্ষক-লেভেল কোড (legacy)

    // যেসব শিক্ষক এই স্টুডেন্টকে ব্যান করেছেন (ব্যান করা শিক্ষকের পরীক্ষা দিতে পারবে না)
    bannedByTeachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Student যেসব শ্রেণীর এক্সেস কোড যোগ করেছে
    connectedClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],

    // Student সর্বশেষ কখন নোটিফিকেশন পেজ দেখেছে (এর পরের মেসেজগুলো "নতুন")
    messagesSeenAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
