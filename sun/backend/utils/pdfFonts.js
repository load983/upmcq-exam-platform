// ================== utils/pdfFonts.js ==================
// রেজাল্ট PDF-এ মিশ্র লেখা (বাংলা + ইংরেজি + সূত্র) ঠিকভাবে আঁকার সহায়ক।
// সমস্যা: বাংলা ফন্টে ইংরেজি অক্ষর, ₂ ² √ π ≤ → ইত্যাদি নেই, তাই আগে এগুলো ফাঁকা আসত।
// সমাধান: বাংলা অংশ Bangla ফন্টে, বাকি সব DejaVu Sans ফন্টে আঁকা হয়।
// LaTeX ($\frac{a}{b}$, $\ce{H2O}$) আগে পড়ার মতো ইউনিকোড লেখায় (a/b, H₂O) বদলানো হয়।
const fs = require('fs');
const path = require('path');
const { latexToPlain } = require('./mathText');

const FONT_DIR = path.join(__dirname, '..', 'fonts');
const BANGLA_FILE = path.join(FONT_DIR, 'N2otoSansBengali-Regular.ttf');
const LATIN_FILE = path.join(FONT_DIR, 'DejaVuSans.ttf');

// বাংলা ব্লক, দাঁড়ি (।), এবং শেপিং-এর জন্য ZWJ/ZWNJ বাংলা ফন্টে যাবে
const BN_CHAR = /[\u0980-\u09FF\u0964\u0965\u200c\u200d]/;

function registerFonts(doc) {
  const hasBn = fs.existsSync(BANGLA_FILE);
  const hasLatin = fs.existsSync(LATIN_FILE);
  if (hasBn) doc.registerFont('Bangla', BANGLA_FILE);
  if (hasLatin) doc.registerFont('Latin', LATIN_FILE);
  return { bangla: hasBn ? 'Bangla' : 'Helvetica', latin: hasLatin ? 'Latin' : hasBn ? 'Bangla' : 'Helvetica' };
}

/** লেখাকে (বাংলা / অন্য) রানে ভাগ করা */
function splitRuns(text) {
  const runs = [];
  for (const ch of text) {
    const isBn = BN_CHAR.test(ch);
    const last = runs[runs.length - 1];
    // স্পেস ও ZW চিহ্ন আগের রানের সাথেই থাকে যাতে অকারণে ফন্ট না বদলায়
    if (last && (last.bn === isBn || /\s/.test(ch))) last.text += ch;
    else runs.push({ bn: isBn, text: ch });
  }
  return runs;
}

/**
 * doc.text এর মতো, কিন্তু মিশ্র ফন্টে আঁকে। options: pdfkit এর text options (align, width ...)।
 * LaTeX থাকলে আগে সাধারণ ইউনিকোডে বদলানো হয়।
 */
function writeText(doc, fonts, raw, options = {}) {
  const text = latexToPlain(String(raw ?? '')).replace(/\u0000/g, '');
  const runs = splitRuns(text);
  if (!runs.length) { doc.text('', options); return; }
  const fontOf = (r) => (r.bn ? fonts.bangla : fonts.latin);
  const align = options.align;

  // মাঝ/ডান-সারিবদ্ধ লেখা একাধিক ফন্টে ভাঙলে pdfkit প্রতিটি অংশ আলাদা করে সারিবদ্ধ করে ফেলে (ওপর-নিচ মিশে যায়)।
  // তাই মোট প্রস্থ মেপে নিজেই শুরুর x ঠিক করে বাম-সারিতে আঁকি।
  if (runs.length > 1 && (align === 'center' || align === 'right')) {
    const startX = doc.x;
    const y = doc.y;
    const avail = options.width || doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const total = runs.reduce((w, r) => w + doc.font(fontOf(r)).widthOfString(r.text), 0);
    const offset = Math.max(0, align === 'center' ? (avail - total) / 2 : avail - total);
    const { align: _a, ...rest } = options;
    runs.forEach((r, i) => {
      const more = i < runs.length - 1;
      const f = doc.font(fontOf(r));
      if (i === 0) f.text(r.text, startX + offset, y, { ...rest, lineBreak: false, continued: more });
      else f.text(r.text, { ...rest, lineBreak: false, continued: more });
    });
    doc.x = startX;
    return;
  }

  runs.forEach((r, i) => {
    doc.font(fontOf(r)).text(r.text, { ...options, continued: i < runs.length - 1 });
  });
}

module.exports = { registerFonts, writeText, splitRuns };
