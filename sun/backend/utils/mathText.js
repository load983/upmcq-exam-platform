// ================== utils/mathText.js ==================
// PDF থেকে আসা লেখার সূত্র "যেমন আছে তেমন" রাখার কোর মডিউল।
//
// কাজ ১: ইউনিকোড ও লেআউট-ভিত্তিক সূত্র  →  LaTeX ($...$)
//   H₂O, x², SO₄²⁻, Fe³⁺, ¹⁴₆C   (ইউনিকোড সাব/সুপারস্ক্রিপ্ট)
//   H<ছোট নিচু 2>O, x<ছোট উঁচু 2>  (PDF-এ ছোট ফন্টে উঁচু/নিচু করে বসানো অক্ষর)
//   ভগ্নাংশ (উপরে-নিচে সাজানো, মাঝে দাগ)
//
// কাজ ২: LaTeX → পড়ার মতো সাধারণ লেখা (রেজাল্ট PDF / Excel এক্সপোর্টের জন্য)
//
// ভেতরের কাজে "সেন্টিনেল" চিহ্ন (Unicode Private Use Area) ব্যবহার হয়; এগুলো কখনো বাইরে যায় না।

const UP_O = '\uE000'; // সুপারস্ক্রিপ্ট শুরু
const UP_C = '\uE001'; // সুপারস্ক্রিপ্ট শেষ
const DN_O = '\uE002'; // সাবস্ক্রিপ্ট শুরু
const DN_C = '\uE003'; // সাবস্ক্রিপ্ট শেষ
const SPC = '\uE004'; // স্ক্রিপ্টের ভেতরের সুরক্ষিত স্পেস
const RAW_O = '\uE005'; // তৈরি-করা LaTeX টুকরো শুরু (যেমন \frac{..}{..})
const RAW_C = '\uE006'; // তৈরি-করা LaTeX টুকরো শেষ

const SUP_MAP = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', '⁻': '-', '⁼': '=', '⁽': '(', '⁾': ')', 'ⁿ': 'n', 'ⁱ': 'i',
};
const SUB_MAP = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
  '₊': '+', '₋': '-', '₌': '=', '₍': '(', '₎': ')',
  'ₐ': 'a', 'ₑ': 'e', 'ₒ': 'o', 'ₓ': 'x', 'ₕ': 'h', 'ₖ': 'k', 'ₗ': 'l', 'ₘ': 'm', 'ₙ': 'n', 'ₚ': 'p', 'ₛ': 's', 'ₜ': 't',
  'ᵢ': 'i', 'ⱼ': 'j',
};
const SUP_RE = new RegExp(`[${Object.keys(SUP_MAP).join('')}]+`, 'g');
const SUB_RE = new RegExp(`[${Object.keys(SUB_MAP).join('')}]+`, 'g');
const mapChars = (s, m) => [...s].map((c) => m[c] || c).join('');

// লিগেচার ও বিশেষ ড্যাশ ঠিক করা (সূত্র ছাড়া সাধারণ লেখাতেও কাজে লাগে)
const LIGATURES = { 'ﬁ': 'fi', 'ﬂ': 'fl', 'ﬀ': 'ff', 'ﬃ': 'ffi', 'ﬄ': 'ffl' };

/** ইউনিকোড সাব/সুপারস্ক্রিপ্টকে সেন্টিনেল-চিহ্নিত রূপে বদলায় */
function unicodeScriptsToSentinels(str) {
  return String(str ?? '')
    .replace(/[ﬁﬂﬀﬃﬄ]/g, (c) => LIGATURES[c])
    .replace(SUP_RE, (m) => UP_O + mapChars(m, SUP_MAP) + UP_C)
    .replace(SUB_RE, (m) => DN_O + mapChars(m, SUB_MAP) + DN_C);
}

