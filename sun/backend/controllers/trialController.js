// ================== controllers/trialController.js ==================
// অ্যাডমিন প্যানেলের "Test Web": নতুন শিক্ষকের ফ্রি ট্রায়ালের মেয়াদ ও ফিচার নির্ধারণ
const Subscription = require('../models/Subscription');
const { getSettings } = require('../utils/siteSettings');
const { TEACHER_FEATURES, FEATURE_KEYS } = require('../utils/features');

const serialize = async (s) => {
  const now = new Date();
  const activeTrials = await Subscription.countDocuments({ isTrial: true, status: 'active', startsAt: { $lte: now }, expiresAt: { $gt: now } });
  const totalTrials = await Subscription.countDocuments({ isTrial: true });
  return {
    trial: {
      enabled: !!s.trial?.enabled,
      durationDays: s.trial?.durationDays || 7,
      features: (s.trial?.features || []).filter((k) => FEATURE_KEYS.includes(k)),
      examLimit: s.trial?.examLimit || 0,
    },
    catalog: TEACHER_FEATURES,
    activeTrials,
    totalTrials,
  };
};

exports.getTrialSettings = async (req, res) => {
  try {
    res.json(await serialize(await getSettings()));
  } catch (err) {
    res.status(500).json({ message: 'সেটিংস লোড করা যায়নি' });
  }
};

exports.saveTrialSettings = async (req, res) => {
  try {
    const b = req.body || {};
    const durationDays = Math.floor(Number(b.durationDays));
    if (b.enabled && !(durationDays >= 1 && durationDays <= 365)) {
      return res.status(400).json({ message: 'মেয়াদ ১ থেকে ৩৬৫ দিনের মধ্যে দিন' });
    }
    const features = [...new Set((Array.isArray(b.features) ? b.features : []).filter((k) => FEATURE_KEYS.includes(k)))];
    if (b.enabled && features.length === 0) {
      return res.status(400).json({ message: 'কমপক্ষে একটি ফিচার বেছে নিন' });
    }
    const examLimit = Math.max(0, Math.floor(Number(b.examLimit) || 0));

    const s = await getSettings();
    s.trial = {
      enabled: !!b.enabled,
      durationDays: durationDays >= 1 ? Math.min(durationDays, 365) : s.trial?.durationDays || 7,
      features,
      examLimit,
    };
    await s.save();
    res.json({ message: 'Test Web সেটিং সেভ হয়েছে (শুধু এরপর থেকে খোলা নতুন শিক্ষক একাউন্টে প্রযোজ্য)', ...(await serialize(s)) });
  } catch (err) {
    res.status(500).json({ message: 'সেভ করা যায়নি' });
  }
};
