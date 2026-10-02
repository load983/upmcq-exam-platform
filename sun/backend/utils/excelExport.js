// backend/utils/excelExport.js
const ExcelJS = require('exceljs');

// ১. পরীক্ষার রেজাল্ট Excel ফাইলে Export করার ফাংশন
// ভাষা অনুযায়ী লেবেল: 'en' হলে ইংরেজি, নাহলে বাংলা (ডিফল্ট)
const isEn = (lang) => String(lang || '').toLowerCase() === 'en';

async function generateResultExcel(exam, attempts, lang = 'bn') {
  const en = isEn(lang);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Results');

  sheet.columns = [
    { header: en ? 'Name' : 'নাম', key: 'name', width: 25 },
    { header: en ? 'Roll' : 'রোল', key: 'roll', width: 15 },
    { header: en ? 'Phone' : 'ফোন', key: 'phone', width: 15 },
    { header: 'IP Address', key: 'ip', width: 18 },
    { header: en ? 'Correct' : 'সঠিক', key: 'correct', width: 10 },
    { header: en ? 'Wrong' : 'ভুল', key: 'wrong', width: 10 },
    { header: en ? 'Skipped' : 'স্কিপ', key: 'skipped', width: 10 },
    { header: en ? 'Marks obtained' : 'প্রাপ্ত নম্বর', key: 'marks', width: 12 },
    { header: en ? 'Started at' : 'শুরুর সময়', key: 'started', width: 20 },
    { header: en ? 'Submitted at' : 'জমা দেয়ার সময়', key: 'submitted', width: 20 },
    { header: en ? 'Status' : 'স্ট্যাটাস', key: 'status', width: 15 },
  ];

  attempts.forEach((a) => {
    sheet.addRow({
      name: a.studentName,
      roll: a.studentRoll,
      phone: a.studentPhone,
      ip: a.ipAddress,
      correct: a.totalCorrect,
      wrong: a.totalWrong,
      skipped: a.totalSkipped,
      marks: a.obtainedMarks,
      started: a.startedAt ? a.startedAt.toISOString() : '',
      submitted: a.submittedAt ? a.submittedAt.toISOString() : '',
      status: a.autoSubmitted ? 'Auto-Submitted' : a.status,
    });
  });

  sheet.getRow(1).font = { bold: true };
  return workbook;
}

// ২. ক্রিয়েট করা শিক্ষার্থীদের তালিকা Excel ফাইলে Export করার ফাংশন
async function generateStudentsExcel(students, lang = 'bn') {
  const en = isEn(lang);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Students');

  sheet.columns = [
    { header: en ? 'Name' : 'নাম', key: 'name', width: 25 },
    { header: en ? 'Roll' : 'রোল', key: 'roll', width: 15 },
    { header: en ? 'Mobile number' : 'মোবাইল নম্বর', key: 'phone', width: 18 },
    { header: en ? 'Class' : 'শ্রেণী', key: 'classes', width: 25 },
    { header: en ? 'Status' : 'স্ট্যাটাস', key: 'status', width: 12 },
    { header: en ? 'Registered at' : 'রেজিস্ট্রেশনের সময়', key: 'registeredAt', width: 22 },
  ];

  students.forEach((s) => {
    sheet.addRow({
      name: s.name || '',
      roll: s.roll || '',
      phone: s.phone || '',
      classes: (s.classes || []).map((c) => c.name).join(', '),
      status: s.banned ? (en ? 'Banned' : 'ব্যান') : (en ? 'Active' : 'সক্রিয়'),
      registeredAt: s.createdAt ? new Date(s.createdAt).toLocaleString(en ? 'en-US' : 'bn-BD') : '',
    });
  });

  sheet.getRow(1).font = { bold: true };
  return workbook;
}

// ৩. অ্যাডমিন: শিক্ষকদের তালিকা Excel
const STATE_BN = { active: 'চালু', expired: 'মেয়াদ শেষ', suspended: 'স্থগিত', none: 'সাবস্ক্রিপশন নেই' };
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB') : '');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-GB') : '');

