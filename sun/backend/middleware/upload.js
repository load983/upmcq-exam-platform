// ================== middleware/upload.js ==================
// Multer কনফিগারেশন — ডিফল্টে শুধু PDF; পরীক্ষার প্রশ্নপত্রের জন্য PDF + Word (.docx/.doc)
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

// প্রশ্নপত্র আপলোডের জন্য: PDF অথবা Word (.docx / .doc)
const DOC_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const docFileFilter = (req, file, cb) => {
  const okExt = /\.(pdf|docx?)$/i.test(file.originalname || '');
  if (okExt && (DOC_MIMES.includes(file.mimetype) || file.mimetype === 'application/octet-stream')) cb(null, true);
  else cb(new Error('শুধুমাত্র PDF অথবা Word (.docx/.doc) ফাইল আপলোড করা যাবে'), false);
};

const limits = { fileSize: 15 * 1024 * 1024 };
const uploader = multer({ storage, fileFilter, limits });
uploader.examSource = multer({ storage, fileFilter: docFileFilter, limits });

// মেসেজের ছবি: শুধু JPG/PNG/WEBP/GIF, সর্বোচ্চ ৫ MB
const imageFileFilter = (req, file, cb) => {
  const okExt = /\.(jpe?g|png|webp|gif)$/i.test(file.originalname || '');
  if (okExt && /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
  else cb(new Error('শুধুমাত্র ছবি (JPG, PNG, WEBP, GIF) আপলোড করা যাবে'), false);
};
uploader.image = multer({ storage, fileFilter: imageFileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = uploader;
