// ================== utils/pdfParser.js (Updated Clean Text & Regex) ==================

/**
 * Bijoy/ANSI বা কোনো বাজে এনকোডিংয়ের কারণে আসা ভাঙা চিহ্ন ও ক্যারেক্টার ক্লিন করার ফাংশন
 */
function cleanText(str) {
  if (!str) return '';
  return str
    .replace(/\r/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // জিরো-উইডথ ক্যারেক্টার সরানো
    .replace(/[=‡7]/g, '')               // এনকোডিং ভুলের জন্য আসা বাজে চিহ্ন (=, ‡, 7) রিমুভ
    .replace(/\s+/g, ' ')                // অতিরিক্ত স্পেস ক্লিন করা
    .trim();
}

function parseDetailedFormat(rawText) {
  const text = rawText.replace(/\r/g, '');
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^page\s+\d+\s+of\s+\d+$/i.test(l));

  const questionStartRegex = /^(\d{1,3})[\.\)]\s*(.+)/;
  const optionPairRegex = /\(([a-dA-D])\)\s*([^()]+?)(?=\s*\([a-dA-D]\)|$)/g;
  
  // উত্তর এবং ব্যাখ্যা খোঁজার পরিমার্জিত রেগেক্স
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

    // "Answer: (x) option_text" অংশ থেকে শুধু ব্যাখ্যার শুদ্ধ পাঠ বের করা
    if (aMatch && phase !== 'explanation') {
      current.correctLetter = aMatch[2].toLowerCase();
      phase = 'explanation';
      
      // Answer লাইনের পর কোনো টেক্সট থাকলে (ডুপ্লিকেট "ব্যাখ্যা:" লেখা রিমুভ করা)
      if (aMatch[3] && aMatch[3].trim().length > 0) {
        let textAfterAns = aMatch[3].replace(/^(ব্যাখ্যা|Explanation)\s*[:\-]?/i, '').trim();
        // যদি উত্তরের লেখা আর ব্যাখ্যার শুরুর লেখা একই হয়ে ডুপ্লিকেট হয়
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
      // ব্যাখ্যার ভেতরে "ব্যাখ্যা:" শব্দ রিডানড্যান্ট থাকলে কেটে ফেলা
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

    // ডুপ্লিকেট শব্দ এবং অতিরিক্ত স্পেস মুছে ব্যাখ্যা তৈরি
    let explanation = cleanText(rq.explanationLines.join(' '));
    explanation = explanation.replace(/^(ব্যাখ্যা\s*:\s*)+/i, ''); // বারবার 'ব্যাখ্যা:' আসা বন্ধ করবে

    questions.push({
      questionText: rq.questionText,
      options: presentLetters.map((l) => rq.optionsMap[l]),
      correctOptionIndex,
      explanation: explanation || undefined,
    });
  }

  return questions.map((q, idx) => ({ ...q, order: idx }));
}
