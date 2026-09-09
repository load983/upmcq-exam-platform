// ================== controllers/attemptController.js ==================
// স্টুডেন্ট সাইডের এক্সাম দেয়া, উত্তর দেয়া এবং সাবমিট করার লজিক
const fs = require('fs');
const path = require('path');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const PDFDocument = require('pdfkit');

// লিস্ট এলোমেলো করার ছোট্ট হেল্পার (Fisher-Yates shuffle)
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- ১. Exam জয়েন করা (নাম/রোল/ফোন দিয়ে) ----------
exports.joinExam = async (req, res) => {
  try {
    const { examCode, studentName, studentRoll, studentPhone, accessCode } = req.body;

    const exam = await Exam.findOne({ examCode });
    if (!exam || exam.status !== 'published')
      return res.status(400).json({ message: 'পরীক্ষাটি খুঁজে পাওয়া যায়নি বা চালু নেই' });

    if (exam.accessCode && exam.accessCode !== accessCode)
      return res.status(401).json({ message: 'ভুল Access Code' });

    const allowRepetition = exam.settings.allowRepetition;

    if (!allowRepetition) {
      // আগে থেকেই Submit করা থাকলে আবার দেয়া যাবে না
      const existing = await Attempt.findOne({ exam: exam._id, studentRoll });
      if (existing && existing.status === 'submitted') {
        return res.status(400).json({ message: 'তুমি ইতিমধ্যে এই পরীক্ষা জমা দিয়েছো' });
      }
      if (existing && existing.status === 'in-progress') {
        const questions = await Question.find({ _id: { $in: existing.questionOrder } });
        return res.json(buildStudentExamPayload(exam, existing, questions));
      }
    } else {
      // Repetition অন থাকলে চলমান কোনো এটেম্পট থাকলে সেটা রিজিউম করাও, নাহলে নতুন করে শুরু করতে দাও
      const existingInProgress = await Attempt.findOne({ exam: exam._id, studentRoll, status: 'in-progress' });
      if (existingInProgress) {
        const questions = await Question.find({ _id: { $in: existingInProgress.questionOrder } });
        return res.json(buildStudentExamPayload(exam, existingInProgress, questions));
      }
    }

    let questions = await Question.find({ exam: exam._id }).sort({ order: 1 });

    // Total Questions to use সেটিং অনুযায়ী কতগুলো প্রশ্ন নেয়া হবে
    const limit = exam.settings.totalQuestionsToUse;
    if (limit && limit > 0 && limit < questions.length) {
      questions = shuffleArray(questions).slice(0, limit);
    }
    if (exam.settings.shuffleQuestions) {
      questions = shuffleArray(questions);
    }

    // অপশন শাফল হলে প্রতিটা প্রশ্নের জন্য একটা ম্যাপিং সেভ রাখা হয়
    const optionOrderMap = {};
    if (exam.settings.shuffleOptions) {
      questions.forEach((q) => {
        const indices = shuffleArray(q.options.map((_, i) => i));
        optionOrderMap[q._id.toString()] = indices;
      });
    }

    const attempt = await Attempt.create({
      exam: exam._id,
      studentName,
      studentRoll,
      studentPhone,
      ipAddress: req.ip,
      questionOrder: questions.map((q) => q._id),
      optionOrderMap,
      startedAt: new Date(),
      status: 'in-progress',
    });

    res.status(201).json(buildStudentExamPayload(exam, attempt, questions));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'তুমি ইতিমধ্যে এই পরীক্ষায় জয়েন করেছো' });
    }
    res.status(500).json({ message: err.message });
  }
};

// স্টুডেন্টকে যা পাঠানো হবে তাতে সঠিক উত্তর কখনোই থাকবে না
function buildStudentExamPayload(exam, attempt, questions) {
  const optionOrderMap = attempt.optionOrderMap || {};
  const safeQuestions = questions.map((q) => {
    const order = optionOrderMap[q._id.toString()];
    const options = order ? order.map((i) => q.options[i]) : q.options;
    return { _id: q._id, questionText: q.questionText, options };
  });

  return {
    attemptId: attempt._id,
    examTitle: exam.title,
    totalTimeMinutes: exam.settings.totalTimeMinutes,
    startedAt: attempt.startedAt,
    questions: safeQuestions,
  };
}

