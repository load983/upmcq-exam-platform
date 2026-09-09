// ================== utils/pdfParser.js ==================
// PDF ফাইল থেকে টেক্সট বের করে MCQ প্রশ্ন-উত্তর পার্স করার ফাংশন।
// এটা দুইটা ফরম্যাট সাপোর্ট করে:
//
// ফরম্যাট ১ (সাধারণ):
//   1. প্রশ্ন লেখা?
//   A. অপশন এক
//   B. অপশন দুই
//   Answer: A
//
// ফরম্যাট ২ (প্রশ্নব্যাংক স্টাইল, উত্তর শেষে আলাদা টেবিলে):
//   01. "প্রশ্ন লেখা?"
//   (a) অপশন এক        (b) অপশন দুই
//   (c) অপশন তিন        (d) অপশন চার
//   ...
//   Answer Key
//   01 (c) 02 (b) 03 (a) ...
const fs = require('fs');
const pdfParse = require('pdf-parse');

async function extractQuestionsFromPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
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

// ---------- ফরম্যাট ৩: "(a) ... (b) ..." + প্রতি প্রশ্নের নিচেই "Answer: (x) ..." + ব্যাখ্যা প্যারাগ্রাফ ----------
// উদাহরণ:
//   01. "I — him for a long time."
//   (a) know          (b) am knowing
//   (c) have known    (d) knew
//   Answer: (c) have known
//   ব্যাখ্যা: ... (পরের প্রশ্ন নম্বর না আসা পর্যন্ত যা কিছু আসে, সব ব্যাখ্যা হিসেবে ধরা হয়)
function parseDetailedFormat(rawText) {
  const text = rawText.replace(/\r/g, '');
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^page\s+\d+\s+of\s+\d+$/i.test(l));

  const questionStartRegex = /^(\d{1,3})[\.\)]\s*(.+)/;
  const optionPairRegex = /\(([a-dA-D])\)\s*([^()]+?)(?=\s*\([a-dA-D]\)|$)/g;
  const answerLineRegex = /^Answer\s*[:\-]?\s*\(?([A-Da-d])\)?/i;

  const rawQuestions = [];
  let current = null;
  let phase = null; // 'question' | 'options' | 'explanation'

  const pushCurrent = () => {
    if (current) rawQuestions.push(current);
  };

  for (const line of lines) {
    const qMatch = line.match(questionStartRegex);
    const aMatch = line.match(answerLineRegex);
    const hasOptionPattern = /\([a-dA-D]\)\s*\S/.test(line);

    // নতুন প্রশ্ন শুরু (তবে "Answer:" লাইনকে ভুলে নতুন প্রশ্ন ধরা যাবে না)
    if (qMatch && !aMatch) {
      pushCurrent();
      current = {
        num: parseInt(qMatch[1], 10),
        questionText: qMatch[2].trim().replace(/^"|"$/g, ''),
        optionsMap: {},
        explanationLines: [],
      };
      phase = 'question';
      continue;
    }

    if (!current) continue;

    // "Answer: (x) ..." লাইন পাওয়া মাত্র এখন থেকে ব্যাখ্যা-ফেজ শুরু
    if (aMatch && phase !== 'explanation') {
      current.correctLetter = aMatch[1].toLowerCase();
      phase = 'explanation';
      continue;
    }

    // ব্যাখ্যা-ফেজে থাকলে, পরের প্রশ্ন না আসা পর্যন্ত সবকিছু ব্যাখ্যা হিসেবে জমা হবে
    // (ব্যাখ্যার ভিতরে "(c)" এর মতো রেফারেন্স থাকলেও সেটা অপশন হিসেবে ভুল করে ধরা হবে না)
    if (phase === 'explanation') {
      current.explanationLines.push(line);
      continue;
    }

    if (hasOptionPattern) {
      let m;
      optionPairRegex.lastIndex = 0;
      while ((m = optionPairRegex.exec(line)) !== null) {
        const letter = m[1].toLowerCase();
        if (!current.optionsMap[letter]) current.optionsMap[letter] = m[2].trim();
      }
      phase = 'options';
      continue;
    }

    if (phase === 'question') {
      current.questionText += ' ' + line;
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

    const explanation = rq.explanationLines.join(' ').trim();

    questions.push({
      questionText: rq.questionText,
      options: presentLetters.map((l) => rq.optionsMap[l]),
      correctOptionIndex,
      explanation: explanation || undefined,
    });
  }

  return questions.map((q, idx) => ({ ...q, order: idx }));
}

// ---------- ফরম্যাট ১: প্রতি প্রশ্নের নিচে "Answer: X" ----------
function parseSimpleFormat(rawText) {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const questions = [];
  let current = null;

  const questionStartRegex = /^(\d+)[\.\)]\s*(.+)/;
  const optionRegex = /^([A-Da-d])[\.\)]\s*(.+)/;
  const answerRegex = /^Answer\s*[:\-]\s*([A-Da-d])/i;

  for (const line of lines) {
    const qMatch = line.match(questionStartRegex);
    const oMatch = line.match(optionRegex);
    const aMatch = line.match(answerRegex);

    if (qMatch && !oMatch) {
      if (current && current.options.length >= 2 && current.correctOptionIndex !== null) {
        questions.push(current);
      }
      current = { questionText: qMatch[2].trim(), options: [], correctOptionIndex: null };
    } else if (oMatch && current) {
      current.options.push(oMatch[2].trim());
    } else if (aMatch && current) {
      const letter = aMatch[1].toUpperCase();
      current.correctOptionIndex = letter.charCodeAt(0) - 'A'.charCodeAt(0);
    } else if (current && current.options.length === 0 && !aMatch) {
      current.questionText += ' ' + line;
    }
  }
  if (current && current.options.length >= 2 && current.correctOptionIndex !== null) {
    questions.push(current);
  }

  return questions.map((q, idx) => ({ ...q, order: idx }));
}

// ---------- ফরম্যাট ২: "(a) ... (b) ..." + শেষে Answer Key টেবিল ----------
function parseTableFormat(rawText) {
  const text = rawText.replace(/\r/g, '');

  const answerKeyMatch = text.match(/answer\s*key/i);
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
        questionText: qMatch[2].trim().replace(/^"|"$/g, ''),
        optionsMap: {},
      };
    } else if (hasOptions && current) {
      let m;
      optionPairRegex.lastIndex = 0;
      while ((m = optionPairRegex.exec(line)) !== null) {
        const letter = m[1].toLowerCase();
        current.optionsMap[letter] = m[2].trim();
      }
    } else if (current && Object.keys(current.optionsMap).length === 0) {
      current.questionText += ' ' + line;
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
