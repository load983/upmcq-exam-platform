// ================== controllers/examController.js ==================
const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto'); // nanoid-এর ESM কনফ্লিক্ট এড়াতে Node.js বিল্ট-ইন crypto
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const User = require('../models/User');
const Class = require('../models/Class');
const { extractQuestionsFromFile } = require('../utils/pdfParser');
const { generateResultExcel } = require('../utils/excelExport');
const PDFDocument = require('pdfkit');
const { registerFonts, writeText } = require('../utils/pdfFonts');
const { getTeacherStatus, getActiveTeacherIds } = require('../utils/subscription');
const { announceExamPublished } = require('./messageController');
const Announcement = require('../models/Announcement');

// 8 অক্ষরের ইউনিক এক্সাম কোড তৈরি করার হেলপার ফাংশন
const generateExamCode = () => crypto.randomBytes(4).toString('hex');

// হেলপার ফাংশন: সেফলি ফাইল ডিলিট করার জন্য
const safeDeleteFile = (filePath) => {
  if (filePath && typeof filePath === 'string' && fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error(`File deletion error (${filePath}):`, err.message);
    });
  }
};

// হেলপার: classIds (অ্যারে / JSON স্ট্রিং / কমা-সেপারেটেড স্ট্রিং) থেকে আইডির তালিকা বের করা
const parseClassIds = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      /* কমা দিয়ে আলাদা করা স্ট্রিং */
    }
    return raw.split(',').map((x) => x.trim()).filter(Boolean);
  }
  return [];
};

// হেলপার: নির্বাচিত সব শ্রেণী এই শিক্ষকের কিনা যাচাই করা (কমপক্ষে একটি আবশ্যক)
const validateClassesForTeacher = async (teacherId, rawIds) => {
  const ids = [...new Set(parseClassIds(rawIds).map(String))];
  if (ids.length === 0 || ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    return { error: 'পরীক্ষার জন্য কমপক্ষে একটি শ্রেণী নির্বাচন করা আবশ্যক' };
  }
  const classes = await Class.find({ _id: { $in: ids }, teacher: teacherId }).select('_id');
  if (classes.length !== ids.length) {
    return { error: 'নির্বাচিত কোনো শ্রেণী পাওয়া যায়নি' };
  }
  return { ids: classes.map((c) => c._id) };
};

// ---------- ১. PDF আপলোড করে নতুন Exam তৈরি করা ----------
exports.uploadExamPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'PDF অথবা Word ফাইল আবশ্যক' });
    }

    // 🎓 শ্রেণী নির্বাচন আবশ্যক
    const classCheck = await validateClassesForTeacher(req.user.id, req.body.classIds);
    if (classCheck.error) {
      if (req.file.path) safeDeleteFile(req.file.path);
      return res.status(400).json({ message: classCheck.error });
    }

    const title = req.body.title || req.file.originalname.replace(/\.(pdf|docx?)$/i, '');
    
    // PDF / Word থেকে প্রশ্ন পার্স করা (ফাইলের এক্সটেনশন দেখে পার্সার বাছাই হয়)
    const parsedQuestions = await extractQuestionsFromFile(req.file.path || req.file.buffer, req.file.originalname);

    if (!parsedQuestions || parsedQuestions.length === 0) {
      if (req.file.path) safeDeleteFile(req.file.path);
      return res.status(400).json({
        message:
          'ফাইল থেকে কোনো প্রশ্ন পার্স করা যায়নি। ফরম্যাট চেক করো: "1. প্রশ্ন? A. ... B. ... C. ... D. ... Answer: C"',
      });
    }

    const examCode = generateExamCode();

    const exam = await Exam.create({
      teacher: req.user.id,
      title,
      classRefs: classCheck.ids,
      sourcePdfPath: req.file.path || null,
      examCode,
      status: 'draft',
      settings: {
        totalTimeMinutes: 10, // ডিফল্ট সময় ১০ মিনিট দেওয়া হলো
      }
    });

    const questionDocs = parsedQuestions.map((q, index) => ({
      ...q,
      exam: exam._id,
      order: q.order !== undefined ? q.order : index,
    }));

    await Question.insertMany(questionDocs);

    res.status(201).json({ exam, questionCount: questionDocs.length });
  } catch (err) {
    if (req.file?.path) safeDeleteFile(req.file.path);
    res.status(500).json({ message: err.message || 'PDF আপলোড করতে সমস্যা হয়েছে' });
  }
};