// ---------------- সেন্টিনেল → LaTeX ----------------
const ESC_MAP = { '\\': '\\backslash ', '{': '\\{', '}': '\\}', $: '\\$', '&': '\\&', '#': '\\#', '%': '\\%', _: '\\_', '^': '\\^{}', '~': '\\sim ' };
const escLatex = (s) => s.replace(/[\\{}$&#%_^~]/g, (c) => ESC_MAP[c]);
const normScript = (s) => s.split(SPC).join(' ').replace(/[\u2212\u2013\u2012]/g, '-').trim();

const TOKEN_RE = new RegExp(`${UP_O}([^${UP_C}]*)${UP_C}|${DN_O}([^${DN_C}]*)${DN_C}|${RAW_O}([^${RAW_C}]*)${RAW_C}`, 'g');

/** সেন্টিনেলযুক্ত টুকরোকে গণিত-মোডের LaTeX (ডলার ছাড়া) বানায় */
function mathInner(s) {
  let out = '';
  let last = 0;
  s.replace(TOKEN_RE, (m, sup, sub, raw, idx) => {
    out += escLatex(s.slice(last, idx));
    last = idx + m.length;
    if (sup !== undefined) out += `^{${escLatex(normScript(sup))}}`;
    else if (sub !== undefined) out += `_{${escLatex(normScript(sub))}}`;
    else out += raw;
    return m;
  });
  out += escLatex(s.slice(last));
  return out;
}

/** রসায়নের শব্দ কিনা: H₂O, Ca(OH)₂, SO₄²⁻, Fe³⁺ */
function isChemWord(w) {
  let hasSubDigit = false;
  let hasCharge = false;
  let bad = false;
  const base = w
    .replace(new RegExp(`${DN_O}([^${DN_C}]*)${DN_C}`, 'g'), (_, c) => {
      if (/^\d+$/.test(c)) hasSubDigit = true;
      else bad = true;
      return '';
    })
    .replace(new RegExp(`${UP_O}([^${UP_C}]*)${UP_C}`, 'g'), (_, c) => {
      if (/^\d*[+\-\u2212\u2013]+$/.test(c)) hasCharge = true;
      else if (/^\d+$/.test(c) && w.startsWith(UP_O)) hasCharge = true; // আইসোটোপ: ¹⁴₆C
      else bad = true;
      return '';
    });
  if (bad || base.includes(RAW_O)) return false;
  if (!/[A-Z]/.test(base)) return false;
  if (!/^(?:[A-Z][a-z]?|[()\[\]]|\d+|[·.•])+$/.test(base)) return false;
  return hasSubDigit || hasCharge;
}

/** রসায়নের শব্দ → mhchem \ce{...} এর ভেতরের অংশ */
function chemInner(s) {
  let out = '';
  let last = 0;
  const push = (t) => { out += t; };
  s.replace(TOKEN_RE, (m, sup, sub, raw, idx) => {
    push(s.slice(last, idx));
    last = idx + m.length;
    if (sup !== undefined) push(`^{${normScript(sup)}}`);
    else if (sub !== undefined) {
      const c = normScript(sub);
      // ধাতব চিহ্ন/বন্ধনীর পরের সংখ্যা সরাসরি; আইসোটোপের মতো শুরুর সাবস্ক্রিপ্ট ঘরসহ
      if (/^\d+$/.test(c) && /[A-Za-z)\]]$/.test(out)) push(c);
      else push(`_{${c}}`);
    } else push(raw);
    return m;
  });
  push(s.slice(last));
  return out;
}

// গণিতে থাকতে পারে এমন অক্ষর (স্পেস ছাড়া)
const WORD = "A-Za-z0-9()\\[\\]+\\-=.,/*<>|'\u2032\u2212";
const ATOM =
  `(?:[${WORD}]|${UP_O}[^${UP_C}]*${UP_C}|${DN_O}[^${DN_C}]*${DN_C}|${RAW_O}[^${RAW_C}]*${RAW_C})`;
