// ================== utils/pdfParser.js ==================
const fs = require('fs');
const pdfParse = require('pdf-parse');

/**
 * UTF-8 টেক্সট ক্লিন এবং নরমালাইজ করার ফাংশন
 */
function cleanText(str) {
  if (!str) return '';
  return str
    .replace(/\r/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // জিরো-উইডথ স্পেস সরানো
    .replace(/[=‡7]/g, '')               // এনকোডিং ভুলের কারণে আসা বাজে চিহ্ন
    .replace(/\s+/g, ' ')                // একাধিক স্পেস ক্লিন করা
    .trim();
}

/**
 * PDF থেকে টেক্সট এক্সট্র্যাক্ট করার মূল ফাংশন (File path বা Buffer দুটোই সাপোর্ট করবে)
 */
async function extractQuestionsFromPdf(pdfSource) {
  let dataBuffer;

  if (Buffer.isBuffer(pdfSource)) {
    dataBuffer = pdfSource;
  } else if (typeof pdfSource === 'string') {
    dataBuffer = fs.readFileSync(pdfSource);
  } else {
    throw new Error('অবৈধ PDF সোর্স দেওয়া হয়েছে');
  }

  const pdfData = await pdfParse(dataBuffer);
  return parseMcqText(pdfData.text);
}

function parseMcqText(rawText) {
  const detailed = parseDetailedFormat(rawText);
  if (detailed.length > 0) return detailed;

  const simple = parseSimpleFormat(rawText);
  if (simple.length > 0) return simple;

  return parseTableFormat(rawText);
}

// ---------- ১. Detailed Format (প্রশ্ন, অপশন, উত্তর ও ব্যাখ্যা) ----------
function parseDetailedFormat(rawText) {
  const text = rawText.replace(/\r/g, '');
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^page\s+\d+\s+of\s+\d+$/i.test(l));

  const questionStartRegex = /^(\d{1,3})[\.\)]\s*(.+)/;
  const optionPairRegex = /\(([a-dA-D])\)\s*([^()]+?)(?=\s*\([a-dA-D]\)|$)/g;
  
  const answerLineRegex = /^(Answer|উত্তর)\s*[:\-]?\s*\(?([A-Da-d])\)?\s*(.*)/i;
  const explanationStartRegex = /^(ব্যাখ্যা|Explanation)\s*[:\-]?\s*(.*)/i;

  const rawQuestions = [];
  let current = null;
  let phase = null;

  const pushCurrent = () => {
    if (current) rawQuestions.push(current);
  };

  for (const line of lines) {
    const qMatch = line.match(questionStartRegex);
    const aMatch = line.match(answerLineRegex);
    const expMatch = line.match(explanationStartRegex);
    const hasOptionPattern = /\([a-dA-D]\)\s*\S/.test(line);

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

    if (aMatch && phase !== 'explanation') {
      current.correctLetter = aMatch[2].toLowerCase();
      phase = 'explanation';
      
      if (aMatch[3] && aMatch[3].trim().length > 0) {
        let textAfterAns = aMatch[3].replace(/^(ব্যাখ্যা|Explanation)\s*[:\-]?/i, '').trim();
        if (textAfterAns) {
          current.explanationLines.push(cleanText(textAfterAns));
        }
      }
      continue;
    }

    if (expMatch && phase !== 'explanation') {
      phase = 'explanation';
      if (expMatch[2]) {
        let cleanExp = expMatch[2].replace(/^(ব্যাখ্যা|Explanation)\s*[:\-]?/i, '').trim();
        if (cleanExp) current.explanationLines.push(cleanText(cleanExp));
      }
      continue;
    }

    if (phase === 'explanation') {
      let lineText = line.replace(/^(ব্যাখ্যা|Explanation)\s*[:\-]?/i, '').trim();
      if (lineText) current.explanationLines.push(cleanText(lineText));
      continue;
    }

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

    let explanation = cleanText(rq.explanationLines.join(' '));
    explanation = explanation.replace(/^(ব্যাখ্যা\s*:\s*)+/i, '');

    questions.push({
      questionText: rq.questionText,
      options: presentLetters.map((l) => rq.optionsMap[l]),
      correctOptionIndex,
      explanation: explanation || undefined,
    });
  }

  return questions.map((q, idx) => ({ ...q, order: idx }));
}

// ---------- ২. Simple Format (ফিক্স করা হয়েছে: একই লাইনে একাধিক অপশন থাকলেও আলাদা করে ধরবে) ----------
function parseSimpleFormat(rawText) {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const questions = [];
  let current = null;

  const questionStartRegex = /^(\d+)[\.\)]\s*(.+)/;
  const answerRegex = /^(Answer|উত্তর)\s*[:\-]\s*([A-Da-d])/i;
  // একই লাইনে একাধিক অপশন (A. ... B. ...) থাকলেও আলাদা করে ধরার জন্য
  const inlineOptionsRegex = /([A-Da-d])[\.\)]\s*([^]*?)(?=\s*[A-Da-d][\.\)]\s*\S|$)/g;

  for (const line of lines) {
    const qMatch = line.match(questionStartRegex);
    const aMatch = line.match(answerRegex);

    const optionMatches = [...line.matchAll(inlineOptionsRegex)]
      .map((m) => cleanText(m[2]))
      .filter((t) => t.length > 0);
    const looksLikeOptions = /^[A-Da-d][\.\)]/.test(line) && optionMatches.length > 0;

    if (qMatch && !looksLikeOptions) {
      if (current && current.options.length >= 2 && current.correctOptionIndex !== null) {
        questions.push(current);
      }
      current = { questionText: cleanText(qMatch[2]), options: [], correctOptionIndex: null };
    } else if (looksLikeOptions && current) {
      current.options.push(...optionMatches);
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

// ---------- ৩. Table Format (Answer Key আলাদা থাকলে) ----------
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

// ৪. মডিউল এক্সপোর্ট (অবশ্যই নাম মিলিয়ে এক্সপোর্ট করা হয়েছে)
module.exports = {
  extractQuestionsFromPdf,
  parseMcqText,
};