// ---------- ১.৫ সরাসরি অনলাইনে (ম্যানুয়ালি টাইপ করে) নতুন Exam তৈরি করা ----------
exports.createExam = async (req, res) => {
  try {
    const { title, questions } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'পরীক্ষার নাম আবশ্যক' });
    }

    const classCheck = await validateClassesForTeacher(req.user.id, req.body.classIds);
    if (classCheck.error) return res.status(400).json({ message: classCheck.error });

    const examCode = generateExamCode();

    const exam = await Exam.create({
      teacher: req.user.id,
      title: String(title).trim(),
      classRefs: classCheck.ids,
      examCode,
      status: 'draft',
      settings: {
        totalTimeMinutes: 10, // ডিফল্ট সময় ১০ মিনিট
      },
    });

    let questionCount = 0;

    if (Array.isArray(questions) && questions.length > 0) {
      // শুধু ভ্যালিড প্রশ্নগুলোই রাখা হচ্ছে (টেক্সট + কমপক্ষে ২টা অপশন + সঠিক উত্তর নির্বাচিত)
      const validQuestions = questions.filter((q) => {
        if (!q || typeof q.questionText !== 'string' || !q.questionText.trim()) return false;
        if (!Array.isArray(q.options)) return false;
        const filledOptions = q.options.filter((o) => String(o || '').trim());
        if (filledOptions.length < 2) return false;
        const idx = Number(q.correctOptionIndex);
        if (!Number.isInteger(idx) || idx < 0 || idx >= q.options.length) return false;
        if (!String(q.options[idx] || '').trim()) return false;
        return true;
      });

      if (validQuestions.length > 0) {
        const questionDocs = validQuestions.map((q, index) => ({
          exam: exam._id,
          questionText: q.questionText.trim(),
          options: q.options.map((o) => String(o || '').trim()),
          correctOptionIndex: Number(q.correctOptionIndex),
          explanation: q.explanation ? String(q.explanation).trim() : undefined,
          order: index,
        }));
        await Question.insertMany(questionDocs);
        questionCount = questionDocs.length;
      }
    }

    res.status(201).json({ exam, questionCount });
  } catch (err) {
    res.status(500).json({ message: err.message || 'পরীক্ষা তৈরি করতে সমস্যা হয়েছে' });
  }
};

// ---------- ⏳ পেন্ডিং (অসম্পূর্ণ) পরীক্ষা ----------
// তালিকায় পাঠানোর সময় ভারী draftData বাদ দিয়ে শুধু প্রশ্নসংখ্যা পাঠানো হয়
const summarizeExam = (exam) => {
  const o = typeof exam.toObject === 'function' ? exam.toObject() : { ...exam };
  if (o.pending) {
    o.pendingQuestionCount = Array.isArray(o.draftData?.questions) ? o.draftData.questions.length : 0;
  }
  delete o.draftData;
  return o;
};

const cutStr = (v, max) => String(v ?? '').slice(0, max);

// ফর্মের লেখা যেমন আছে তেমন রাখা হয় (ট্রিম/ফিল্টার ছাড়া), শুধু আকার ও ধরন নিরাপদ করা হয়
const sanitizeDraft = async (teacherId, body = {}) => {
  const rawIds = parseClassIds(body.classIds).map(String).filter((id) => mongoose.Types.ObjectId.isValid(id));
  let classIds = [];
  if (rawIds.length) {
    const found = await Class.find({ _id: { $in: rawIds }, teacher: teacherId }).select('_id');
    classIds = found.map((c) => String(c._id));
  }
  const questions = (Array.isArray(body.questions) ? body.questions : []).slice(0, 500).map((q) => {
    const options = (Array.isArray(q?.options) ? q.options : ['', '']).slice(0, 8).map((o) => cutStr(o, 2000));
    while (options.length < 2) options.push('');
    let idx = Number(q?.correctOptionIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx >= options.length) idx = 0;
    return {
      questionText: cutStr(q?.questionText, 5000),
      options,
      correctOptionIndex: idx,
      explanation: cutStr(q?.explanation, 5000),
    };
  });
  return { title: cutStr(body.title, 300), classIds, questions };
};

