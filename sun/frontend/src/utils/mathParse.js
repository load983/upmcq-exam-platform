// ================== utils/mathParse.js ==================
// টেক্সটকে সাধারণ লেখা ও গণিত/রসায়নের অংশে ভাগ করে।
//   $ ... $  বা  \( ... \)   → লাইনের ভেতরের সূত্র
//   $$ ... $$ বা \[ ... \]   → আলাদা লাইনে বড় সূত্র
//   \$                        → সাধারণ ডলার চিহ্ন
const MATH_RE = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\])/g;
const ESC = '\u0000';

export function splitMath(input) {
  const src = String(input ?? '').replace(/\\\$/g, ESC);
  return src
    .split(MATH_RE)
    .filter((p) => p !== '')
    .map((part) => {
      let latex = null;
      let display = false;
      if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
        latex = part.slice(2, -2); display = true;
      } else if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        latex = part.slice(1, -1);
      } else if (part.startsWith('\\(') && part.endsWith('\\)')) {
        latex = part.slice(2, -2);
      } else if (part.startsWith('\\[') && part.endsWith('\\]')) {
        latex = part.slice(2, -2); display = true;
      }
      if (latex !== null) return [{ math: true, display, latex: latex.split(ESC).join('\\$').trim() }];
      // সাধারণ লেখার ভেতরের ইউনিকোড সাব/সুপারস্ক্রিপ্ট (H₂O, x², Fe³⁺) সূত্র হিসেবে দেখানো
      return autoScripts(part.split(ESC).join('$'));
    })
    .flat();
}

export const hasMath = (s) => /\$[^$\n]+?\$|\\\(|\\\[/.test(String(s ?? '')) || SCRIPT_TEST.test(String(s ?? ''));

// ---------- ইউনিকোড সাব/সুপারস্ক্রিপ্ট → সূত্র ----------
// PDF/কিবোর্ড থেকে আসা H₂O, x², SO₄²⁻, Fe³⁺, ¹⁴₆C যেমন আছে তেমনই (বইয়ের মতো) দেখাতে KaTeX দিয়ে আঁকা হয়।
// ব্যাকএন্ডের PDF আমদানিও একই নিয়মে সূত্র বানায়; এটি হাতে টাইপ করা বা পুরনো ডেটার জন্য।
const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '-', '⁼': '=', '⁽': '(', '⁾': ')', 'ⁿ': 'n', 'ⁱ': 'i' };
const SUB = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9', '₊': '+', '₋': '-', '₌': '=', '₍': '(', '₎': ')', 'ₐ': 'a', 'ₑ': 'e', 'ₒ': 'o', 'ₓ': 'x', 'ₕ': 'h', 'ₖ': 'k', 'ₗ': 'l', 'ₘ': 'm', 'ₙ': 'n', 'ₚ': 'p', 'ₛ': 's', 'ₜ': 't', 'ᵢ': 'i', 'ⱼ': 'j' };
const SUP_C = Object.keys(SUP).join('');
const SUB_C = Object.keys(SUB).join('');
const SCRIPT_TEST = new RegExp(`[${SUP_C}${SUB_C}]`);
const PLAIN = "A-Za-z0-9()\\[\\]+\\-=.,/*<>|'\u2032\u2212";
const WORD_RE = new RegExp(`[${PLAIN}]*[${SUP_C}${SUB_C}][${PLAIN}${SUP_C}${SUB_C}]*`, 'g');
const RUN_RE = new RegExp(`[${SUP_C}]+|[${SUB_C}]+|[^${SUP_C}${SUB_C}]+`, 'g');
const map = (s, m) => [...s].map((c) => m[c] || c).join('');
const esc = (t) => t.replace(/[\\{}$&#%_^~]/g, (c) => ({ '\\': '\\backslash ', '~': '\\sim ', '^': '\\^{}' }[c] || `\\${c}`));

function wordToLatex(word) {
  const parts = (word.match(RUN_RE) || []).map((t) =>
    SCRIPT_TEST.test(t[0]) ? (SUP[t[0]] !== undefined ? { k: 'sup', s: map(t, SUP) } : { k: 'sub', s: map(t, SUB) }) : { k: 'base', s: t }
  );
  const base = parts.filter((p) => p.k === 'base').map((p) => p.s).join('');
  const isotope = parts[0]?.k === 'sup';
  const subDigit = parts.some((p) => p.k === 'sub' && /^\d+$/.test(p.s));
  const charge = parts.some((p) => p.k === 'sup' && (/^\d*[+-]+$/.test(p.s) || (isotope && /^\d+$/.test(p.s))));
  const badSup = parts.some((p) => p.k === 'sup' && !/^\d*[+-]+$/.test(p.s) && !(isotope && /^\d+$/.test(p.s)));
  const chem = /[A-Z]/.test(base) && /^(?:[A-Z][a-z]?|[()[\]]|\d+|[·.•])+$/.test(base) && (subDigit || charge) && !badSup
    && !parts.some((p) => p.k === 'sub' && !/^\d+$/.test(p.s));
  if (chem) {
    let out = '';
    parts.forEach((p) => {
      if (p.k === 'base') out += p.s;
      else if (p.k === 'sup') out += `^{${p.s.replace(/\u2212/g, '-')}}`;
      else out += /[A-Za-z)\]]$/.test(out) ? p.s : `_{${p.s}}`;
    });
    return `\\ce{${out}}`;
  }
  return parts.map((p) => (p.k === 'base' ? esc(p.s) : p.k === 'sup' ? `^{${esc(p.s)}}` : `_{${esc(p.s)}}`)).join('');
}

function autoScripts(text) {
  if (!SCRIPT_TEST.test(text)) return [{ math: false, text }];
  const out = [];
  let last = 0;
  for (const m of text.matchAll(WORD_RE)) {
    const tail = (m[0].match(/[.,;]+$/) || [''])[0];
    const core = tail ? m[0].slice(0, -tail.length) : m[0];
    if (m.index > last) out.push({ math: false, text: text.slice(last, m.index) });
    out.push({ math: true, display: false, latex: wordToLatex(core) });
    last = m.index + core.length;
  }
  if (last < text.length) out.push({ math: false, text: text.slice(last) });
  return out;
}
