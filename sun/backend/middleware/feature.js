// ================== middleware/feature.js ==================
// requireSubscription -এর পরে বসবে। ট্রায়াল (ফিচার-সীমিত) সাবস্ক্রিপশনে নির্দিষ্ট ফিচার বন্ধ থাকলে আটকায়।
// পেইড/অ্যাডমিন-প্রদত্ত সাবস্ক্রিপশনে featureLimited=false, তাই সব ফিচার আগের মতোই চালু।
const { featureLabel } = require('../utils/features');

const requireFeature = (key) => (req, res, next) => {
  const s = req.subscription;
  if (!s || !s.featureLimited || (s.features || []).includes(key)) return next();
  return res.status(403).json({
    code: 'FEATURE_LOCKED',
    feature: key,
    message: `ফ্রি ট্রায়ালে "${featureLabel(key)}" ফিচারটি চালু নেই। ব্যবহার করতে একটি সাবস্ক্রিপশন নিন।`,
  });
};

module.exports = { requireFeature };
