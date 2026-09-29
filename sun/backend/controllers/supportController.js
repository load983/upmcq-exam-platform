// ================== controllers/supportController.js ==================
// হেল্পলাইন: (১) অ্যাডমিনের যোগাযোগ তথ্য (২) ইউজার ↔ অ্যাডমিন লাইভ চ্যাট (পোলিং ভিত্তিক)
const SiteSettings = require('../models/SiteSettings');
const ChatThread = require('../models/ChatThread');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const { getSettings } = require('../utils/siteSettings');

const CONTACT_KEYS = ['phone', 'whatsapp', 'email', 'facebook', 'messenger', 'telegram', 'instagram', 'youtube', 'twitter', 'tiktok', 'website'];
const URL_KEYS = ['facebook', 'messenger', 'telegram', 'instagram', 'youtube', 'twitter', 'tiktok', 'website'];
const MAX_EXTRAS = 10;
const MAX_MSG_LEN = 1000;

// ---------- হেল্পার ----------

// শুধু http/https লিংক গ্রহণ করি (javascript: ইত্যাদি আটকাতে)। স্কিম না থাকলে https:// বসে যায়।
const cleanUrl = (v) => {
  const s = String(v || '').trim().slice(0, 300);
  if (!s) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(s) && !/^https?:\/\//i.test(s)) return null; // অন্য স্কিম বাতিল
  return /^https?:\/\//i.test(s) ? s : `https://${s.replace(/^\/+/, '')}`;
};
const cleanPhone = (v) => String(v || '').replace(/[^\d+]/g, '').slice(0, 20);
const cleanEmail = (v) => String(v || '').trim().slice(0, 120);

const serializeSettings = (s) => ({
  contacts: CONTACT_KEYS.reduce((o, k) => ({ ...o, [k]: s.contacts?.[k] || '' }), {}),
  extras: (s.extras || []).map((e) => ({ label: e.label, value: e.value })),
  helplineNote: s.helplineNote || '',
  chatEnabled: s.chatEnabled !== false,
});

// ---------- পাবলিক: যোগাযোগ তথ্য ----------
exports.getPublicContacts = async (req, res) => {
  try {
    const s = serializeSettings(await getSettings());
    const contacts = Object.fromEntries(Object.entries(s.contacts).filter(([, v]) => v));
    res.json({
      contacts,
      extras: s.extras.filter((e) => e.label && e.value),
      helplineNote: s.helplineNote,
      chatEnabled: s.chatEnabled,
    });
  } catch (err) {
    res.status(500).json({ message: 'তথ্য লোড করা যায়নি' });
  }
};

// ---------- অ্যাডমিন: সেটিংস দেখা/সেভ ----------
exports.adminGetSettings = async (req, res) => {
  try {
    res.json(serializeSettings(await getSettings()));
  } catch (err) {
    res.status(500).json({ message: 'সেটিংস লোড করা যায়নি' });
  }
};

exports.adminSaveSettings = async (req, res) => {
  try {
    const body = req.body || {};
    const incoming = body.contacts || {};
    const contacts = {};
    for (const k of CONTACT_KEYS) {
      const raw = incoming[k];
      if (k === 'phone' || k === 'whatsapp') contacts[k] = cleanPhone(raw);
      else if (k === 'email') contacts[k] = cleanEmail(raw);
      else if (URL_KEYS.includes(k)) {
        const u = cleanUrl(raw);
        if (u === null) return res.status(400).json({ message: `${k} এর লিংক সঠিক নয় (শুধু http/https লিংক দেওয়া যাবে)` });
        contacts[k] = u;
      }
    }

    const extras = (Array.isArray(body.extras) ? body.extras : [])
      .slice(0, MAX_EXTRAS)
      .map((e) => ({ label: String(e?.label || '').trim().slice(0, 40), value: String(e?.value || '').trim().slice(0, 300) }))
      .filter((e) => e.label && e.value)
      .filter((e) => !/^(javascript|data|vbscript):/i.test(e.value));

    const s = await getSettings();
    s.contacts = contacts;
    s.extras = extras;
    s.helplineNote = String(body.helplineNote || '').trim().slice(0, 200);
    s.chatEnabled = body.chatEnabled !== false;
    await s.save();

    res.json({ message: 'যোগাযোগের তথ্য সেভ হয়েছে', ...serializeSettings(s) });
  } catch (err) {
    res.status(500).json({ message: 'সেভ করা যায়নি' });
  }
};

