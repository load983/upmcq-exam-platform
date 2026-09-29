// ================== components/MathText.jsx ==================
// প্রশ্ন/অপশন/ব্যাখ্যায় গণিত, পদার্থবিজ্ঞান ও রসায়নের সূত্র সুন্দরভাবে (বইয়ের মতো) দেখায়।
// গণিত/পদার্থ: $\frac{a}{b}$, $x^{2}$, $\sqrt{x}$ ...   রসায়ন: $\ce{2H2 + O2 -> 2H2O}$, $\ce{SO4^{2-}}$
import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import 'katex/contrib/mhchem'; // \ce{...} ও \pu{...} (রসায়ন ও একক)
import { splitMath } from '../utils/mathParse';

const render = (latex, display) => {
  try {
    return katex.renderToString(latex, { displayMode: display, throwOnError: false, strict: 'ignore', trust: false });
  } catch (e) {
    return null;
  }
};

export default function MathText({ text, className = '', as: Tag = 'span' }) {
  const parts = useMemo(
    () => splitMath(text).map((p) => (p.math ? { ...p, html: render(p.latex, p.display) } : p)),
    [text]
  );
  return (
    <Tag className={`whitespace-pre-line ${className}`}>
      {parts.map((p, i) => {
        if (!p.math) return <React.Fragment key={i}>{p.text}</React.Fragment>;
        if (!p.html) return <code key={i}>{p.latex}</code>;
        return p.display ? (
          <span key={i} className="my-2 block max-w-full overflow-x-auto" dangerouslySetInnerHTML={{ __html: p.html }} />
        ) : (
          <span key={i} dangerouslySetInnerHTML={{ __html: p.html }} />
        );
      })}
    </Tag>
  );
}
