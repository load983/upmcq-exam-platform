// ================== utils/trial.js ==================
// নতুন শিক্ষক একাউন্ট খুললে অ্যাডমিনের "Test Web" সেটিং অনুযায়ী অটোমেটিক ট্রায়াল সাবস্ক্রিপশন দেওয়া
const Subscription = require('../models/Subscription');
const { getSettings } = require('./siteSettings');
const { FEATURE_KEYS } = require('./features');
const { DAY } = require('./subscription');

const TRIAL_PLAN_NAME = 'ফ্রি ট্রায়াল (Test Web)';

const grantTrialIfEnabled = async (teacherId) => {
  try {
    const settings = await getSettings();
    const trial = settings?.trial;
    if (!trial?.enabled || !(trial.durationDays > 0)) return null;
    if (await Subscription.exists({ teacher: teacherId, isTrial: true })) return null; // একজন শিক্ষক একবারই

    const now = new Date();
    const features = (trial.features || []).filter((k) => FEATURE_KEYS.includes(k));
    const limit = Number(trial.examLimit) > 0 ? Number(trial.examLimit) : 0;
    return await Subscription.create({
      teacher: teacherId,
      planName: TRIAL_PLAN_NAME,
      durationDays: trial.durationDays,
      amount: 0,
      method: 'admin',
      provider: 'trial',
      status: 'active',
      startsAt: now,
      expiresAt: new Date(now.getTime() + trial.durationDays * DAY),
      isTrial: true,
      featureLimited: true,
      features,
      examLimitType: limit ? 'limited' : 'unlimited',
      examLimit: limit,
      note: 'নতুন শিক্ষকের জন্য অটোমেটিক ফ্রি ট্রায়াল',
    });
  } catch (err) {
    console.error('ট্রায়াল দেওয়া যায়নি:', err.message); // রেজিস্ট্রেশন যেন না আটকায়
    return null;
  }
};

module.exports = { grantTrialIfEnabled, TRIAL_PLAN_NAME };
