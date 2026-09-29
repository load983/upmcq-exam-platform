// ================== controllers/subscriptionController.js ==================
// শিক্ষকের দিক: প্ল্যান দেখা, নিজের অবস্থা দেখা, ম্যানুয়াল পেমেন্ট জমা, অনলাইন (SSLCommerz) পেমেন্ট
const crypto = require('crypto');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const { getTeacherStatus, activateSubscription } = require('../utils/subscription');
const { applyPromo, normalize } = require('../utils/promo');

// প্ল্যান + (ঐচ্ছিক) প্রোমো কোড থেকে চূড়ান্ত দাম ও সাবস্ক্রিপশনের অতিরিক্ত ফিল্ড বের করা
const priceWithPromo = async (plan, rawCode) => {
  if (!String(rawCode || '').trim()) return { amount: plan.price, extra: {} };
  const r = await applyPromo(rawCode, plan);
  if (r.error) return { error: r.error };
  return {
    amount: r.finalPrice,
    extra: { promoCode: r.promo.code, discountPercent: r.percent, originalAmount: r.originalPrice },
  };
};

// ১০০% ছাড়ে দাম ০ হলে পেমেন্ট ছাড়াই সাথে সাথে চালু
const createFreeSubscription = async (userId, plan, extra) => {
  const sub = await Subscription.create({
    teacher: userId,
    plan: plan._id,
    planName: plan.name,
    durationDays: plan.durationDays,
    examLimitType: plan.examLimitType,
    examLimit: plan.examLimit,
    amount: 0,
    method: 'manual',
    provider: 'promo',
    status: 'pending',
    ...extra,
  });
  return activateSubscription(sub);
};

const CLIENT_URL = () => (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
const SERVER_URL = () => (process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/+$/, '');

const SSLC_SANDBOX = String(process.env.SSLC_SANDBOX || 'true') !== 'false';
const SSLC_BASE = () => (SSLC_SANDBOX ? 'https://sandbox.sslcommerz.com' : 'https://securepay.sslcommerz.com');
const gatewayConfigured = () => !!(process.env.SSLC_STORE_ID && process.env.SSLC_STORE_PASSWORD);

// ম্যানুয়াল পেমেন্টের নাম্বারগুলো .env থেকে আসে
const paymentInfo = () => ({
  bkash: process.env.PAYMENT_BKASH_NUMBER || '',
  nagad: process.env.PAYMENT_NAGAD_NUMBER || '',
  rocket: process.env.PAYMENT_ROCKET_NUMBER || '',
});

// ১. প্ল্যান তালিকা + পেমেন্ট নির্দেশনা
exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ price: 1 });
    res.json({ plans, paymentInfo: paymentInfo(), gatewayEnabled: gatewayConfigured() });
  } catch (err) {
    res.status(500).json({ message: 'প্ল্যান আনতে সমস্যা হয়েছে' });
  }
};

// ১ক. প্রোমো কোড যাচাই — কার্ডে কত ছাড় হবে দেখানোর জন্য
exports.validatePromo = async (req, res) => {
  try {
    const plan = await Plan.findOne({ _id: req.body.planId, isActive: true });
    if (!plan) return res.status(404).json({ message: 'প্ল্যান পাওয়া যায়নি' });
    const r = await applyPromo(req.body.code, plan);
    if (r.error) return res.status(400).json({ message: r.error });
    res.json({
      code: r.promo.code,
      discountPercent: r.percent,
      originalPrice: r.originalPrice,
      finalPrice: r.finalPrice,
    });
  } catch (err) {
    res.status(500).json({ message: 'প্রোমো কোড যাচাই করতে সমস্যা হয়েছে' });
  }
};

// ২. নিজের অবস্থা ও ইতিহাস
exports.getMySubscription = async (req, res) => {
  try {
    const [status, history] = await Promise.all([
      getTeacherStatus(req.user.id),
      Subscription.find({ teacher: req.user.id }).sort({ createdAt: -1 }).limit(30),
    ]);
    res.json({ status, history });
  } catch (err) {
    res.status(500).json({ message: 'সাবস্ক্রিপশনের তথ্য আনতে সমস্যা হয়েছে' });
  }
};

