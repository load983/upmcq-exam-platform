// ================== components/FormulaToolbar.jsx ==================
// শিক্ষকের জন্য সূত্রের বাটন: প্রশ্ন/অপশনের যে ঘরে কার্সার আছে (data-math ঘর), সেখানে সূত্র বসিয়ে দেয়।
import React, { useEffect, useRef, useState } from 'react';
import MathText from './MathText';

const M = '▮'; // এখানে কার্সার বসবে

const GROUPS = [
  {
    name: 'গণিত',
    items: [
      ['\\frac{a}{b}', `$\\frac{${M}}{}$`],
      ['x^{2}', `$x^{${M}}$`],
      ['x_{n}', `$x_{${M}}$`],
      ['\\sqrt{x}', `$\\sqrt{${M}}$`],
      ['\\sqrt[3]{x}', `$\\sqrt[3]{${M}}$`],
      ['\\int_{a}^{b}', `$\\int_{${M}}^{} f(x)\\,dx$`],
      ['\\lim_{x\\to 0}', `$\\lim_{x \\to ${M}}$`],
      ['\\sum_{i=1}^{n}', `$\\sum_{i=1}^{${M}}$`],
      ['\\frac{dy}{dx}', `$\\frac{dy}{dx}$`],
      ['\\log_{a}x', `$\\log_{${M}} x$`],
      ['\\sin\\theta', `$\\sin\\theta$`],
      ['\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}', `$\\begin{pmatrix} ${M} & \\\\ & \\end{pmatrix}$`],
      ['\\leq', `$\\leq$`], ['\\geq', `$\\geq$`], ['\\neq', `$\\neq$`], ['\\pm', `$\\pm$`],
      ['\\times', `$\\times$`], ['\\div', `$\\div$`], ['\\infty', `$\\infty$`], ['\\pi', `$\\pi$`],
      ['\\in', `$\\in$`], ['\\subset', `$\\subset$`], ['\\cup', `$\\cup$`], ['\\cap', `$\\cap$`],
    ],
  },
  {
    name: 'পদার্থ',
    items: [
      ['\\vec{F}', `$\\vec{${M}}$`],
      ['\\frac{1}{2}mv^{2}', `$\\frac{1}{2}mv^{2}$`],
      ['\\vec{F}=m\\vec{a}', `$\\vec{F}=m\\vec{a}$`],
      ['10^{-3}', `$10^{${M}}$`],
      ['\\pu{m s^-2}', `$\\pu{${M} m s^-2}$`],
      ['\\pu{kg m^2}', `$\\pu{${M} kg m^2}$`],
      ['\\Delta', `$\\Delta$`], ['\\theta', `$\\theta$`], ['\\lambda', `$\\lambda$`], ['\\mu', `$\\mu$`],
      ['\\omega', `$\\omega$`], ['\\Omega', `$\\Omega$`], ['\\rho', `$\\rho$`], ['\\epsilon_0', `$\\epsilon_0$`],
      ['\\hbar', `$\\hbar$`], ['\\propto', `$\\propto$`], ['\\approx', `$\\approx$`], ['^{\\circ}', `$^{\\circ}$`],
    ],
  },
  {
    name: 'রসায়ন',
    items: [
      ['\\ce{H2O}', `$\\ce{H2O}$`],
      ['\\ce{CO2}', `$\\ce{CO2}$`],
      ['\\ce{H2SO4}', `$\\ce{H2SO4}$`],
      ['\\ce{Fe^{3+}}', `$\\ce{Fe^{3+}}$`],
      ['\\ce{SO4^{2-}}', `$\\ce{SO4^{2-}}$`],
      ['\\ce{A -> B}', `$\\ce{${M} -> }$`],
      ['\\ce{A <=> B}', `$\\ce{${M} <=> }$`],
      ['\\ce{A ->[\\Delta] B}', `$\\ce{${M} ->[\\Delta] }$`],
      ['\\ce{2H2 + O2 -> 2H2O}', `$\\ce{2H2 + O2 -> 2H2O}$`],
      ['\\ce{^{14}_{6}C}', `$\\ce{^{14}_{6}C}$`],
      ['\\ce{CH3COOH}', `$\\ce{CH3COOH}$`],
      ['\\ce{AgCl v}', `$\\ce{AgCl v}$`],
      ['\\ce{CO2 ^}', `$\\ce{CO2 ^}$`],
      ['\\pu{0.1 mol L-1}', `$\\pu{${M} mol L-1}$`],
      ['\\mathrm{pH}', `$\\mathrm{pH}$`],
      ['K_{c}', `$K_{c}$`],
      ['\\Delta H', `$\\Delta H$`],
    ],
  },
];

function insertAtCursor(el, snippet) {
  const at = snippet.indexOf(M);
  const clean = snippet.replace(M, '');
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? start;
  const next = el.value.slice(0, start) + clean + el.value.slice(end);
  const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  // React-নিয়ন্ত্রিত ঘরে মান বসিয়ে onChange চালানোর নিয়ম
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, next);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  const pos = start + (at >= 0 ? at : clean.length);
  el.focus();
  el.setSelectionRange(pos, pos);
}

export default function FormulaToolbar() {
  const [tab, setTab] = useState(0);
  const [hint, setHint] = useState(false);
  const lastRef = useRef(null);

  useEffect(() => {
    const onFocus = (e) => {
      if (e.target && e.target.dataset && e.target.dataset.math !== undefined) lastRef.current = e.target;
    };
    document.addEventListener('focusin', onFocus);
    return () => document.removeEventListener('focusin', onFocus);
  }, []);

  const insert = (snippet) => {
    const el = lastRef.current;
    if (!el || !document.contains(el)) {
      setHint(true);
      return;
    }
    setHint(false);
    insertAtCursor(el, snippet);
  };

  return (
    <div className="card sticky top-2 z-20 mb-5 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {GROUPS.map((g, i) => (
          <button
            key={g.name}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setTab(i)}
            className={tab === i ? 'btn-primary !px-3 !py-1 text-sm' : 'btn-secondary !px-3 !py-1 text-sm'}
          >
            {g.name}
          </button>
        ))}
        <span className="text-xs text-gray-500 dark:text-gray-400">
          সূত্র <b>$ ... $</b> এর ভেতরে লেখা হয়। ঘরে ক্লিক করে বাটন চাপো।
        </span>
      </div>
      {hint && <p className="mb-2 text-xs text-red-600">আগে প্রশ্ন বা অপশনের কোনো ঘরে ক্লিক করো, তারপর বাটন চাপো।</p>}
      <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
        {GROUPS[tab].items.map(([label, snippet]) => (
          <button
            key={snippet}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insert(snippet)}
            className="rounded-md border border-gray-200 bg-white/60 px-2 py-1 text-sm hover:border-primary-500 dark:border-white/10 dark:bg-white/5"
          >
            <MathText text={`$${label}$`} />
          </button>
        ))}
      </div>
    </div>
  );
}