// ---------- ইউজার চ্যাট: থ্রেড খোঁজা/তৈরি ----------
const VISITOR_RE = /^[A-Za-z0-9_-]{16,64}$/;

// সাধারণ রেট-লিমিট (মেমরিতে): প্রতি ইউজার/ভিজিটরের জন্য মিনিটে সর্বোচ্চ ২০টি মেসেজ
const hits = new Map();
const rateLimited = (key) => {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < 60000);
  if (arr.length >= 20) { hits.set(key, arr); return true; }
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < 60000)) hits.delete(k);
  return false;
};

const findThread = async (req, { create = false, guest = {} } = {}) => {
  if (req.user) {
    if (req.user.role === 'admin') return { error: [403, 'অ্যাডমিন এই চ্যাট ব্যবহার করতে পারবে না'] };
    let th = await ChatThread.findOne({ owner: req.user.id });
    if (!th && create) {
      const u = await User.findById(req.user.id).select('name role phone email');
      if (!u) return { error: [401, 'ইউজার পাওয়া যায়নি'] };
      th = await ChatThread.create({ owner: u._id, name: u.name, role: u.role, phone: u.phone || '', email: u.email || '' });
    }
    return { thread: th, key: `u:${req.user.id}` };
  }
  const vid = String(req.headers['x-visitor-id'] || '');
  if (!VISITOR_RE.test(vid)) return { error: [400, 'ভিজিটর আইডি সঠিক নয়'] };
  let th = await ChatThread.findOne({ visitorId: vid });
  if (!th && create) {
    const name = String(guest.name || '').trim().slice(0, 60);
    if (!name) return { error: [400, 'আপনার নাম লিখুন'] };
    th = await ChatThread.create({ visitorId: vid, name, role: 'guest', phone: cleanPhone(guest.phone) });
  }
  return { thread: th, key: `v:${vid}` };
};

const publicMsg = (m) => ({ _id: m._id, sender: m.sender, text: m.text, createdAt: m.createdAt });

// GET /support/chat?after=<messageId> — নিজের মেসেজ আনা (পোলিং) + অ্যাডমিনের মেসেজ "পড়া" হিসেবে চিহ্নিত
exports.userGetMessages = async (req, res) => {
  try {
    const { thread, error } = await findThread(req);
    if (error) return res.status(error[0]).json({ message: error[1] });
    const settings = await getSettings();
    if (!thread) return res.json({ messages: [], chatEnabled: settings.chatEnabled !== false, hasThread: false });

    const q = { thread: thread._id };
    if (req.query.after && /^[a-f\d]{24}$/i.test(req.query.after)) q._id = { $gt: req.query.after };
    const msgs = await ChatMessage.find(q).sort({ _id: 1 }).limit(200);
    if (thread.unreadByUser > 0) await ChatThread.updateOne({ _id: thread._id }, { unreadByUser: 0 });
    res.json({ messages: msgs.map(publicMsg), chatEnabled: settings.chatEnabled !== false, hasThread: true });
  } catch (err) {
    res.status(500).json({ message: 'মেসেজ লোড করা যায়নি' });
  }
};

// GET /support/chat/unread — বাটনের ব্যাজের জন্য
exports.userUnread = async (req, res) => {
  try {
    const { thread } = await findThread(req);
    res.json({ unread: thread?.unreadByUser || 0 });
  } catch (err) {
    res.json({ unread: 0 });
  }
};