// ---------- ২. একটা প্রশ্নের উত্তর সেভ করা (প্রতিবার ক্লিকেই অটো-সেভ) ----------
exports.saveAnswer = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { questionId, selectedOptionIndex } = req.body;

    const attempt = await Attempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ message: 'Attempt পাওয়া যায়নি' });
    if (attempt.status === 'submitted')
      return res.status(400).json({ message: 'পরীক্ষা ইতিমধ্যে জমা হয়ে গেছে' });

    const orderMap = attempt.optionOrderMap?.[questionId];
    const originalIndex =
      orderMap && selectedOptionIndex !== null ? orderMap[selectedOptionIndex] : selectedOptionIndex;

    const existingAnswer = attempt.answers.find((a) => a.question.toString() === questionId);
    if (existingAnswer) {
      existingAnswer.selectedOptionIndex = originalIndex;
    } else {
      attempt.answers.push({ question: questionId, selectedOptionIndex: originalIndex });
    }
    await attempt.save();
    res.json({ message: 'সেভ হয়েছে' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- ৩. Submit (ম্যানুয়াল বা অটো) ----------
exports.submitAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { autoSubmitted } = req.body;

    const attempt = await Attempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ message: 'Attempt পাওয়া যায়নি' });

    const exam = await Exam.findById(attempt.exam);

    if (attempt.status === 'submitted')
      return res.json(await buildResultPayload(attempt, exam, exam.settings.showResultInstantly));

    const questions = await Question.find({ _id: { $in: attempt.questionOrder } });
    const qMap = {};
    questions.forEach((q) => (qMap[q._id.toString()] = q));

    let correct = 0,
      wrong = 0;
    const marksPerQ = exam.settings.marksPerQuestion;
    const negEnabled = exam.settings.negativeMarking.enabled;
    const negMarks = exam.settings.negativeMarking.marksPerWrong;

    attempt.questionOrder.forEach((qId) => {
      const q = qMap[qId.toString()];
      const ans = attempt.answers.find((a) => a.question.toString() === qId.toString());
      if (!ans || ans.selectedOptionIndex === null || ans.selectedOptionIndex === undefined) return;

      const isCorrect = ans.selectedOptionIndex === q.correctOptionIndex;
      ans.isCorrect = isCorrect;
      if (isCorrect) correct += 1;
      else wrong += 1;
    });

    const totalQ = attempt.questionOrder.length;
    const skipped = totalQ - correct - wrong;

    const obtainedMarks = correct * marksPerQ - (negEnabled ? wrong * negMarks : 0);

    attempt.totalCorrect = correct;
    attempt.totalWrong = wrong;
    attempt.totalSkipped = skipped;
    attempt.obtainedMarks = Math.round(obtainedMarks * 100) / 100;
    attempt.submittedAt = new Date();
    attempt.autoSubmitted = !!autoSubmitted;
    attempt.status = 'submitted';
    await attempt.save();

    res.json(await buildResultPayload(attempt, exam, exam.settings.showResultInstantly));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

async function buildResultPayload(attempt, exam, showInstantly = true) {
  const resource =
    exam?.resource?.kind === 'link'
      ? { kind: 'link', link: exam.resource.link }
      : exam?.resource?.kind === 'pdf'
      ? { kind: 'pdf', pdfName: exam.resource.pdfOriginalName }
      : null;

  return {
    attemptId: attempt._id,
    totalCorrect: attempt.totalCorrect,
    totalWrong: attempt.totalWrong,
    totalSkipped: attempt.totalSkipped,
    obtainedMarks: attempt.obtainedMarks,
    showInstantly,
    submittedAt: attempt.submittedAt,
    resource,
  };
}

