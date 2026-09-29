// ================== utils/pdfLayout.js ==================
// pdf-parse-এর ডিফল্ট রেন্ডারার লেখা সমতল করে ফেলে: H₂O হয়ে যায় "H2O", x² হয়ে যায় "x2",
// ভগ্নাংশ ভেঙে যায়। এই মডিউল প্রতিটি অক্ষরের অবস্থান ও ফন্ট-সাইজ দেখে PDF যেভাবে সাজানো
// ঠিক সেভাবে সাব/সুপারস্ক্রিপ্ট ও ভগ্নাংশ শনাক্ত করে (সেন্টিনেল চিহ্ন দিয়ে; পরে mathText.js LaTeX বানায়)।
const { UP_O, UP_C, DN_O, DN_C, SPC, RAW_O, RAW_C, mathInner } = require('./mathText');

let OPS = null;
try {
  const PDFJS = require('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js');
  OPS = PDFJS.OPS;
  // Node-এ ব্রাউজারের `document` নেই; ফন্ট-লোডার বন্ধ না করলে getOperatorList() পরে অ্যাসিঙ্ক ক্র্যাশ করে।
  // pdf.js সেটিংস পড়ে global.PDFJS থেকে (require-এর এক্সপোর্ট থেকে নয়)।
  globalThis.PDFJS = globalThis.PDFJS || {};
  globalThis.PDFJS.disableFontFace = true;
} catch (e) {
  OPS = null;
}

// ---------- ভগ্নাংশের দাগ (ছোট আড়াআড়ি রেখা/আয়তক্ষেত্র) খোঁজা ----------
const applyM = (t, x, y) => [t[0] * x + t[2] * y + t[4], t[1] * x + t[3] * y + t[5]];
// M প্রথমে, তারপর C (PDF-এর row-vector নিয়ম)
const compose = (M, C) => [
  M[0] * C[0] + M[1] * C[2], M[0] * C[1] + M[1] * C[3],
  M[2] * C[0] + M[3] * C[2], M[2] * C[1] + M[3] * C[3],
  M[4] * C[0] + M[5] * C[2] + C[4], M[4] * C[1] + M[5] * C[3] + C[5],
];

function extractBars(opList) {
  if (!OPS || !opList) return [];
  const bars = [];
  let ctm = [1, 0, 0, 1, 0, 0];
  const stack = [];
  const { fnArray, argsArray } = opList;
  const paint = new Set([OPS.stroke, OPS.closeStroke, OPS.fill, OPS.eoFill, OPS.fillStroke, OPS.eoFillStroke, OPS.closeFillStroke, OPS.closeEOFillStroke]);
  let path = []; // { type:'rect'|'line', pts }

  const addBar = (x0, x1, y0, y1) => {
    const h = Math.abs(y1 - y0);
    const w = Math.abs(x1 - x0);
    if (h <= 2 && w >= 4) bars.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), y: (y0 + y1) / 2 });
  };

  for (let i = 0; i < fnArray.length; i++) {
    const fn = fnArray[i];
    const args = argsArray[i];
    if (fn === OPS.save) stack.push(ctm.slice());
    else if (fn === OPS.restore) ctm = stack.pop() || ctm;
    else if (fn === OPS.transform) ctm = compose(args, ctm);
    else if (fn === OPS.constructPath) {
      const [ops, coords] = args;
      let k = 0;
      let cur = null;
      for (const op of ops) {
        if (op === OPS.rectangle) {
          const [x, y, w, h] = [coords[k], coords[k + 1], coords[k + 2], coords[k + 3]];
          k += 4;
          path.push({ type: 'rect', pts: [applyM(ctm, x, y), applyM(ctm, x + w, y + h)] });
        } else if (op === OPS.moveTo) { cur = applyM(ctm, coords[k], coords[k + 1]); k += 2; }
        else if (op === OPS.lineTo) {
          const p = applyM(ctm, coords[k], coords[k + 1]); k += 2;
          if (cur) path.push({ type: 'line', pts: [cur, p] });
          cur = p;
        } else if (op === OPS.curveTo) k += 6;
        else if (op === OPS.curveTo2 || op === OPS.curveTo3) k += 4;
      }
    } else if (paint.has(fn)) {
      for (const seg of path) {
        const [a, b] = seg.pts;
        if (seg.type === 'rect') addBar(a[0], b[0], a[1], b[1]);
        else if (Math.abs(a[1] - b[1]) < 0.6) addBar(a[0], b[0], a[1], b[1]);
      }
      path = [];
    } else if (fn === OPS.endPath) path = [];
  }
  return bars;
}