const WORD_RE = new RegExp(`${ATOM}+`, 'g');
const HAS_SENT = new RegExp(`[${UP_O}${DN_O}${RAW_O}]`);

/** সেন্টিনেলযুক্ত পুরো লেখাকে ($...$ সহ) LaTeX-মিশ্রিত লেখায় বদলায় */
function sentinelsToLatex(str) {
  const text = String(str ?? '');
  if (!HAS_SENT.test(text)) return text;
  return text.replace(WORD_RE, (word) => {
    if (!HAS_SENT.test(word)) return word;
    // শেষের দাঁড়ি/কমা গণিতের বাইরে থাকবে
    const tail = (word.match(/[.,;]+$/) || [''])[0];
    const core = tail ? word.slice(0, -tail.length) : word;
    if (!HAS_SENT.test(core)) return word;
    const body = isChemWord(core) ? `\\ce{${chemInner(core)}}` : mathInner(core);
    return `$${body}$${tail}`;
  });
}

/** সেন্টিনেল বাদ দিয়ে সাধারণ টেক্সট (ফলব্যাক/সার্চের জন্য) */
const stripSentinels = (s) => String(s ?? '').replace(new RegExp(`[${UP_O}-${RAW_C}]`, 'g'), '');

/** মূল এন্ট্রি: ইউনিকোড স্ক্রিপ্ট + লেআউট সেন্টিনেল → চূড়ান্ত LaTeX-মিশ্রিত লেখা */
const toLatexText = (s) => sentinelsToLatex(unicodeScriptsToSentinels(s));

// ---------------- LaTeX → সাধারণ লেখা (PDF/Excel এক্সপোর্ট) ----------------
const TO_SUP = Object.fromEntries(Object.entries(SUP_MAP).map(([k, v]) => [v, k]));
const TO_SUB = Object.fromEntries(Object.entries(SUB_MAP).map(([k, v]) => [v, k]));

const CMD = {
  times: '×', div: '÷', pm: '±', mp: '∓', cdot: '·', leq: '≤', le: '≤', geq: '≥', ge: '≥', neq: '≠', ne: '≠',
  approx: '≈', equiv: '≡', propto: '∝', infty: '∞', pi: 'π', theta: 'θ', alpha: 'α', beta: 'β', gamma: 'γ',
  delta: 'δ', Delta: 'Δ', lambda: 'λ', mu: 'μ', sigma: 'σ', Sigma: 'Σ', omega: 'ω', Omega: 'Ω', rho: 'ρ',
  epsilon: 'ε', phi: 'φ', psi: 'ψ', eta: 'η', tau: 'τ', hbar: 'ħ', nabla: '∇', partial: '∂', int: '∫',
  sum: '∑', prod: '∏', in: '∈', notin: '∉', subset: '⊂', supset: '⊃', cup: '∪', cap: '∩', to: '→',
  rightarrow: '→', leftarrow: '←', Rightarrow: '⇒', Leftrightarrow: '⇔', circ: '°', degree: '°',
  sin: 'sin', cos: 'cos', tan: 'tan', log: 'log', ln: 'ln', lim: 'lim', sec: 'sec', cot: 'cot', csc: 'csc',
  angle: '∠', perp: '⊥', parallel: '∥', therefore: '∴', because: '∵', ldots: '…', dots: '…', quad: ' ', ',': ' ',
};