// ---------- ৪. Result + সঠিক উত্তর সহ PDF ডাউনলোড ----------
exports.downloadResultPdf = async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.attemptId);
    if (!attempt || attempt.status !== 'submitted')
      return res.status(400).json({ message: 'পরীক্ষা এখনো জমা হয়নি' });

    const exam = await Exam.findById(attempt.exam);
    const questions = await Question.find({ _id: { $in: attempt.questionOrder } });
    const qMap = {};
    questions.forEach((q) => (qMap[q._id.toString()] = q));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=result-${attempt.studentRoll}.pdf`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    const fontPath = path.join(__dirname, '..', 'fonts', 'NotoSansBengali-Regular.ttf');
    if (fs.existsSync(fontPath)) {
      doc.registerFont('Bangla', fontPath);
      doc.font('Bangla');
    }

    doc.fontSize(18).text(exam.title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`নাম: ${attempt.studentName}   রোল: ${attempt.studentRoll}`);
    doc.text(
      `প্রাপ্ত নম্বর: ${attempt.obtainedMarks} | সঠিক: ${attempt.totalCorrect} | ভুল: ${attempt.totalWrong} | স্কিপ: ${attempt.totalSkipped}`
    );
    doc.moveDown();

    attempt.questionOrder.forEach((qId, idx) => {
      const q = qMap[qId.toString()];
      const ans = attempt.answers.find((a) => a.question.toString() === qId.toString());
      const correctLetter = String.fromCharCode(65 + q.correctOptionIndex);
      const studentLetter =
        ans && ans.selectedOptionIndex !== null && ans.selectedOptionIndex !== undefined
          ? String.fromCharCode(65 + ans.selectedOptionIndex)
          : 'স্কিপ';

      doc.moveDown(0.5);
      doc.fontSize(11).text(`${idx + 1}. ${q.questionText}`);
      q.options.forEach((opt, i) => {
        doc.fontSize(10).text(`   ${String.fromCharCode(65 + i)}. ${opt}`);
      });
      doc
        .fontSize(10)
        .fillColor(ans?.isCorrect ? 'green' : 'red')
        .text(`   তোমার উত্তর: ${studentLetter}  |  সঠিক উত্তর: ${correctLetter}`)
        .fillColor('black');
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- ৫. শিক্ষকের দেয়া অতিরিক্ত রিসোর্স PDF ডাউনলোড (Result পেজ থেকে) ----------
exports.downloadResourcePdf = async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.attemptId);
    if (!attempt || attempt.status !== 'submitted')
      return res.status(400).json({ message: 'পরীক্ষা এখনো জমা হয়নি' });

    const exam = await Exam.findById(attempt.exam);
    if (!exam?.resource || exam.resource.kind !== 'pdf' || !exam.resource.pdfPath) {
      return res.status(404).json({ message: 'কোনো PDF পাওয়া যায়নি' });
    }
    if (!fs.existsSync(exam.resource.pdfPath)) {
      return res.status(404).json({ message: 'PDF ফাইলটি সার্ভারে খুঁজে পাওয়া যায়নি' });
    }

    res.download(exam.resource.pdfPath, exam.resource.pdfOriginalName || 'resource.pdf');
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- ৬. প্রশ্ন-ভিত্তিক বিস্তারিত রিভিউ (রেজাল্ট পেজে All/Correct/Wrong/Skipped ফিল্টারের জন্য) ----------
exports.getAttemptReview = async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.attemptId);
    if (!attempt || attempt.status !== 'submitted')
      return res.status(400).json({ message: 'পরীক্ষা এখনো জমা হয়নি' });

    const exam = await Exam.findById(attempt.exam);
    const questions = await Question.find({ _id: { $in: attempt.questionOrder } });
    const qMap = {};
    questions.forEach((q) => (qMap[q._id.toString()] = q));

    const items = attempt.questionOrder.map((qId, idx) => {
      const q = qMap[qId.toString()];
      const ans = attempt.answers.find((a) => a.question.toString() === qId.toString());
      const selectedOptionIndex =
        ans && ans.selectedOptionIndex !== null && ans.selectedOptionIndex !== undefined
          ? ans.selectedOptionIndex
          : null;

      return {
        serial: idx + 1,
        questionText: q.questionText,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        selectedOptionIndex,
        status: selectedOptionIndex === null ? 'skipped' : ans.isCorrect ? 'correct' : 'wrong',
        explanation: q.explanation || null,
      };
    });

    res.json({ examTitle: exam.title, items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