// ---------- লাইন গঠন ----------
const median = (arr) => {
  const s = arr.slice().sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 10;
};

/** একটি লাইনের আইটেম (x অনুযায়ী সাজানো) → সেন্টিনেলযুক্ত লেখা */
function buildLineString(members) {
  let out = '';
  let prev = null;
  let mode = null; // 'sup' | 'sub' | null
  const close = () => { if (mode === 'sup') out += UP_C; else if (mode === 'sub') out += DN_C; mode = null; };
  for (const it of members) {
    const script = it.script || null;
    if (script) {
      const s = it.str.replace(/\s+/g, SPC);
      if (mode !== script) { close(); out += script === 'sup' ? UP_O : DN_O; mode = script; }
      out += s;
    } else {
      close();
      const gap = prev ? it.x - (prev.x + prev.w) : 0;
      const needSpace = prev && gap > 0.2 * it.size && !/\s$/.test(out) && !/^\s/.test(it.str);
      out += (needSpace ? ' ' : '') + it.str;
    }
    prev = it;
  }
  close();
  return out;
}

/**
 * pdf-parse এর pagerender হিসেবে ব্যবহারের ফাংশন।
 * প্রতিটি পেজ থেকে লাইনভিত্তিক লেখা ফেরত দেয়, সূত্রের অংশ সেন্টিনেল দিয়ে চিহ্নিত।
 */
async function layoutPageRender(pageData) {
  const tc = await pageData.getTextContent({ normalizeWhitespace: true, disableCombineTextItems: true });
  let items = tc.items
    .filter((i) => i.str && i.str.length)
    .map((i, idx) => ({
      idx,
      str: i.str,
      x: i.transform[4],
      y: i.transform[5],
      size: Math.abs(i.transform[3]) || i.height || 10,
      w: i.width || 0,
    }));
  if (!items.length) return '';

  const bodySize = median(items.map((i) => i.size));

  // ---- ১. ভগ্নাংশ: দাগের উপরে/নিচের আইটেমগুলো এক করে \frac{..}{..} ----
  let bars = [];
  try {
    bars = extractBars(await pageData.getOperatorList());
  } catch (e) {
    bars = [];
  }
  const used = new Set();
  const fractions = [];
  for (const bar of bars) {
    const width = bar.x1 - bar.x0;
    const near = items.filter((it) => !used.has(it) && it.x >= bar.x0 - 2 && it.x + it.w <= bar.x1 + 2);
    const s = bodySize;
    const num = near.filter((it) => it.y - bar.y > 0.1 * s && it.y - bar.y < 1.4 * s);
    const den = near.filter((it) => bar.y - it.y > 0.35 * s && bar.y - it.y < 1.7 * s);
    if (!num.length || !den.length) continue;
    const span = (arr) => Math.max(...arr.map((a) => a.x + a.w)) - Math.min(...arr.map((a) => a.x));
    // দাগ লেখার সাথে মানানসই (টেবিল বর্ডার/আন্ডারলাইন নয়)
    if (width > Math.max(span(num), span(den)) + 1.5 * s) continue;
    const mk = (arr) => {
      const rows = {};
      arr.forEach((a) => { (rows[Math.round(a.y)] = rows[Math.round(a.y)] || []).push(a); });
      return Object.keys(rows).map(Number).sort((a, b) => b - a)
        .map((y) => rows[y].sort((a, b) => a.x - b.x))
        .map((r) => mathInner(markScripts(r))).join(' ');
    };
    const latex = `\\frac{${mk(num)}}{${mk(den)}}`;
    [...num, ...den].forEach((a) => used.add(a));
    fractions.push({
      idx: Math.min(...[...num, ...den].map((a) => a.idx)),
      str: RAW_O + latex + RAW_C, x: bar.x0, w: width, size: s, y: bar.y - 0.25 * s, script: null, isFraction: true,
    });
  }
  items = items.filter((it) => !used.has(it)).concat(fractions);

  // ---- ২. সাব/সুপারস্ক্রিপ্ট শনাক্ত ----
  markScriptsOnItems(items);

  // ---- ৩. লাইনে ভাগ (স্ক্রিপ্ট তার হোস্টের লাইনে) ----
  // pdf.js যে ক্রমে লেখা দিয়েছে (পড়ার ক্রম) সেটাই রাখা হয়: পরপর আইটেম একই baseline-এ থাকলে একই লাইন।
  // এতে দুই কলামের PDF-এর কলাম মিশে যায় না।
  const bases = items.filter((it) => !it.script).sort((a, b) => a.idx - b.idx);
  const lines = [];
  let cur = null;
  for (const it of bases) {
    if (cur && Math.abs(it.y - cur.y) <= 0.4 * Math.min(it.size, cur.size)) {
      cur.members.push(it);
      cur.size = Math.max(cur.size, it.size);
    } else {
      cur = { y: it.y, size: it.size, members: [it] };
      lines.push(cur);
    }
  }
  for (const it of items.filter((i) => i.script)) {
    const line = lines.find((L) => L.members.includes(it.host));
    if (line) line.members.push(it);
    else lines.push({ y: it.y, size: it.size, members: [it] });
  }
  return lines.map((L) => buildLineString(L.members.sort((a, b) => a.x - b.x))).join('\n');
}