// টুলবারের নতুন চিহ্নগুলোর জন্য বাড়তি তালিকা (রেজাল্ট PDF / Excel এ যেন \\name না দেখায়)
Object.assign(CMD, {
  // গ্রিক
  epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', vartheta: 'ϑ', iota: 'ι', kappa: 'κ', nu: 'ν', xi: 'ξ', upsilon: 'υ',
  varphi: 'φ', chi: 'χ', varpi: 'ϖ', varrho: 'ϱ', varsigma: 'ς', Gamma: 'Γ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ',
  Pi: 'Π', Upsilon: 'Υ', Phi: 'Φ', Psi: 'Ψ', ell: 'ℓ',
  // চিহ্ন ও সম্পর্ক
  ast: '∗', simeq: '≃', cong: '≅', sim: '∼', ll: '≪', gg: '≫', bullet: '•', cdots: '⋯', vdots: '⋮', ddots: '⋱',
  mid: '∣', nmid: '∤', bmod: ' mod ', prime: '′', lvert: '|', rvert: '|', lVert: '‖', rVert: '‖', '%': '%',
  // সেট ও যুক্তি
  ni: '∋', subseteq: '⊆', supseteq: '⊇', setminus: '∖', emptyset: '∅', varnothing: '∅', forall: '∀', exists: '∃',
  nexists: '∄', neg: '¬', land: '∧', lor: '∨', implies: '⟹', iff: '⟺', top: '⊤', bot: '⊥', triangle: '△',
  odot: '⊙', otimes: '⊗', oplus: '⊕', ominus: '⊖', square: '□', bigcirc: '◯', bigcup: '⋃', bigcap: '⋂', ne: '≠',
  // তীর
  leftrightarrow: '↔', Leftarrow: '⇐', mapsto: '↦', uparrow: '↑', downarrow: '↓', longrightarrow: '⟶',
  rightleftharpoons: '⇌', nearrow: '↗', searrow: '↘', longleftarrow: '⟵',
  // ক্যালকুলাস
  iint: '∬', iiint: '∭', oint: '∮', lfloor: '⌊', rfloor: '⌋', lceil: '⌈', rceil: '⌉',
  // ফাংশন
  arcsin: 'arcsin', arccos: 'arccos', arctan: 'arctan', sinh: 'sinh', cosh: 'cosh', tanh: 'tanh', exp: 'exp',
  max: 'max', min: 'min', gcd: 'gcd', det: 'det', arg: 'arg', Re: 'Re', Im: 'Im', deg: 'deg',
});

// অক্ষরের ওপর বসা চিহ্ন (হ্যাট, ডট, তীর...) → ইউনিকোড কম্বাইনিং চিহ্ন
const ACCENT = {
  hat: '\u0302', widehat: '\u0302', tilde: '\u0303', widetilde: '\u0303', dot: '\u0307', ddot: '\u0308',
  overrightarrow: '\u20D7', overleftarrow: '\u20D6', overleftrightarrow: '\u20E1',
};
const BB = { R: 'ℝ', N: 'ℕ', Z: 'ℤ', Q: 'ℚ', C: 'ℂ', P: 'ℙ' };
const PLAIN_WRAP = ['mathbf', 'boldsymbol', 'mathcal', 'mathit', 'textbf', 'textit', 'operatorname', 'underline', 'mathsf', 'mathring'];
const NOT_MAP = { subset: '⊄', supset: '⊅', in: '∉', equiv: '≢', subseteq: '⊈', supseteq: '⊉', '=': '≠' };

/** \pu{...} এককের ভেতরের সংখ্যা: m s^-2 / mol L-1 / kg m^2 → m s⁻² / mol L⁻¹ / kg m² */
function puPlain(a) {
  const sup = (t) => [...t].map((c) => TO_SUP[c] || c).join('');
  return a
    .replace(/\^\{?(-?\d+)\}?/g, (_, n) => sup(n))
    .replace(/([A-Za-z])(-?\d+)(?=\s|$)/g, (_, u, n) => u + sup(n));
}

const group = (s, i) => {
  // s[i] == '{' → মিলে-যাওয়া '}' পর্যন্ত ভেতরের অংশ ও শেষ সূচক
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === '{') depth++;
    else if (s[j] === '}' && --depth === 0) return [s.slice(i + 1, j), j];
  }
  return [s.slice(i + 1), s.length - 1];
};

