// ================== utils/pdfParser.js ==================
// PDF ফাইল থেকে বাংলা ও ইংরেজি টেক্সট বের করে MCQ পার্স করার সমাধান।

const fs = require('fs');
const pdfParse = require('pdf-parse');

/**
 * UTF-8 টেক্সট ক্লিন এবং নরমালাইজ করার ফাংশন
 */
function cleanText(str) {
  if (!str) return '';
  return str
    .replace(/\r/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // জিরো-উইডথ স্পেস দূর করা
    .replace(/\s+/g, ' ') // একাধিক স্পেস একসাথে থাকলে একটি করা
    .trim();
}

async function extractQuestionsFromPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  
  // UTF-8 এনকোডিং নিশ্চিত করতে pdf-parse এ বিকল্প পার্সার অপশন যুক্ত
  const pdfData = await pdfParse(dataBuffer);
  const rawText = pdfData.text;

  return parseMcqText(rawText);
}

function parseMcqText(rawText) {
  const simple = parseSimpleFormat(rawText);
  if (simple.length > 0) return simple;

  const detailed = parseDetailedFormat(rawText);
  if (detailed.length > 0) return detailed;

  return parseTableFormat(rawText);
}

// ---------- ফরম্যাট ৩: "(a) ... (b) ..." + প্রতি প্রশ্নের নিচেই "Answer: (x) ..." + ব্যাখ্যা ----------
function parseDetailedFormat(rawText) {
  const text = rawText.replace(/\r/g, '');
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^page\s+\d+\s+of\s+\d+$/i.test(l));

  const questionStartRegex = /^(\d{1,3})[\.\)]\s*(.+)/;
  const optionPairRegex = /\(([a-dA-D])\)\s*([^()]+?)(?=\s*\([a-dA-D]\)|$)/g;
  
  // উত্তর এবং ব্যাখ্যা খোঁজার জন্য রেগেক্স
  const answerLineRegex = /^(Answer|উত্তর)\s*[:\-]?\s*\(?([A-Da-d])\)?\s*(.*)/i;
  const explanationStartRegex = /^(ব্যাখ্যা|Explanation)\s*[:\-]?\s*(.*)/i;

  const rawQuestions = [];
  let current = null;
  let phase = null; // 'question' | 'options' | 'explanation'

  const pushCurrent = () => {
    if (current) rawQuestions.push(current);
  };

  for (const line of lines) {
    const qMatch = line.match(questionStartRegex);
    const aMatch = line.match(answerLineRegex);
    const expMatch = line.match(explanationStartRegex);
    const hasOptionPattern = /\([a-dA-D]\)\s*\S/.test(line);

    // নতুন প্রশ্ন শুরু
    if (qMatch && !aMatch && !expMatch) {
      pushCurrent();
      current = {
        num: parseInt(qMatch[1], 10),
        questionText: cleanText(qMatch[2].replace(/^"|"$/g, '')),
        optionsMap: {},
        explanationLines: [],
      };
      phase = 'question';
      continue;
    }

    if (!current) continue;

    // "Answer:" লাইন পাওয়া গেলে
    if (aMatch && phase !== 'explanation') {
      current.correctLetter = aMatch[2].toLowerCase();
      phase = 'explanation';
      
      // Answer এর লাইনে যদি ব্যাখ্যার অংশ থাকে
      if (aMatch[3] && aMatch[3].trim().length > 0) {
        const extraText = cleanText(aMatch[3].replace(/^(ব্যাখ্যা|Explanation)\s*[:\-]?/i, ''));
        if (extraText) current.explanationLines.push(extraText);
      }
      continue;
    }

    // আলাদা "ব্যাখ্যা:" লেখা থাকলে
    if (expMatch && phase !== 'explanation') {
      phase = 'explanation';
      if (expMatch[2]) current.explanationLines.push(cleanText(expMatch[2]));
      continue;
    }

    // ব্যাখ্যা ফেজ
    if (phase === 'explanation') {
      current.explanationLines.push(cleanText(line));
      continue;
    }

    // অপশন ফেজ
    if (hasOptionPattern) {
      let m;
      optionPairRegex.lastIndex = 0;
      while ((m = optionPairRegex.exec(line)) !== null) {
        const letter = m[1].toLowerCase();
        if (!current.optionsMap[letter]) {
          current.optionsMap[letter] = cleanText(m[2]);
        }
      }
      phase = 'options';
      continue;
    }

    if (phase === 'question') {
      current.questionText = cleanText(current.questionText + ' ' + line);
    }
  }
  pushCurrent();

  const letters = ['a', 'b', 'c', 'd'];
  const questions = [];

  for (const rq of rawQuestions) {
    const presentLetters = letters.filter((l) => rq.optionsMap[l]);
    if (presentLetters.length < 2 || !rq.correctLetter) continue;

    const correctOptionIndex = presentLetters.indexOf(rq.correctLetter);
    if (correctOptionIndex === -1) continue;

    const explanation = cleanText(rq.explanationLines.join(' '));

    questions.push({
      questionText: rq.questionText,
      options: presentLetters.map((l) => rq.optionsMap[l]),
      correctOptionIndex,
      explanation: explanation || undefined,
    });
  }

  return questions.map((q, idx) => ({ ...q, order: idx }));
}

