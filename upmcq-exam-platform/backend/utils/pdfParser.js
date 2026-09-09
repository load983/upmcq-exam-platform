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
  return parseTableFormat(rawText);
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