async function generateTeachersExcel(rows) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Teachers');
  sheet.columns = [
    { header: 'নাম', key: 'name', width: 26 },
    { header: 'ইমেইল', key: 'email', width: 30 },
    { header: 'যোগদানের তারিখ', key: 'joined', width: 16 },
    { header: 'অবস্থা', key: 'state', width: 16 },
    { header: 'প্ল্যান', key: 'plan', width: 24 },
    { header: 'ধরন', key: 'kind', width: 12 },
    { header: 'মেয়াদ শেষের তারিখ', key: 'expires', width: 18 },
    { header: 'বাকি দিন', key: 'daysLeft', width: 10 },
    { header: 'তৈরি করা পরীক্ষা', key: 'exams', width: 14 },
    { header: 'এক্সেস কোড', key: 'code', width: 14 },
  ];
  rows.forEach((r) => {
    const s = r.subscription || {};
    sheet.addRow({
      name: r.name || '',
      email: r.email || '',
      joined: fmtDate(r.joinedAt),
      state: STATE_BN[s.state] || s.state || '',
      plan: s.planName || '',
      kind: s.state === 'active' ? (s.isTrial ? 'ট্রায়াল' : 'পেইড/অ্যাডমিন') : '',
      expires: fmtDate(s.expiresAt),
      daysLeft: s.state === 'active' ? s.daysLeft : '',
      exams: r.examCount ?? 0,
      code: r.accessCode || '',
    });
  });
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = { from: 'A1', to: 'J1' };
  return workbook;
}

// ৪. অ্যাডমিন: পেমেন্ট/সাবস্ক্রিপশন তালিকা Excel
const PAY_STATUS_BN = {
  pending: 'যাচাই বাকি', active: 'Approved', rejected: 'Rejected', failed: 'ব্যর্থ', cancelled: 'বাতিল', suspended: 'স্থগিত',
};
const providerBn = (p) => {
  if (p.provider === 'trial') return 'ফ্রি ট্রায়াল';
  if (p.method === 'admin') return 'অ্যাডমিন';
  return { bkash: 'বিকাশ', nagad: 'নগদ', rocket: 'রকেট', sslcommerz: 'অনলাইন (SSLCommerz)', promo: 'প্রোমো (১০০% ছাড়)' }[p.provider] || p.provider || '';
};

async function generatePaymentsExcel(payments) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Payments');
  sheet.columns = [
    { header: 'তারিখ', key: 'date', width: 20 },
    { header: 'শিক্ষক', key: 'teacher', width: 24 },
    { header: 'ইমেইল', key: 'email', width: 30 },
    { header: 'প্ল্যান', key: 'plan', width: 24 },
    { header: 'মেয়াদ (দিন)', key: 'days', width: 12 },
    { header: 'টাকা (৳)', key: 'amount', width: 12 },
    { header: 'আসল দাম (৳)', key: 'orig', width: 14 },
    { header: 'প্রোমো কোড', key: 'promo', width: 14 },
    { header: 'ছাড় (%)', key: 'disc', width: 10 },
    { header: 'মাধ্যম', key: 'provider', width: 20 },
    { header: 'TrxID / Tran ID', key: 'trx', width: 26 },
    { header: 'প্রেরকের নাম্বার', key: 'sender', width: 16 },
    { header: 'অবস্থা', key: 'status', width: 14 },
    { header: 'শুরু', key: 'starts', width: 14 },
    { header: 'শেষ', key: 'ends', width: 14 },
    { header: 'নোট / Reject কারণ', key: 'note', width: 32 },
  ];

  let paidTotal = 0;
  payments.forEach((p) => {
    // আয়ের হিসাব অ্যাডমিন ড্যাশবোর্ডের মতোই: অ্যাডমিন-প্রদত্ত বাদে, approved/স্থগিত/বাতিল-হওয়া পেইড
    if (p.method !== 'admin' && ['active', 'suspended', 'cancelled'].includes(p.status)) paidTotal += p.amount || 0;
    sheet.addRow({
      date: fmtDateTime(p.createdAt),
      teacher: p.teacher?.name || '',
      email: p.teacher?.email || '',
      plan: p.planName || '',
      days: p.durationDays,
      amount: p.amount ?? 0,
      orig: p.originalAmount ?? '',
      promo: p.promoCode || '',
      disc: p.promoCode ? p.discountPercent : '',
      provider: providerBn(p),
      trx: p.trxId || p.tranId || '',
      sender: p.senderNumber || '',
      status: PAY_STATUS_BN[p.status] || p.status,
      starts: fmtDate(p.startsAt),
      ends: fmtDate(p.expiresAt),
      note: [p.note, p.rejectReason].filter(Boolean).join(' | '),
    });
  });

  const total = sheet.addRow({ date: 'মোট আয় (অ্যাডমিন-প্রদত্ত ও ট্রায়াল বাদে)', amount: paidTotal });
  total.font = { bold: true };
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = { from: 'A1', to: 'P1' };
  return workbook;
}

module.exports = { generateResultExcel, generateStudentsExcel, generateTeachersExcel, generatePaymentsExcel };