// ৩. ম্যানুয়াল পেমেন্ট জমা (বিকাশ/নগদ/রকেটে Send Money করে TrxID দেওয়া) → অ্যাডমিন approve করবেন
exports.submitManualPayment = async (req, res) => {
  try {
    const { planId, provider, trxId, senderNumber, promoCode } = req.body;

    const plan = await Plan.findOne({ _id: planId, isActive: true });
    if (!plan) return res.status(404).json({ message: 'প্ল্যান পাওয়া যায়নি' });

    const priced = await priceWithPromo(plan, promoCode);
    if (priced.error) return res.status(400).json({ message: priced.error });

    // ১০০% ছাড় → পেমেন্ট লাগবে না, সাথে সাথে চালু
    if (priced.amount <= 0) {
      const sub = await createFreeSubscription(req.user.id, plan, priced.extra);
      return res.status(201).json({ message: 'প্রোমো কোড কাজ করেছে! সাবস্ক্রিপশন চালু হয়েছে।', subscription: sub, activated: true });
    }

    if (!['bkash', 'nagad', 'rocket'].includes(provider)) {
      return res.status(400).json({ message: 'পেমেন্ট মাধ্যম বেছে নাও' });
    }
    const cleanTrx = String(trxId || '').trim().toUpperCase();
    if (cleanTrx.length < 6) return res.status(400).json({ message: 'সঠিক ট্রানজেকশন আইডি (TrxID) দাও' });

    // একই TrxID দিয়ে দ্বিতীয়বার দাবি ঠেকানো
    const used = await Subscription.findOne({ trxId: cleanTrx, status: { $in: ['pending', 'active', 'suspended'] } });
    if (used) return res.status(400).json({ message: 'এই TrxID আগেই ব্যবহার বা জমা দেওয়া হয়েছে' });

    const sub = await Subscription.create({
      teacher: req.user.id,
      plan: plan._id,
      planName: plan.name,
      durationDays: plan.durationDays,
      examLimitType: plan.examLimitType,
      examLimit: plan.examLimit,
      amount: priced.amount,
      ...priced.extra,
      method: 'manual',
      provider,
      trxId: cleanTrx,
      senderNumber: String(senderNumber || '').trim(),
      status: 'pending',
    });
    res.status(201).json({ message: 'পেমেন্টের তথ্য জমা হয়েছে। অ্যাডমিন যাচাই করলে সাবস্ক্রিপশন চালু হবে।', subscription: sub });
  } catch (err) {
    res.status(500).json({ message: 'পেমেন্ট জমা দিতে সমস্যা হয়েছে' });
  }
};

