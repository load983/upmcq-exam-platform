// ================== controllers/siteController.js ==================
// ওয়েবসাইট কাস্টমাইজ: লোগো, সাইটের নাম, যেকোনো লেখা বদল, ফুটারের "Important Links" পেজ।
// পাবলিক অংশ (config/logo/page) লগইন ছাড়াই; অ্যাডমিন অংশ adminRoutes-এর গার্ডের ভেতরে।
const multer = require('multer');
const SiteSettings = require('../models/SiteSettings');
const { getSettings } = require('../utils/siteSettings');

const MAX_OVERRIDES = 1500;
const MAX_TEXT_LEN = 2000;
const MAX_LINKS = 10;
const MAX_CONTENT_LEN = 20000;
const KEY_RE = /^[\w.\-]{1,100}$/;
const SLUG_RE = /^[a-z0-9-]{1,40}$/;

// ---------- হেল্পার ----------
const cleanHttpUrl = (v) => {
  const s = String(v || '').trim().slice(0, 300);
  if (!s) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(s) && !/^https?:\/\//i.test(s)) return null; // javascript: ইত্যাদি বাতিল
  return /^https?:\/\//i.test(s) ? s : `https://${s.replace(/^\/+/, '')}`;
};

const logoUrlOf = (s) => (s.logo?.contentType && s.logo?.updatedAt ? `/api/site/logo?v=${new Date(s.logo.updatedAt).getTime()}` : '');

const publicLink = (l) => ({
  slug: l.slug,
  titleBn: l.titleBn,
  titleEn: l.titleEn,
  externalUrl: l.externalUrl || '',
});

// ---------- পাবলিক ----------
exports.getPublicConfig = async (req, res) => {
  try {
    const s = await getSettings();
    res.json({
      logoUrl: logoUrlOf(s),
      textOverrides: (s.textOverrides || []).filter((o) => o.bn || o.en).map((o) => ({ key: o.key, bn: o.bn, en: o.en })),
      footerLinks: (s.footerLinks || []).filter((l) => l.enabled && (l.titleBn || l.titleEn)).map(publicLink),
    });
  } catch (err) {
    res.status(500).json({ message: 'তথ্য লোড করা যায়নি' });
  }
};

exports.getLogo = async (req, res) => {
  try {
    const s = await SiteSettings.findOne({ key: 'main' }).select('+logo.data logo.contentType logo.updatedAt');
    if (!s?.logo?.data || !s.logo.contentType) return res.status(404).end();
    res.set({
      'Content-Type': s.logo.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable', // URL-এ ?v= থাকায় বদলালে নতুন ক্যাশ
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'X-Content-Type-Options': 'nosniff',
    });
    res.send(s.logo.data);
  } catch (err) {
    res.status(500).end();
  }
};

exports.getPublicPage = async (req, res) => {
  try {
    const s = await getSettings();
    const l = (s.footerLinks || []).find((x) => x.slug === req.params.slug && x.enabled);
    if (!l || l.externalUrl) return res.status(404).json({ message: 'পেজটি পাওয়া যায়নি' });
    res.json({ slug: l.slug, titleBn: l.titleBn, titleEn: l.titleEn, contentBn: l.contentBn, contentEn: l.contentEn });
  } catch (err) {
    res.status(500).json({ message: 'পেজ লোড করা যায়নি' });
  }
};

// ---------- অ্যাডমিন ----------
exports.adminGet = async (req, res) => {
  try {
    const s = await getSettings();
    res.json({
      logoUrl: logoUrlOf(s),
      textOverrides: (s.textOverrides || []).map((o) => ({ key: o.key, bn: o.bn, en: o.en })),
      footerLinks: (s.footerLinks || []).map((l) => ({
        slug: l.slug, titleBn: l.titleBn, titleEn: l.titleEn, contentBn: l.contentBn, contentEn: l.contentEn,
        externalUrl: l.externalUrl || '', enabled: l.enabled !== false,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: 'সেটিংস লোড করা যায়নি' });
  }
};

// লোগো আপলোড: মেমরিতে নিয়ে সরাসরি ডাটাবেসে (PNG/JPG/WEBP/GIF, সর্বোচ্চ ১ MB; SVG নয় — স্ক্রিপ্ট ঝুঁকি)
exports.logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpeg|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('শুধুমাত্র ছবি (PNG, JPG, WEBP, GIF) আপলোড করা যাবে'), false);
  },
}).single('logo');