const draftHasContent = (d) =>
  !!d.title.trim() ||
  d.questions.some((q) => q.questionText.trim() || q.explanation.trim() || q.options.some((o) => o.trim()));

// পেন্ডিং পরীক্ষা তৈরি/আপডেট (ফর্ম অসম্পূর্ণ থাকলেও চলবে; সীমা গণনায় ধরা হয় না)
exports.savePending = async (req, res) => {
  try {
    const draft = await sanitizeDraft(req.user.id, req.body);
    const id = req.body?.id;
    let exam = null;

    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ code: 'PENDING_NOT_FOUND', message: 'পেন্ডিং পরীক্ষা পাওয়া যায়নি' });
      }
      exam = await Exam.findOne({ _id: id, teacher: req.user.id, pending: true });
      if (!exam) {
        return res.status(404).json({ code: 'PENDING_NOT_FOUND', message: 'পেন্ডিং পরীক্ষা পাওয়া যায়নি' });
      }
    } else {
      if (!draftHasContent(draft)) {
        return res.status(400).json({ message: 'সংরক্ষণ করার মতো কিছু লেখা হয়নি' });
      }
      exam = new Exam({
        teacher: req.user.id,
        examCode: generateExamCode(),
        status: 'draft',
        pending: true,
        settings: { totalTimeMinutes: 10 },
      });
    }

    exam.title = draft.title.trim() || 'শিরোনামহীন পরীক্ষা';
    exam.draftData = draft;
    exam.markModified('draftData');
    await exam.save();

    res.json({ exam: summarizeExam(exam) });
  } catch (err) {
    res.status(500).json({ message: err.message || 'পেন্ডিং হিসেবে সংরক্ষণ করতে সমস্যা হয়েছে' });
  }
};

// একটি পেন্ডিং পরীক্ষার সংরক্ষিত ফর্ম ফেরত (এডিটের জন্য)
exports.getPending = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = mongoose.Types.ObjectId.isValid(id)
      ? await Exam.findOne({ _id: id, teacher: req.user.id, pending: true })
      : null;
    if (!exam) return res.status(404).json({ code: 'PENDING_NOT_FOUND', message: 'পেন্ডিং পরীক্ষা পাওয়া যায়নি' });
    res.json({
      exam: summarizeExam(exam),
      draft: exam.draftData || { title: '', classIds: [], questions: [] },
      updatedAt: exam.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// পেন্ডিং পরীক্ষা চূড়ান্ত করা: প্রশ্নগুলো আসল Question হয়ে যায়, পরীক্ষা সাধারণ (খসড়া) তালিকায় চলে যায়
exports.finalizePending = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = mongoose.Types.ObjectId.isValid(id)
      ? await Exam.findOne({ _id: id, teacher: req.user.id, pending: true })
      : null;
    if (!exam) return res.status(404).json({ code: 'PENDING_NOT_FOUND', message: 'পেন্ডিং পরীক্ষা পাওয়া যায়নি' });

    // ফর্ম থেকে সর্বশেষ লেখা এলে সেটাই, নইলে আগে সংরক্ষিত খসড়া
    const draft = await sanitizeDraft(req.user.id, Array.isArray(req.body?.questions) ? req.body : exam.draftData);

    if (!draft.title.trim()) return res.status(400).json({ message: 'পরীক্ষার নাম আবশ্যক' });
    const classCheck = await validateClassesForTeacher(req.user.id, draft.classIds);
    if (classCheck.error) return res.status(400).json({ message: classCheck.error });

    const valid = draft.questions.filter((q) => {
      const filled = q.options.filter((o) => o.trim());
      return q.questionText.trim() && filled.length >= 2 && q.options[q.correctOptionIndex]?.trim();
    });
    if (valid.length === 0) {
      return res.status(400).json({ message: 'কমপক্ষে একটি সম্পূর্ণ প্রশ্ন (দুটি অপশন ও সঠিক উত্তরসহ) থাকতে হবে' });
    }

    await Question.deleteMany({ exam: exam._id });
    await Question.insertMany(
      valid.map((q, index) => ({
        exam: exam._id,
        questionText: q.questionText.trim(),
        options: q.options.map((o) => o.trim()),
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation.trim() || undefined,
        order: index,
      }))
    );

    try {
      exam.title = draft.title.trim();
      exam.classRefs = classCheck.ids;
      exam.pending = false;
      exam.status = 'draft';
      exam.draftData = undefined;
      await exam.save();
    } catch (saveErr) {
      await Question.deleteMany({ exam: exam._id }); // অর্ধেক কাজ পড়ে থাকতে দেওয়া হবে না
      throw saveErr;
    }

    res.status(201).json({ exam: summarizeExam(exam), questionCount: valid.length });
  } catch (err) {
    res.status(500).json({ message: err.message || 'পরীক্ষা তৈরি করতে সমস্যা হয়েছে' });
  }
};