// ৪. অনলাইন পেমেন্ট শুরু (SSLCommerz)
exports.initGatewayPayment = async (req, res) => {
  try {
    if (!gatewayConfigured()) {
      return res.status(503).json({ message: 'অনলাইন পেমেন্ট এখনো চালু করা হয়নি, ম্যানুয়াল পেমেন্ট ব্যবহার করো' });
    }
    const plan = await Plan.findOne({ _id: req.body.planId, isActive: true });
    if (!plan) return res.status(404).json({ message: 'প্ল্যান পাওয়া যায়নি' });
    if (plan.price <= 0) return res.status(400).json({ message: 'এই প্ল্যানে অনলাইন পেমেন্ট প্রযোজ্য নয়' });

    const priced = await priceWithPromo(plan, req.body.promoCode);
    if (priced.error) return res.status(400).json({ message: priced.error });
    // ১০০% ছাড় → গেটওয়ে ছাড়াই চালু
    if (priced.amount <= 0) {
      await createFreeSubscription(req.user.id, plan, priced.extra);
      return res.json({ url: `${CLIENT_URL()}/teacher/subscribe?payment=success` });
    }

    const teacher = await User.findById(req.user.id).select('name email');
    const tranId = `SUB${Date.now()}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const sub = await Subscription.create({
      teacher: req.user.id,
      plan: plan._id,
      planName: plan.name,
      durationDays: plan.durationDays,
      examLimitType: plan.examLimitType,
      examLimit: plan.examLimit,
      amount: priced.amount,
      ...priced.extra,
      method: 'gateway',
      provider: 'sslcommerz',
      tranId,
      status: 'pending',
    });

    const base = `${SERVER_URL()}/api/subscription/gateway`;
    const body = new URLSearchParams({
      store_id: process.env.SSLC_STORE_ID,
      store_passwd: process.env.SSLC_STORE_PASSWORD,
      total_amount: String(priced.amount),
      currency: 'BDT',
      tran_id: tranId,
      success_url: `${base}/success`,
      fail_url: `${base}/fail`,
      cancel_url: `${base}/cancel`,
      ipn_url: `${base}/ipn`,
      product_name: plan.name,
      product_category: 'subscription',
      product_profile: 'non-physical-goods',
      shipping_method: 'NO',
      cus_name: teacher?.name || 'Teacher',
      cus_email: teacher?.email || 'no-email@example.com',
      cus_add1: 'Bangladesh',
      cus_city: 'Dhaka',
      cus_country: 'Bangladesh',
      cus_phone: '01000000000',
    });

    const resp = await fetch(`${SSLC_BASE()}/gwprocess/v4/api.php`, { method: 'POST', body });
    const data = await resp.json();
    if (!data.GatewayPageURL) {
      sub.status = 'failed';
      sub.note = data.failedreason || 'gateway init failed';
      await sub.save();
      return res.status(502).json({ message: 'পেমেন্ট গেটওয়ে চালু করা যায়নি, একটু পরে চেষ্টা করো' });
    }
    res.json({ url: data.GatewayPageURL });
  } catch (err) {
    console.error('gateway init error:', err.message);
    res.status(500).json({ message: 'অনলাইন পেমেন্ট শুরু করতে সমস্যা হয়েছে' });
  }
};

// গেটওয়ের সার্ভার থেকে পেমেন্ট আসলেই সফল কিনা যাচাই — ব্রাউজারের পাঠানো ডেটা বিশ্বাস করা হয় না
const validateAndActivate = async (tranId, valId) => {
  if (!tranId || !valId) return false;
  const sub = await Subscription.findOne({ tranId });
  if (!sub) return false;
  if (sub.status === 'active') return true; // আগেই চালু হয়েছে (IPN + success দুইবার এলে সমস্যা নেই)
  if (sub.status !== 'pending') return false;

  const url =
    `${SSLC_BASE()}/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(valId)}` +
    `&store_id=${encodeURIComponent(process.env.SSLC_STORE_ID)}` +
    `&store_passwd=${encodeURIComponent(process.env.SSLC_STORE_PASSWORD)}&format=json`;
  const resp = await fetch(url);
  const v = await resp.json();

  const paid = ['VALID', 'VALIDATED'].includes(v.status);
  const sameTran = v.tran_id === sub.tranId;
  const sameAmount = Math.abs(parseFloat(v.currency_amount || v.amount) - sub.amount) < 0.01;
  if (!(paid && sameTran && sameAmount)) return false;

  sub.gatewayValId = valId;
  await activateSubscription(sub);
  return true;
};

const redirectToClient = (res, result) => res.redirect(303, `${CLIENT_URL()}/teacher/subscribe?payment=${result}`);

exports.gatewaySuccess = async (req, res) => {
  try {
    const ok = await validateAndActivate(req.body.tran_id, req.body.val_id);
    return redirectToClient(res, ok ? 'success' : 'failed');
  } catch (err) {
    console.error('gateway success error:', err.message);
    return redirectToClient(res, 'failed');
  }
};

exports.gatewayIpn = async (req, res) => {
  try {
    await validateAndActivate(req.body.tran_id, req.body.val_id);
  } catch (err) {
    console.error('gateway ipn error:', err.message);
  }
  res.sendStatus(200);
};

const markUnpaid = (status) => async (req, res) => {
  try {
    const tranId = req.body.tran_id;
    if (tranId) await Subscription.updateOne({ tranId, status: 'pending' }, { status });
  } catch (err) {
    /* ignore */
  }
  return redirectToClient(res, status === 'cancelled' ? 'cancelled' : 'failed');
};
exports.gatewayFail = markUnpaid('failed');
exports.gatewayCancel = markUnpaid('cancelled');