// POST /support/chat { text, name?, phone? }
exports.userSend = async (req, res) => {
  try {
    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ message: 'মেসেজ লিখুন' });
    if (text.length > MAX_MSG_LEN) return res.status(400).json({ message: `মেসেজ সর্বোচ্চ ${MAX_MSG_LEN} অক্ষরের হতে পারবে` });

    const settings = await getSettings();
    if (settings.chatEnabled === false) return res.status(403).json({ message: 'চ্যাট এখন বন্ধ আছে' });

    const { thread, key, error } = await findThread(req, { create: true, guest: req.body });
    if (error) return res.status(error[0]).json({ message: error[1] });
    if (rateLimited(key)) return res.status(429).json({ message: 'একটু ধীরে পাঠান, কিছুক্ষণ পর আবার চেষ্টা করুন' });

    const msg = await ChatMessage.create({ thread: thread._id, sender: 'user', text });
    await ChatThread.updateOne(
      { _id: thread._id },
      { lastMessageAt: msg.createdAt, lastMessagePreview: text.slice(0, 80), $inc: { unreadByAdmin: 1 } }
    );
    res.status(201).json({ message: publicMsg(msg) });
  } catch (err) {
    res.status(500).json({ message: 'মেসেজ পাঠানো যায়নি' });
  }
};

// ---------- অ্যাডমিন ইনবক্স ----------
exports.adminListThreads = async (req, res) => {
  try {
    const threads = await ChatThread.find().sort({ lastMessageAt: -1 }).limit(200);
    res.json({ threads });
  } catch (err) {
    res.status(500).json({ message: 'কথোপকথন লোড করা যায়নি' });
  }
};

exports.adminUnreadCount = async (req, res) => {
  try {
    const [row] = await ChatThread.aggregate([{ $group: { _id: null, n: { $sum: '$unreadByAdmin' } } }]);
    res.json({ unread: row?.n || 0 });
  } catch (err) {
    res.json({ unread: 0 });
  }
};

exports.adminGetMessages = async (req, res) => {
  try {
    const thread = await ChatThread.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'কথোপকথন পাওয়া যায়নি' });
    const q = { thread: thread._id };
    if (req.query.after && /^[a-f\d]{24}$/i.test(req.query.after)) q._id = { $gt: req.query.after };
    const msgs = await ChatMessage.find(q).sort({ _id: 1 }).limit(500);
    if (thread.unreadByAdmin > 0) await ChatThread.updateOne({ _id: thread._id }, { unreadByAdmin: 0 });
    res.json({ thread, messages: msgs.map(publicMsg) });
  } catch (err) {
    res.status(500).json({ message: 'মেসেজ লোড করা যায়নি' });
  }
};

exports.adminReply = async (req, res) => {
  try {
    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ message: 'মেসেজ লিখুন' });
    if (text.length > MAX_MSG_LEN) return res.status(400).json({ message: `মেসেজ সর্বোচ্চ ${MAX_MSG_LEN} অক্ষরের হতে পারবে` });
    const thread = await ChatThread.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'কথোপকথন পাওয়া যায়নি' });
    const msg = await ChatMessage.create({ thread: thread._id, sender: 'admin', text });
    await ChatThread.updateOne(
      { _id: thread._id },
      { lastMessageAt: msg.createdAt, lastMessagePreview: `আপনি: ${text.slice(0, 70)}`, $inc: { unreadByUser: 1 } }
    );
    res.status(201).json({ message: publicMsg(msg) });
  } catch (err) {
    res.status(500).json({ message: 'উত্তর পাঠানো যায়নি' });
  }
};

exports.adminDeleteThread = async (req, res) => {
  try {
    const thread = await ChatThread.findByIdAndDelete(req.params.id);
    if (!thread) return res.status(404).json({ message: 'কথোপকথন পাওয়া যায়নি' });
    await ChatMessage.deleteMany({ thread: thread._id });
    res.json({ message: 'কথোপকথন মুছে ফেলা হয়েছে' });
  } catch (err) {
    res.status(500).json({ message: 'মুছা যায়নি' });
  }
};