// ---------- ২. Teacher এর সব Exam লিস্ট ----------
exports.getMyExams = async (req, res) => {
  try {
    const exams = await Exam.find({ teacher: req.user.id })
      .populate('classRefs', 'name accessCode')
      .sort({ createdAt: -1 });
    res.json(exams.map(summarizeExam));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- ৩. একটি Exam এর ডিটেইলস + প্রশ্ন ----------
exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam পাওয়া যায়নি' });
    if (exam.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'অনুমতি নেই' });
    }

    const questions = await Question.find({ exam: exam._id }).sort({ order: 1 });
    res.json({ exam, questions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- ৪. Exam Settings আপডেট ----------
exports.updateExamSettings = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam পাওয়া যায়নি' });
    if (exam.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'অনুমতি নেই' });
    }

    exam.title = req.body.title ?? exam.title;

    // শ্রেণী পরিবর্তন (ঐচ্ছিক, একাধিক)
    if (req.body.classIds !== undefined) {
      const classCheck = await validateClassesForTeacher(req.user.id, req.body.classIds);
      if (classCheck.error) return res.status(400).json({ message: classCheck.error });
      exam.classRefs = classCheck.ids;
    }
    
    // settings আপডেট নিশ্চিত করা এবং সময় ০ না রাখার সেফগারার্ড
    const incomingSettings = { ...(req.body.settings || {}) };

    // 🗓️ শিডিউল: তারিখ যাচাই ও স্বাভাবিকীকরণ (ফাঁকা হলে null, ভুল তারিখ/শেষ ≤ শুরু হলে ত্রুটি)
    if (incomingSettings.schedule !== undefined) {
      const sch = incomingSettings.schedule || {};
      const startAt = sch.startAt ? new Date(sch.startAt) : null;
      const endAt = sch.endAt ? new Date(sch.endAt) : null;
      if ((startAt && isNaN(startAt.getTime())) || (endAt && isNaN(endAt.getTime()))) {
        return res.status(400).json({ message: 'শিডিউলের তারিখ/সময় সঠিক নয়' });
      }
      if (sch.enabled && startAt && endAt && endAt <= startAt) {
        return res.status(400).json({ message: 'শেষের সময় অবশ্যই শুরুর সময়ের পরে হতে হবে' });
      }
      incomingSettings.schedule = { enabled: !!sch.enabled, startAt, endAt };
    }

    const updatedSettings = { ...exam.settings?.toObject(), ...incomingSettings };
    if (!updatedSettings.totalTimeMinutes || Number(updatedSettings.totalTimeMinutes) <= 0) {
      updatedSettings.totalTimeMinutes = 10;
    }
    
    exam.settings = updatedSettings;
    if (req.body.accessCode !== undefined) exam.accessCode = String(req.body.accessCode || '').trim();

    await exam.save();
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- ৫. Exam Publish করা ----------
exports.publishExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam পাওয়া যায়নি' });
    if (exam.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'অনুমতি নেই' });
    }

    if (exam.pending) {
      return res.status(400).json({ message: 'অসম্পূর্ণ (পেন্ডিং) পরীক্ষা চালু করা যাবে না। আগে পরীক্ষাটি সম্পূর্ণ করে তৈরি করো' });
    }

    const firstTimePublish = exam.status !== 'published';
    exam.status = 'published';
    await exam.save();

    // 🔔 প্রথমবার পাবলিশ হলে স্টুডেন্টদের নোটিফিকেশন (ব্যর্থ হলেও পাবলিশ আটকাবে না)
    if (firstTimePublish) {
      announceExamPublished(exam, req.user.id).catch((e) => console.error('exam announce failed:', e.message));
    }

    const baseUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;
    res.json({ exam, shareLink: `${baseUrl}/join/${exam.examCode}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- ৬. প্রশ্ন Edit / Delete / Add / Reorder ----------
exports.updateQuestion = async (req, res) => {
  try {
    const q = await Question.findById(req.params.questionId);
    if (!q) return res.status(404).json({ message: 'প্রশ্ন পাওয়া যায়নি' });

    const exam = await Exam.findById(q.exam);
    if (exam.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'অনুমতি নেই' });
    }

    Object.assign(q, req.body);
    await q.save();
    res.json(q);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const q = await Question.findById(req.params.questionId);
    if (!q) return res.status(404).json({ message: 'প্রশ্ন পাওয়া যায়নি' });

    const exam = await Exam.findById(q.exam);
    if (exam.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'অনুমতি নেই' });
    }

    await q.deleteOne();
    res.json({ message: 'প্রশ্ন ডিলিট হয়েছে' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addQuestion = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam পাওয়া যায়নি' });
    if (exam.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'অনুমতি নেই' });
    }

    const count = await Question.countDocuments({ exam: exam._id });
    const q = await Question.create({ ...req.body, exam: exam._id, order: count });
    res.status(201).json(q);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.reorderQuestions = async (req, res) => {
  try {
    const { orderList } = req.body;
    if (!Array.isArray(orderList)) {
      return res.status(400).json({ message: 'orderList অ্যারে হওয়া আবশ্যক' });
    }

    await Promise.all(
      orderList.map((item) => Question.findByIdAndUpdate(item.questionId, { order: item.order }))
    );
    res.json({ message: 'ক্রম আপডেট হয়েছে' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- ৭. রেজাল্ট এবং Attempt ডিটেইলস ----------
exports.getExamResults = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam পাওয়া যায়নি' });
    if (exam.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'অনুমতি নেই' });
    }

    if (exam.settings?.allowRepetition) {
      return res.json({
        disabled: true,
        message: 'Repetition অন করা আছে বলে এই পরীক্ষার রেজাল্ট ড্যাশবোর্ডে দেখানো হচ্ছে না। প্রতিটা স্টুডেন্ট পরীক্ষা শেষে নিজের রেজাল্ট দেখতে পাবে।',
      });
    }

    const attempts = await Attempt.find({ exam: exam._id }).sort({ obtainedMarks: -1 });
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAttemptDetails = async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.attemptId).populate('answers.question');
    if (!attempt) return res.status(404).json({ message: 'পাওয়া যায়নি' });

    const exam = await Exam.findById(attempt.exam);
    if (exam.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'অনুমতি নেই' });
    }

    res.json(attempt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- ৮. Excel এ Export ----------
exports.exportResultsExcel = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam পাওয়া যায়নি' });
    if (exam.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'অনুমতি নেই' });
    }

    const attempts = await Attempt.find({ exam: exam._id });
    const workbook = await generateResultExcel(exam, attempts, req.query.lang);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(exam.title)}-results.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- ৮.৫ শিক্ষকের নিজের তৈরি পরীক্ষার PDF ডাউনলোড ----------
// GET /exams/:id/pdf?answers=1  → উত্তরসহ (সঠিক অপশন চিহ্নিত + ব্যাখ্যা), না দিলে শুধু প্রশ্নপত্র
exports.downloadExamPdf = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Exam পাওয়া যায়নি' });
    const exam = await Exam.findById(req.params.id);
    if (!exam || exam.pending) return res.status(404).json({ message: 'Exam পাওয়া যায়নি' });
    if (exam.teacher.toString() !== req.user.id) return res.status(403).json({ message: 'অনুমতি নেই' });

    const withAnswers = ['1', 'true', 'yes'].includes(String(req.query.answers || '').toLowerCase());
    const questions = await Question.find({ exam: exam._id }).sort({ order: 1, createdAt: 1 });
    if (!questions.length) return res.status(400).json({ message: 'এই পরীক্ষায় এখনো কোনো প্রশ্ন নেই' });

    const st = exam.settings || {};
    const en = String(req.query.lang || '').toLowerCase() === 'en';
    const fileBase = `${exam.title}${withAnswers ? (en ? '-with-answers' : '-উত্তরসহ') : (en ? '-question-paper' : '-প্রশ্নপত্র')}`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="exam.pdf"; filename*=UTF-8''${encodeURIComponent(fileBase)}.pdf`);

    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
    doc.pipe(res);
    const fonts = registerFonts(doc);
    const W = (text, size, opts) => { doc.fontSize(size); writeText(doc, fonts, text, opts); };
    // মিশ্র-ফন্টের মাঝ-সারিবদ্ধ লাইন আঁকলে pdfkit-এর y এগোয় না, তাই লাইনের উচ্চতা ধরে নিজেই নামাই
    const WC = (text, size) => {
      const y = doc.y;
      W(text, size, { align: 'center' });
      doc.x = doc.page.margins.left;
      doc.y = y + size * 1.4;
    };

    // ---- শিরোনাম ও তথ্য ----
    doc.fillColor('black');
    WC(exam.title, 18);
    doc.moveDown(0.3);
    const meta = [
      en ? `Total questions: ${questions.length}` : `মোট প্রশ্ন: ${questions.length}`,
      en ? `Time: ${st.totalTimeMinutes ?? '-'} min` : `সময়: ${st.totalTimeMinutes ?? '-'} মিনিট`,
      en ? `Marks per question: ${st.marksPerQuestion ?? '-'}` : `প্রতি প্রশ্নে নম্বর: ${st.marksPerQuestion ?? '-'}`,
      st.negativeMarking?.enabled ? (en ? `Negative marking: ${st.negativeMarking.marksPerWrong}` : `ভুল উত্তরে কাটা: ${st.negativeMarking.marksPerWrong}`) : null,
    ].filter(Boolean).join('   |   ');
    doc.fillColor('#444444');
    WC(meta, 10);
    if (withAnswers) { doc.fillColor('#047857'); WC(en ? '(With answers — teacher copy)' : '(উত্তরসহ — শিক্ষকের কপি)', 10); }
    doc.fillColor('black').moveDown(0.5);
    const lineY = doc.y;
    doc.moveTo(40, lineY).lineTo(doc.page.width - 40, lineY).strokeColor('#cccccc').stroke();
    doc.moveDown(0.8);

    // ---- প্রশ্নসমূহ ----
    const bottomLimit = () => doc.page.height - doc.page.margins.bottom - 110;
    questions.forEach((q, idx) => {
      if (doc.y > bottomLimit()) doc.addPage(); // প্রশ্ন যেন পাতার একদম নিচে ভেঙে না যায়
      doc.fillColor('black');
      W(`${idx + 1}. ${q.questionText}`, 11.5);
      doc.moveDown(0.15);
      q.options.forEach((opt, i) => {
        const correct = withAnswers && i === q.correctOptionIndex;
        doc.fillColor(correct ? '#047857' : 'black');
        W(`      ${String.fromCharCode(65 + i)}. ${opt}${correct ? '  ✓' : ''}`, 10.5);
      });
      if (withAnswers && q.explanation) {
        doc.fillColor('#555555');
        W(`      ${en ? 'Explanation' : 'ব্যাখ্যা'}: ${q.explanation}`, 9.5);
      }
      doc.fillColor('black').moveDown(0.7);
    });

    // ---- উত্তরমালা (শুধু উত্তরসহ কপিতে, এক নজরে) ----
    if (withAnswers) {
      if (doc.y > bottomLimit()) doc.addPage();
      doc.moveDown(0.5);
      W(en ? 'Answer key' : 'উত্তরমালা', 13, { align: 'left' });
      doc.moveDown(0.3);
      const key = questions.map((q, i) => `${i + 1}-${String.fromCharCode(65 + q.correctOptionIndex)}`).join('    ');
      doc.fillColor('#047857');
      W(key, 10.5);
      doc.fillColor('black');
    }

    // ---- পৃষ্ঠা নম্বর ----
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      const prevBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0; // নিচের মার্জিনে লিখতে গেলে যেন নতুন পাতা না খোলে
      doc.font(fonts.latin).fontSize(9).fillColor('#888888')
        .text(`${i + 1} / ${range.count}`, 0, doc.page.height - 28, { width: doc.page.width, align: 'center', lineBreak: false });
      doc.page.margins.bottom = prevBottom;
    }
    doc.end();
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ message: err.message || 'PDF তৈরি করতে সমস্যা হয়েছে' });
    else res.end();
  }
};