// ---------- ফরম্যাট ১: সাধারণ ফরম্যাট ----------
function parseSimpleFormat(rawText) {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const questions = [];
  let current = null;

  const questionStartRegex = /^(\d+)[\.\)]\s*(.+)/;
  const optionRegex = /^([A-Da-d])[\.\)]\s*(.+)/;
  const answerRegex = /^(Answer|উত্তর)\s*[:\-]\s*([A-Da-d])/i;

  for (const line of lines) {
    const qMatch = line.match(questionStartRegex);
    const oMatch = line.match(optionRegex);
    const aMatch = line.match(answerRegex);

    if (qMatch && !oMatch) {
      if (current && current.options.length >= 2 && current.correctOptionIndex !== null) {
        questions.push(current);
      }
      current = { questionText: cleanText(qMatch[2]), options: [], correctOptionIndex: null };
    } else if (oMatch && current) {
      current.options.push(cleanText(oMatch[2]));
    } else if (aMatch && current) {
      const letter = aMatch[2].toUpperCase();
      current.correctOptionIndex = letter.charCodeAt(0) - 'A'.charCodeAt(0);
    } else if (current && current.options.length === 0 && !aMatch) {
      current.questionText = cleanText(current.questionText + ' ' + line);
    }
  }
  if (current && current.options.length >= 2 && current.correctOptionIndex !== null) {
    questions.push(current);
  }

  return questions.map((q, idx) => ({ ...q, order: idx }));
}

// ---------- ফরম্যাট ২: Answer Key টেবিল ----------
function parseTableFormat(rawText) {
  const text = rawText.replace(/\r/g, '');

  const answerKeyMatch = text.match(/(answer\s*key|উত্তরপত্র)/i);
  const questionsText = answerKeyMatch ? text.slice(0, answerKeyMatch.index) : text;
  const answerText = answerKeyMatch ? text.slice(answerKeyMatch.index) : '';

  const lines = questionsText
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^page\s+\d+\s+of\s+\d+$/i.test(l));

  const questionStartRegex = /^(\d{1,3})[\.\)]\s*(.+)/;
  const optionPairRegex = /\(([a-dA-D])\)\s*([^()]+?)(?=\s*\([a-dA-D]\)|$)/g;

  const rawQuestions = [];
  let current = null;

  for (const line of lines) {
    const qMatch = line.match(questionStartRegex);
    const hasOptions = /\([a-dA-D]\)/.test(line);

    if (qMatch && !hasOptions) {
      if (current) rawQuestions.push(current);
      current = {
        num: parseInt(qMatch[1], 10),
        questionText: cleanText(qMatch[2].replace(/^"|"$/g, '')),
        optionsMap: {},
      };
    } else if (hasOptions && current) {
      let m;
      optionPairRegex.lastIndex = 0;
      while ((m = optionPairRegex.exec(line)) !== null) {
        const letter = m[1].toLowerCase();
        current.optionsMap[letter] = cleanText(m[2]);
      }
    } else if (current && Object.keys(current.optionsMap).length === 0) {
      current.questionText = cleanText(current.questionText + ' ' + line);
    }
  }
  if (current) rawQuestions.push(current);

  const answerMap = {};
  const answerPairRegex = /(\d{1,3})\s*\(([a-dA-D])\)/g;
  let am;
  while ((am = answerPairRegex.exec(answerText)) !== null) {
    answerMap[parseInt(am[1], 10)] = am[2].toLowerCase();
  }

  const letters = ['a', 'b', 'c', 'd'];
  const questions = [];

  for (const rq of rawQuestions) {
    const presentLetters = letters.filter((l) => rq.optionsMap[l]);
    if (presentLetters.length < 2) continue;

    const correctLetter = answerMap[rq.num];
    if (!correctLetter) continue;

    const correctOptionIndex = presentLetters.indexOf(correctLetter);
    if (correctOptionIndex === -1) continue;

    questions.push({
      questionText: rq.questionText,
      options: presentLetters.map((l) => rq.optionsMap[l]),
      correctOptionIndex,
    });
  }

  return questions.map((q, idx) => ({ ...q, order: idx }));
}

module.exports = { extractQuestionsFromPdf, parseMcqText };