function scriptToPlain(content, map, mark) {
  const plain = latexToPlainMath(content);
  const ok = [...plain].every((c) => map[c] || c === ' ');
  if (ok) return [...plain].map((c) => map[c] || c).join('').replace(/ /g, '');
  return plain.length <= 1 ? mark + plain : `${mark}(${plain})`;
}

/** একটি গণিত টুকরো ($ ছাড়া) → ইউনিকোড টেক্সট */
function latexToPlainMath(src) {
  let out = '';
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '\\') {
      const m = src.slice(i + 1).match(/^([A-Za-z]+|.)/);
      const name = m ? m[1] : '';
      i += name.length;
      if (name === 'frac' || name === 'dfrac') {
        const [a, ea] = group(src, src.indexOf('{', i));
        const [b, eb] = group(src, src.indexOf('{', ea + 1));
        const A = latexToPlainMath(a); const B = latexToPlainMath(b);
        out += `${/^\w+$/.test(A) ? A : `(${A})`}/${/^\w+$/.test(B) ? B : `(${B})`}`;
        i = eb;
      } else if (name === 'sqrt') {
        let root = '';
        if (src[i + 1] === '[') { const close = src.indexOf(']', i); root = src.slice(i + 2, close); i = close; }
        const [a, e] = group(src, src.indexOf('{', i));
        out += `${root === '3' ? '∛' : root === '4' ? '∜' : '√'}(${latexToPlainMath(a)})`;
        i = e;
      } else if (name === 'ce' || name === 'pu' || name === 'mathrm' || name === 'text' || name === 'vec' || name === 'bar' || name === 'overline') {
        const [a, e] = group(src, src.indexOf('{', i));
        out += name === 'ce' ? cePlain(a) : name === 'pu' ? puPlain(a) : name === 'vec' ? `${latexToPlainMath(a)}⃗` : latexToPlainMath(a);
        i = e;
      } else if (ACCENT[name] !== undefined && src[i + 1] === '{') {
        const [a, e] = group(src, i + 1);
        out += latexToPlainMath(a) + ACCENT[name];
        i = e;
      } else if (name === 'mathbb' && src[i + 1] === '{') {
        const [a, e] = group(src, i + 1);
        out += [...a].map((c) => BB[c] || c).join('');
        i = e;
      } else if (PLAIN_WRAP.includes(name) && src[i + 1] === '{') {
        const [a, e] = group(src, i + 1);
        out += latexToPlainMath(a);
        i = e;
      } else if (name === 'tfrac') {
        const [a, ea] = group(src, src.indexOf('{', i));
        const [b, eb] = group(src, src.indexOf('{', ea + 1));
        const A = latexToPlainMath(a); const B = latexToPlainMath(b);
        out += `${/^\w+$/.test(A) ? A : `(${A})`}/${/^\w+$/.test(B) ? B : `(${B})`}`;
        i = eb;
      } else if (name === 'binom') {
        const [a, ea] = group(src, src.indexOf('{', i));
        const [b, eb] = group(src, src.indexOf('{', ea + 1));
        out += `C(${latexToPlainMath(a)}, ${latexToPlainMath(b)})`;
        i = eb;
      } else if (name === 'overset') {
        const [a, ea] = group(src, src.indexOf('{', i));
        const [b, eb] = group(src, src.indexOf('{', ea + 1));
        const top = latexToPlainMath(a).trim();
        out += top === '⌢' || top === 'frown' ? `${latexToPlainMath(b)}⌒` : `${latexToPlainMath(b)}(${top})`;
        i = eb;
      } else if (name === 'pmod' && src[i + 1] === '{') {
        const [a, e] = group(src, i + 1);
        out += ` (mod ${latexToPlainMath(a)})`;
        i = e;
      } else if (name === 'not') {
        const nx = src.slice(i + 1).match(/^\s*(?:\\([A-Za-z]+)|(=))/);
        if (nx && NOT_MAP[nx[1] || nx[2]]) { out += NOT_MAP[nx[1] || nx[2]]; i += nx[0].length; } else out += '≠';
      } else if (name === 'begin' && src[i + 1] === '{') {
        // ম্যাট্রিক্স / ডিটারমিন্যান্ট / cases → এক লাইনের লেখা
        const [env, e1] = group(src, i + 1);
        const endTag = `\\end{${env}}`;
        const endAt = src.indexOf(endTag, e1);
        const body = endAt === -1 ? src.slice(e1 + 1) : src.slice(e1 + 1, endAt);
        const cellJoin = env === 'cases' ? ' ' : ', ';
        const rows = body.split(/\\\\/).map((row) => row.split('&').map((c) => latexToPlainMath(c).trim()).join(cellJoin).trim()).filter((r) => r !== '');
        const [L, R] = { pmatrix: ['(', ')'], bmatrix: ['[', ']'], vmatrix: ['|', '|'], Vmatrix: ['‖', '‖'], cases: ['{ ', ' }'] }[env] || ['[', ']'];
        out += `${L}${rows.join('; ')}${R}`;
        i = endAt === -1 ? src.length : endAt + endTag.length - 1;
      } else if (name === 'left' || name === 'right' || name === '!' || name === ';') {
        if (src[i + 1] === '.') i++;
      } else if (name === '\\') out += ' ';
      else out += CMD[name] !== undefined ? CMD[name] : name.length === 1 ? name : name;
    } else if (c === '^' || c === '_') {
      let content;
      if (src[i + 1] === '{') { const [g, e] = group(src, i + 1); content = g; i = e; } else { content = src[i + 1] || ''; i += 1; }
      out += c === '^' && /^\\(circ|degree)\b/.test(content.trim()) ? '°' : c === '^' ? scriptToPlain(content, TO_SUP, '^') : scriptToPlain(content, TO_SUB, '_');
    } else if (c === '{' || c === '}') {
      // গ্রুপ চিহ্ন বাদ
    } else out += c;
  }
  return out;
}

