const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true }, // Teacher-এর জন্য
    password: { type: String }, // Teacher ও Registered Student-এর জন্য
    role: { type: String, enum: ['teacher', 'student'], required: true },

    roll: { type: String },
    phone: { type: String, unique: true, sparse: true }, // Student-এর জন্য
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