exports.adminUploadLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'লোগো ফাইল বাছাই করুন' });
    const s = await getSettings();
    s.logo = { data: req.file.buffer, contentType: req.file.mimetype, updatedAt: new Date() };
    await s.save();
    res.json({ message: 'লোগো আপডেট হয়েছে', logoUrl: logoUrlOf(s) });
  } catch (err) {
    res.status(500).json({ message: 'লোগো সেভ করা যায়নি' });
  }
};

exports.adminDeleteLogo = async (req, res) => {
  try {
    await SiteSettings.updateOne({ key: 'main' }, { $unset: { logo: '' } });
    res.json({ message: 'লোগো মুছে ডিফল্ট করা হয়েছে', logoUrl: '' });
  } catch (err) {
    res.status(500).json({ message: 'লোগো মোছা যায়নি' });
  }
};

exports.adminSaveTexts = async (req, res) => {
  try {
    const list = Array.isArray(req.body?.overrides) ? req.body.overrides : [];
    if (list.length > MAX_OVERRIDES) return res.status(400).json({ message: 'অনেক বেশি লেখা বদলানো হয়েছে' });
    const seen = new Set();
    const clean = [];
    for (const o of list) {
      const key = String(o?.key || '');
      if (!KEY_RE.test(key) || seen.has(key)) continue;
      const bn = String(o?.bn || '').trim().slice(0, MAX_TEXT_LEN);
      const en = String(o?.en || '').trim().slice(0, MAX_TEXT_LEN);
      if (!bn && !en) continue; // দুটোই ফাঁকা = ডিফল্টে ফেরত
      seen.add(key);
      clean.push({ key, bn, en });
    }
    const s = await getSettings();
    s.textOverrides = clean;
    await s.save();
    res.json({ message: 'লেখা সেভ হয়েছে', textOverrides: clean });
  } catch (err) {
    res.status(500).json({ message: 'সেভ করা যায়নি' });
  }
};

exports.adminSaveFooter = async (req, res) => {
  try {
    const list = Array.isArray(req.body?.footerLinks) ? req.body.footerLinks.slice(0, MAX_LINKS) : [];
    const seen = new Set();
    const clean = [];
    for (const l of list) {
      const slug = String(l?.slug || '').trim().toLowerCase();
      if (!SLUG_RE.test(slug)) return res.status(400).json({ message: 'পেজের স্লাগে শুধু ইংরেজি ছোট হাতের অক্ষর, সংখ্যা ও হাইফেন (-) দেওয়া যাবে' });
      if (seen.has(slug)) return res.status(400).json({ message: `স্লাগ "${slug}" একাধিকবার ব্যবহার হয়েছে` });
      seen.add(slug);
      const externalUrl = cleanHttpUrl(l?.externalUrl);
      if (externalUrl === null) return res.status(400).json({ message: 'বাইরের লিংক শুধু http/https হতে হবে' });
      clean.push({
        slug,
        titleBn: String(l?.titleBn || '').trim().slice(0, 80),
        titleEn: String(l?.titleEn || '').trim().slice(0, 80),
        contentBn: String(l?.contentBn || '').slice(0, MAX_CONTENT_LEN),
        contentEn: String(l?.contentEn || '').slice(0, MAX_CONTENT_LEN),
        externalUrl,
        enabled: l?.enabled !== false,
      });
    }
    const s = await getSettings();
    s.footerLinks = clean;
    await s.save();
    res.json({ message: 'ফুটার লিংক সেভ হয়েছে', footerLinks: clean });
  } catch (err) {
    res.status(500).json({ message: 'সেভ করা যায়নি' });
  }
};
