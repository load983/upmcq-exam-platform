// ================== utils/excelExport.js ==================
// রেজাল্ট Excel ফাইলে Export করার হেল্পার ফাংশন (exceljs ব্যবহার করে)
const ExcelJS = require('exceljs');

async function generateResultExcel(exam, attempts) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Results');

  sheet.columns = [
    { header: 'নাম', key: 'name', width: 25 },
    { header: 'রোল', key: 'roll', width: 15 },
    { header: 'ফোন', key: 'phone', width: 15 },
    { header: 'IP Address', key: 'ip', width: 18 },
    { header: 'সঠিক', key: 'correct', width: 10 },
    { header: 'ভুল', key: 'wrong', width: 10 },
    { header: 'স্কিপ', key: 'skipped', width: 10 },
    { header: 'প্রাপ্ত নম্বর', key: 'marks', width: 12 },
    { header: 'শুরুর সময়', key: 'started', width: 20 },
    { header: 'জমা দেয়ার সময়', key: 'submitted', width: 20 },
    { header: 'স্ট্যাটাস', key: 'status', width: 15 },
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

module.exports = { generateResultExcel };