// ---------- ৯. পাবলিক: এক্সাম কোড দিয়ে Exam এর তথ্য দেখা (Join পেজ) ----------
exports.getExamByCode = async (req, res) => {
  try {
    const exam = await Exam.findOne({ examCode: req.params.code }).populate('teacher', 'name');
    if (!exam) return res.status(404).json({ message: 'এই লিংকে কোনো পরীক্ষা পাওয়া যায়নি' });
    if (exam.status !== 'published') {
      return res.status(400).json({ message: 'পরীক্ষাটি এখনো চালু হয়নি অথবা বন্ধ হয়ে গেছে' });
    }

    const teacherSub = await getTeacherStatus(exam.teacher._id || exam.teacher);
    if (!teacherSub.isActive) {
      return res.status(403).json({ message: 'এই শিক্ষকের সাবস্ক্রিপশনের মেয়াদ শেষ, তাই পরীক্ষাটি এখন বন্ধ আছে' });
    }

    const schedule = exam.settings?.schedule;
    const isScheduleEnabled = schedule?.enabled !== undefined ? schedule.enabled : false;

    if (schedule && isScheduleEnabled) {
      const now = new Date();
      if (schedule.startAt && now < new Date(schedule.startAt)) {
        return res.status(400).json({ message: 'পরীক্ষা এখনো শুরু হয়নি' });
      }
      if (schedule.endAt && now > new Date(schedule.endAt)) {
        return res.status(400).json({ message: 'পরীক্ষার সময় শেষ হয়ে গেছে' });
      }
    }

    // ০ বা undefined যেন না যায় তার জন্য fallback সময়
    const rawTime = exam.settings?.totalTimeMinutes;
    const duration = rawTime && Number(rawTime) > 0 ? Number(rawTime) : 10;

    res.json({
      title: exam.title,
      examCode: exam.examCode,
      teacherName: exam.teacher?.name || '',
      requiresAccessCode: !!exam.accessCode,
      totalTimeMinutes: duration,
      settings: {
        ...exam.settings?.toObject(),
        totalTimeMinutes: duration,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- ১০. পুরো Exam ডিলিট করা ----------
exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam পাওয়া যায়নি' });
    if (exam.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'অনুমতি নেই' });
    }

    await Question.deleteMany({ exam: exam._id });
    await Attempt.deleteMany({ exam: exam._id });
    await Announcement.deleteMany({ exam: exam._id }); // পরীক্ষার নোটিফিকেশনও মুছে যাবে

    // ফাইল সেফলি ডিলিট
    if (exam.sourcePdfPath) safeDeleteFile(exam.sourcePdfPath);
    if (exam.resource?.pdfPath) safeDeleteFile(exam.resource.pdfPath);

    await exam.deleteOne();
    res.json({ message: 'পরীক্ষাটি সফলভাবে ডিলিট হয়েছে' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- ১১. অতিরিক্ত রিসোর্স (Google Drive লিংক বা PDF) সেট করা ----------
exports.setResourceLink = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam পাওয়া যায়নি' });
    if (exam.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'অনুমতি নেই' });
    }

    const { link } = req.body;
    if (!link) return res.status(400).json({ message: 'লিংক আবশ্যক' });

    if (exam.resource?.pdfPath) safeDeleteFile(exam.resource.pdfPath);

    exam.resource = { kind: 'link', link, pdfPath: undefined, pdfOriginalName: undefined };
    await exam.save();
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.setResourcePdf = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam পাওয়া যায়নি' });
    if (exam.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'অনুমতি নেই' });
    }
    if (!req.file) return res.status(400).json({ message: 'PDF ফাইল আবশ্যক' });

    if (exam.resource?.pdfPath) safeDeleteFile(exam.resource.pdfPath);

    exam.resource = {
      kind: 'pdf',
      pdfPath: req.file.path,
      pdfOriginalName: req.file.originalname,
      link: undefined,
    };
    await exam.save();
    res.json(exam);
  } catch (err) {
    if (req.file?.path) safeDeleteFile(req.file.path);
    res.status(500).json({ message: err.message });
  }
};