/** mhchem \ce{...} → সাধারণ লেখা: H2O → H₂O, SO4^{2-} → SO₄²⁻, -> → → */
function cePlain(src) {
  let s = src
    .replace(/<=>/g, '⇌').replace(/<->/g, '↔').replace(/->/g, '→').replace(/<-/g, '←')
    .replace(/(→|←|↔|⇌)\[([^\]]*)\](?:\[([^\]]*)\])?/g, (_, ar, c, d) => `${ar}(${[c, d].filter((x) => x !== undefined).map((x) => latexToPlainMath(cePlain(x))).join(', ')})`)
    .replace(/\^\{([^}]*)\}/g, (_, c) => scriptToPlain(c, TO_SUP, '^'))
    .replace(/\^(\S)/g, (_, c) => scriptToPlain(c, TO_SUP, '^'))
    .replace(/_\{([^}]*)\}/g, (_, c) => scriptToPlain(c, TO_SUB, '_'));
  // অক্ষর/বন্ধনীর ঠিক পরের সংখ্যা সাবস্ক্রিপ্ট (H2O, Ca(OH)2); সহগ (2H2) নয়
  s = s.replace(/([A-Za-z)\]])(\d+)/g, (_, a, d) => a + mapChars(d, TO_SUB));
  return s;
}

/** পুরো লেখা থেকে $...$ / \(...\) খুলে সাধারণ ইউনিকোড লেখা বানায় */
function latexToPlain(str) {
  return String(str ?? '')
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => latexToPlainMath(m))
    .replace(/\$([^$\n]+?)\$/g, (_, m) => latexToPlainMath(m))
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, m) => latexToPlainMath(m))
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => latexToPlainMath(m));
}

module.exports = {
  UP_O, UP_C, DN_O, DN_C, SPC, RAW_O, RAW_C,
  unicodeScriptsToSentinels, sentinelsToLatex, toLatexText, stripSentinels, mathInner,
  latexToPlain, latexToPlainMath,
};