/** আইটেমগুলোর মধ্যে কোনটি সাব/সুপারস্ক্রিপ্ট তা ঠিক করে (it.script, it.host সেট করে) */
function markScriptsOnItems(items) {
  const sorted = items.slice().sort((a, b) => a.x - b.x);
  const isCandidateHost = (h) => !h.script && !h.isFraction;
  const reach = new Map(); // হোস্ট → এ পর্যন্ত যুক্ত স্ক্রিপ্টসহ ডান প্রান্ত

  for (const it of sorted) {
    if (it.script) continue;
    let best = null;
    let bestDist = Infinity;
    for (const h of items) {
      if (h === it || !isCandidateHost(h)) continue;
      if (h.size < it.size * 1.08) continue; // হোস্টকে বড় হতে হবে
      const dy = it.y - h.y;
      // Word/LibreOffice-এর সাবস্ক্রিপ্ট মাত্র ~৮% নামানো থাকে, কিন্তু ফন্ট ~৫৮-৭০% ছোট।
      // তাই ফন্ট যত ছোট, উচ্চতার ফারাকের সীমা তত কম রাখা হয় (একই বেসলাইনের ছোট লেখা স্ক্রিপ্ট ধরা হয় না)।
      const ratio = it.size / h.size;
      const minShift = ratio <= 0.8 ? 0.04 : 0.12;
      if (Math.abs(dy) < minShift * h.size || Math.abs(dy) > 0.95 * h.size) continue;
      const hostEnd = Math.max(h.x + h.w, reach.get(h) || 0);
      const gapAfter = it.x - hostEnd; // হোস্টের পরে বসানো (পিছনের স্ক্রিপ্ট)
      const gapBefore = h.x - (it.x + it.w); // হোস্টের আগে বসানো (আইসোটোপের মতো)
      const dist = gapAfter >= -0.5 * h.size ? gapAfter : gapBefore >= -1 ? gapBefore + 0.01 : Infinity;
      if (dist <= 0.35 * h.size && dist < bestDist) { best = h; bestDist = dist; }
    }
    if (best) {
      it.script = it.y - best.y > 0 ? 'sup' : 'sub';
      it.host = best;
      reach.set(best, Math.max(reach.get(best) || 0, it.x + it.w));
    }
  }
}

// ভগ্নাংশের ভেতরের একটি সারির আইটেম → সেন্টিনেলযুক্ত লেখা (একই সারির মধ্যকার স্ক্রিপ্টসহ)
function markScripts(row) {
  const copy = row.map((r) => ({ ...r, script: null, host: null }));
  markScriptsOnItems(copy);
  return buildLineString(copy.sort((a, b) => a.x - b.x));
}

module.exports = { layoutPageRender, buildLineString, markScriptsOnItems, extractBars };