exports.removeResource = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam পাওয়া যায়নি' });
    if (exam.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'অনুমতি নেই' });
    }

    if (exam.resource?.pdfPath) safeDeleteFile(exam.resource.pdfPath);

    exam.resource = { kind: null, link: undefined, pdfPath: undefined, pdfOriginalName: undefined };
    await exam.save();
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- ১২. পাবলিক: সব পাবলিশ হওয়া পরীক্ষার তালিকা (Student Portal-এর জন্য) ----------
// 🔒 স্টুডেন্ট লগইন করা থাকলে শুধু তার যুক্ত করা (এক্সেস কোড দেওয়া) শিক্ষকদের পরীক্ষাই দেখাবে।
// লগইন করা না থাকলে বা টোকেন স্টুডেন্টের না হলে খালি লিস্ট + needsLogin ফ্ল্যাগ ফেরত যাবে।
exports.getPublicExams = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.json({ needsLogin: true, exams: [] });
    }

    const student = await User.findById(req.user.id).select('connectedTeachers connectedClasses bannedByTeachers');
    if (!student) {
      return res.json({ needsLogin: true, exams: [] });
    }

    const hasClasses = (student.connectedClasses || []).length > 0;
    const hasLegacyTeachers = (student.connectedTeachers || []).length > 0;
    if (!hasClasses && !hasLegacyTeachers) {
      return res.json({ needsLogin: false, needsAccessCode: true, exams: [] });
    }

    const now = new Date();
    const activeTeacherIds = await getActiveTeacherIds(); // 💳 মেয়াদ শেষ শিক্ষকের পরীক্ষা তালিকায় আসবে না

    // ১. শুধু যুক্ত থাকা শিক্ষকদের published পরীক্ষা তুলে নিয়ে আসা
    // 🎓 শুধু যেসব শ্রেণীর এক্সেস কোড যোগ করা আছে সেই শ্রেণীর পরীক্ষা (+ পুরনো শ্রেণীবিহীন পরীক্ষা, পুরনো শিক্ষক-কোড থাকলে)
    const publishedExams = await Exam.find({
      status: 'published',
      teacher: { $nin: student.bannedByTeachers || [], $in: activeTeacherIds }, // 🚫 ব্যান করা এবং 💳 মেয়াদ-শেষ শিক্ষকের পরীক্ষা দেখাবে না
      $or: [
        { classRefs: { $in: student.connectedClasses || [] } },
        {
          // শ্রেণীবিহীন পুরনো পরীক্ষা: শুধু পুরনো শিক্ষক-কোড দিয়ে যুক্ত স্টুডেন্টরা
          $or: [{ classRefs: { $exists: false } }, { classRefs: { $size: 0 } }],
          teacher: { $in: student.connectedTeachers || [] },
        },
      ],
    })
      .select('title examCode createdAt teacher classRefs settings.totalTimeMinutes settings.schedule')
      .populate('teacher', 'name')
      .populate('classRefs', 'name')
      .lean()
      .sort({ createdAt: -1 });

    // ২. JS ফিল্টারের মাধ্যমে শডিউল অ্যাক্টিভ আছে কিনা যাচাই করে ফিল্টার করা
    const validExams = publishedExams.filter((exam) => {
      const schedule = exam.settings?.schedule;

      if (!schedule || schedule.enabled === false) {
        return true;
      }

      if (schedule.startAt && now < new Date(schedule.startAt)) {
        return false;
      }
      if (schedule.endAt && now > new Date(schedule.endAt)) {
        return false;
      }

      return true;
    });

    // ৩. প্রতিটি এক্সামের জন্য মোট Attempt এবং ডিফল্ট টাইম ফিক্স করা
    const examsWithAttempts = await Promise.all(
      validExams.map(async (exam) => {
        const attemptCount = await Attempt.countDocuments({ exam: exam._id });
        const time = exam.settings?.totalTimeMinutes > 0 ? exam.settings.totalTimeMinutes : 10;
        const { teacher, classRefs, ...examRest } = exam;
        return {
          ...examRest,
          classNames: (classRefs || []).map((c) => c.name),
          teacherName: teacher?.name || '',
          settings: {
            ...exam.settings,
            totalTimeMinutes: time
          },
          attemptCount,
        };
      })
    );

    res.json({ needsLogin: false, exams: examsWithAttempts });
  } catch (err) {
    res.status(500).json({ message: 'পরীক্ষার তালিকা আনতে সমস্যা হয়েছে', error: err.message });
  }
};
