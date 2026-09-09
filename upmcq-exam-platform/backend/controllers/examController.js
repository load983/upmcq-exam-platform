// ================== controllers/examController.js ==================
const fs = require('fs');
const path = require('path');
const crypto = require('crypto'); // 💡 nanoid-এর ESM কনফ্লিক্ট এড়াতে Node.js বিল্ট-ইন crypto
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const { extractQuestionsFromPdf } = require('../utils/pdfParser');
const { generateResultExcel } = require('../utils/excelExport');

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

// ---------- ১. PDF আপলোড করে নতুন Exam তৈরি করা ----------
exports.uploadExamPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'PDF ফাইল আবশ্যক' });
    }

    const title = req.body.title || req.file.originalname.replace(/\.pdf$/i, '');
    
    // PDF থেকে প্রশ্ন পার্স করা (File path অথবা Buffer উভয়ই সাপোর্ট করবে)
    const pdfSource = req.file.path || req.file.buffer;
    const parsedQuestions = await extractQuestionsFromPdf(pdfSource);

    if (!parsedQuestions || parsedQuestions.length === 0) {
      if (req.file.path) safeDeleteFile(req.file.path);
      return res.status(400).json({
        message:
          'PDF থেকে কোনো প্রশ্ন পার্স করা যায়নি। ফরম্যাট চেক করো: "1. প্রশ্ন? A. ... B. ... C. ... D. ... Answer: C"',
      });
    }

    const examCode = generateExamCode();

    const exam = await Exam.create({
      teacher: req.user.id,
      title,
      sourcePdfPath: req.file.path || null,
      examCode,
      status: 'draft',
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
    res.status(500).json({ message: err.message || 'PDF আপলোড করতে সমস্যা হয়েছে' });
  }
};

// ---------- ২. Teacher এর সব Exam লিস্ট ----------
exports.getMyExams = async (req, res) => {
  try {
    const exams = await Exam.find({ teacher: req.user.id }).sort({ createdAt: -1 });
    res.json(exams);
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
    exam.settings = { ...exam.settings?.toObject(), ...req.body.settings };
    if (req.body.accessCode !== undefined) exam.accessCode = req.body.accessCode;

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

    exam.status = 'published';
    await exam.save();

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
    const workbook = await generateResultExcel(exam, attempts);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(exam.title)}-results.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- ৯. পাবলিক: এক্সাম কোড দিয়ে Exam এর তথ্য দেখা (Join পেজ) ----------
exports.getExamByCode = async (req, res) => {
  try {
    const exam = await Exam.findOne({ examCode: req.params.code });
    if (!exam) return res.status(404).json({ message: 'এই লিংকে কোনো পরীক্ষা পাওয়া যায়নি' });
    if (exam.status !== 'published') {
      return res.status(400).json({ message: 'পরীক্ষাটি এখনো চালু হয়নি অথবা বন্ধ হয়ে গেছে' });
    }

    const schedule = exam.settings?.schedule;
    if (schedule?.enabled) {
      const now = new Date();
      if (schedule.startAt && now < new Date(schedule.startAt)) {
        return res.status(400).json({ message: 'পরীক্ষা এখনো শুরু হয়নি' });
      }
      if (schedule.endAt && now > new Date(schedule.endAt)) {
        return res.status(400).json({ message: 'পরীক্ষার সময় শেষ হয়ে গেছে' });
      }
    }

    res.json({
      title: exam.title,
      examCode: exam.examCode,
      requiresAccessCode: !!exam.accessCode,
      totalTimeMinutes: exam.settings?.totalTimeMinutes || 0,
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
