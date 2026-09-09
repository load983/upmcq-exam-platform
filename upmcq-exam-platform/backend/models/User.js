// ================== models/User.js ==================
// Teacher এবং Student উভয়ের জন্য একই User মডেল ব্যবহার হচ্ছে, role দিয়ে আলাদা করা হয়েছে
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true }, // Teacher এর জন্য ইমেইল আবশ্যক
    password: { type: String }, // শুধু Teacher এর জন্য (bcrypt দিয়ে হ্যাশ করা)
    role: { type: String, enum: ['teacher', 'student'], required: true },

    // Student রা লগইন করে নাম/রোল/ফোন দিয়ে (আলাদা account না থাকলেও চলে)
    roll: { type: String },
    phone: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
