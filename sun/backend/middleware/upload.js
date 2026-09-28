// ================== middleware/upload.js ==================
// Multer কনফিগারেশন — শুধু PDF ফাইল আপলোড করতে দেয়া হবে
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('শুধুমাত্র PDF ফাইল আপলোড করা যাবে'), false);
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: 15 * 1024 * 1024 } });
