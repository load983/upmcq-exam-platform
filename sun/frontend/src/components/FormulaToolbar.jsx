// ================== components/FormulaToolbar.jsx ==================
// শিক্ষকের জন্য সূত্রের বাটন: প্রশ্ন/অপশনের যে ঘরে কার্সার আছে (data-math ঘর), সেখানে সূত্র বসিয়ে দেয়।
// গণিত, পদার্থ ও রসায়ন — প্রতিটির নিচে বিষয়ভিত্তিক বিভাগ। বাটনের তালিকা: ./formulaData.js
import React, { useEffect, useRef, useState } from 'react';
import MathText from './MathText';
import { useLanguage } from '../context/LanguageContext';
import { GROUPS, M } from './formulaData';

// কার্সার $ ... $ বা $$ ... $$ এর ভেতরে থাকলে true (\$ গোনা হয় না)
const insideMath = (text, pos) => {
  const before = text.slice(0, pos).replace(/\\\$/g, '');
  let inline = false;
  let display = false;
  for (const m of before.matchAll(/\$\$|\$/g)) {
    if (m[0] === '$$') { if (!inline) display = !display; } else if (!display) inline = !inline;
  }
  return inline || display;
};

function insertAtCursor(el, snippet) {
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? start;
  // আগে থেকেই $ ... $ এর ভেতরে থাকলে বাইরের $ চিহ্ন বাদ দিয়ে শুধু সূত্রটুকু বসে
  let text = snippet;
  if (insideMath(el.value, start)) text = text.replace(/^\$(.*)\$$/, '$1');
  const at = text.indexOf(M);
  const clean = text.replace(M, '');
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
  const { t } = useLanguage();
  const [tab, setTab] = useState(0);
  const [sec, setSec] = useState(0);
  const [open, setOpen] = useState(true);
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

  const group = GROUPS[tab];
  const section = group.sections[sec] || group.sections[0];
  const keep = (e) => e.preventDefault(); // বাটন চাপলে ঘরের ফোকাস/কার্সার যেন না হারায়

  return (
    <div className="card sticky top-2 z-20 mb-5 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {GROUPS.map((g, i) => (
          <button
            key={g.name}
            type="button"
            onMouseDown={keep}
            onClick={() => { setTab(i); setSec(0); setOpen(true); }}
            className={tab === i ? 'btn-primary !px-3 !py-1 text-sm' : 'btn-secondary !px-3 !py-1 text-sm'}
          >
            {g.name}
          </button>
        ))}
        <button
          type="button"
          onMouseDown={keep}
          onClick={() => setOpen((v) => !v)}
          className="ml-auto rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 dark:border-white/10 dark:text-gray-300"
          aria-expanded={open}
        >
          {open ? t('formula.hide') : t('formula.show')}
        </button>
      </div>

      {open && (
        <>
          <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
            {t('formula.help')}
          </p>
          {hint && <p className="mb-2 text-xs text-red-600">{t('formula.hint')}</p>}

          {/* বিভাগ (সাব-ট্যাব) */}
          <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
            {group.sections.map((s, i) => (
              <button
                key={s.name}
                type="button"
                onMouseDown={keep}
                onClick={() => setSec(i)}
                className={
                  'shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs ' +
                  (i === sec
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : 'border-gray-200 text-gray-700 hover:border-primary-500 dark:border-white/10 dark:text-gray-200')
                }
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* বাটনের তালিকা */}
          <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto sm:max-h-56">
            {section.items.map(([label, snippet], i) => (
              <button
                key={`${tab}-${sec}-${i}`}
                type="button"
                onMouseDown={keep}
                onClick={() => insert(snippet)}
                className="max-w-full overflow-x-auto rounded-md border border-gray-200 bg-white/60 px-2 py-1 text-sm hover:border-primary-500 dark:border-white/10 dark:bg-white/5"
              >
                <MathText text={`$${label}$`} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
