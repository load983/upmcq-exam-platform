// ================== utils/push.js ==================
// Web Push পাঠানোর হেলপার। VAPID কী না থাকলে বা web-push প্যাকেজ না থাকলে চুপচাপ বন্ধ থাকে
// (ওয়েবসাইটের ভেতরের নোটিফিকেশন তখনও ঠিকভাবে কাজ করবে)।
const PushSubscription = require('../models/PushSubscription');

let webpush = null;
try {
  webpush = require('web-push');
} catch (e) {
  console.warn('web-push প্যাকেজ নেই — ডিভাইস নোটিফিকেশন বন্ধ (npm install web-push চালাও)');
}

const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const enabled = !!(webpush && PUBLIC_KEY && PRIVATE_KEY);

if (enabled) {
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@example.com', PUBLIC_KEY, PRIVATE_KEY);
} else if (webpush) {
  console.warn('VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY সেট করা নেই — ডিভাইস নোটিফিকেশন বন্ধ');
}

const getPublicKey = () => (enabled ? PUBLIC_KEY : null);

// নির্দিষ্ট ইউজারদের সব ডিভাইসে নোটিফিকেশন পাঠায়। payload: { title, body, url, image, tag }
const sendToUsers = async (userIds, payload) => {
  if (!enabled || !userIds || userIds.length === 0) return { sent: 0 };
  const subs = await PushSubscription.find({ user: { $in: userIds } }).lean();
  const data = JSON.stringify(payload);
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, data);
        sent += 1;
      } catch (err) {
        // ডিভাইস আর সাবস্ক্রাইব করা নেই — মুছে ফেলো
        if (err.statusCode === 404 || err.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: s._id }).catch(() => {});
        }
      }
    })
  );
  return { sent };
};

module.exports = { enabled, getPublicKey, sendToUsers };
