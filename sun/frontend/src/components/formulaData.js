// ================== components/formulaData.js ==================
// সূত্র-টুলবারের সব বাটনের তালিকা (গণিত / পদার্থ / রসায়ন)।
// নতুন বাটন যোগ করতে হলে শুধু এই ফাইলে নির্দিষ্ট বিভাগের তালিকায় একটি লাইন যোগ করলেই হবে।
//
//   mk(দেখানোর_সূত্র)                 → বাটনে সূত্রটি দেখায়, ক্লিক করলে সেটিই বসে
//   mk(দেখানোর_সূত্র, বসানোর_সূত্র)     → ▮ যেখানে থাকবে, বসানোর পর কার্সার সেখানে দাঁড়াবে
//   ce(...) রাসায়নিক সংকেত (mhchem), pu(...) একক (mhchem)
//
// সব সূত্র KaTeX (+ mhchem) এর নিয়মে লেখা।

export const M = '▮'; // এখানে কার্সার বসবে
const r = String.raw;

const mk = (label, cur) => [label, `$${cur ?? label}$`];
const ce = (label, cur) => mk(r`\ce{${label}}`, cur === undefined ? undefined : r`\ce{${cur}}`);
const pu = (unit) => mk(r`\pu{${unit}}`, r`\pu{${M} ${unit}}`);
const list = (arr) => arr.map((s) => mk(s));

// ---------------------------------------------------------------- গ্রিক অক্ষর
const GREEK = [
  ...list([
    '\\alpha', '\\beta', '\\gamma', '\\delta', '\\epsilon', '\\varepsilon', '\\zeta', '\\eta', '\\theta', '\\vartheta',
    '\\iota', '\\kappa', '\\lambda', '\\mu', '\\nu', '\\xi', '\\pi', '\\rho', '\\sigma', '\\tau', '\\upsilon',
    '\\phi', '\\varphi', '\\chi', '\\psi', '\\omega',
  ]),
  ...list(['\\Gamma', '\\Delta', '\\Theta', '\\Lambda', '\\Xi', '\\Pi', '\\Sigma', '\\Upsilon', '\\Phi', '\\Psi', '\\Omega']),
];

// ================================================================ গণিত
const MATH = [
  {
    name: 'মৌলিক',
    items: [
      mk(r`\frac{a}{b}`, r`\frac{${M}}{}`),
      mk(r`\dfrac{a}{b}`, r`\dfrac{${M}}{}`),
      mk(r`x^{2}`, r`x^{${M}}`),
      mk(r`x_{n}`, r`x_{${M}}`),
      mk(r`x_{n}^{2}`, r`x_{${M}}^{}`),
      mk(r`\sqrt{x}`, r`\sqrt{${M}}`),
      mk(r`\sqrt[3]{x}`, r`\sqrt[3]{${M}}`),
      mk(r`\sqrt[n]{x}`, r`\sqrt[${M}]{}`),
      mk(r`\left|x\right|`, r`\left|${M}\right|`),
      mk(r`\left(\frac{a}{b}\right)`, r`\left(${M}\right)`),
      mk(r`\left[x\right]`, r`\left[${M}\right]`),
      mk(r`\left\{x\right\}`, r`\left\{${M}\right\}`),
      mk(r`n!`, r`${M}!`),
      mk(r`\binom{n}{r}`, r`\binom{${M}}{}`),
      mk(r`{}^{n}C_{r}`, r`{}^{${M}}C_{}`),
      mk(r`{}^{n}P_{r}`, r`{}^{${M}}P_{}`),
      mk(r`10^{n}`, r`10^{${M}}`),
      mk(r`e^{x}`, r`e^{${M}}`),
      mk(r`a^{-1}`, r`a^{-1}`),
      mk(r`x^{\frac{1}{2}}`, r`x^{\frac{${M}}{}}`),
      mk(r`\overline{AB}`, r`\overline{${M}}`),
      mk(r`\underline{x}`, r`\underline{${M}}`),
      mk(r`\%`),
      mk(r`a:b`),
    ],
  },
  {
    name: 'চিহ্ন ও তীর',
    items: list([
      '\\pm', '\\mp', '\\times', '\\div', '\\cdot', '\\ast', '\\leq', '\\geq', '\\neq', '\\approx', '\\simeq', '\\equiv',
      '\\cong', '\\sim', '\\propto', '\\ll', '\\gg', '\\infty', '\\therefore', '\\because', '\\circ', '\\bullet',
      '\\ldots', '\\cdots', '\\vdots', '\\ddots', '\\lfloor x\\rfloor', '\\lceil x\\rceil', '\\mid', '\\nmid',
      'a\\bmod b', 'a\\equiv b\\pmod{n}', "x'", "x''", '\\angle', '^{\\circ}',
      '\\to', '\\leftarrow', '\\leftrightarrow', '\\Rightarrow', '\\Leftarrow', '\\Leftrightarrow', '\\mapsto',
      '\\uparrow', '\\downarrow', '\\longrightarrow', '\\rightleftharpoons', '\\nearrow', '\\searrow',
    ]),
  },
  {
    name: 'সেট ও যুক্তি',
    items: [
      ...list([
        '\\in', '\\notin', '\\ni', '\\subset', '\\subseteq', '\\supset', '\\supseteq', '\\not\\subset', '\\cup', '\\cap',
        '\\setminus', '\\emptyset', '\\varnothing', "A'", 'A^{c}', '\\mathbb{N}', '\\mathbb{Z}', '\\mathbb{Q}',
        '\\mathbb{R}', '\\mathbb{C}', '\\mathbb{R}^{+}', '\\mathbb{R}^{n}', 'A\\cup B', 'A\\cap B', 'A\\setminus B',
        'A\\times B', 'A\\triangle B', '\\forall', '\\exists', '\\nexists', '\\neg', '\\land', '\\lor', '\\implies', '\\iff',
        '\\top', '\\bot', '\\mathcal{P}(A)', 'n(A)', '|A|',
      ]),
      mk(r`\{a,b,c\}`, r`\{${M}\}`),
      mk(r`\{x\mid x>0\}`, r`\{${M}\mid \}`),
      mk(r`\bigcup_{i=1}^{n}`, r`\bigcup_{i=1}^{${M}}`),
      mk(r`\bigcap_{i=1}^{n}`, r`\bigcap_{i=1}^{${M}}`),
      mk(r`[a,b]`, r`[${M},]`),
      mk(r`(a,b)`, r`(${M},)`),
      mk(r`[a,b)`, r`[${M},)`),
      mk(r`(a,b]`, r`(${M},]`),
    ],
  },
  {
    name: 'ত্রিকোণমিতি',
    items: [
      ...list([
        '\\sin\\theta', '\\cos\\theta', '\\tan\\theta', '\\cot\\theta', '\\sec\\theta', '\\csc\\theta',
        '\\sin^{2}\\theta', '\\cos^{2}\\theta', '\\sin^{-1}x', '\\cos^{-1}x', '\\tan^{-1}x',
        '\\arcsin x', '\\arccos x', '\\arctan x', '\\sinh x', '\\cosh x', '\\tanh x',
        '\\sin^{2}\\theta+\\cos^{2}\\theta=1', '1+\\tan^{2}\\theta=\\sec^{2}\\theta', '1+\\cot^{2}\\theta=\\csc^{2}\\theta',
        '\\sin(A\\pm B)', '\\cos(A\\pm B)', '\\tan(A\\pm B)',
        '\\sin 2\\theta=2\\sin\\theta\\cos\\theta', '\\cos 2\\theta=\\cos^{2}\\theta-\\sin^{2}\\theta',
        '\\tan\\theta=\\frac{\\sin\\theta}{\\cos\\theta}',
        '\\frac{a}{\\sin A}=\\frac{b}{\\sin B}=\\frac{c}{\\sin C}', 'a^{2}=b^{2}+c^{2}-2bc\\cos A',
        '30^{\\circ}', '45^{\\circ}', '60^{\\circ}', '90^{\\circ}', '180^{\\circ}=\\pi',
        '\\frac{\\pi}{2}', '\\frac{\\pi}{3}', '\\frac{\\pi}{4}', '\\frac{\\pi}{6}', '\\frac{\\sqrt{3}}{2}', '\\frac{1}{\\sqrt{2}}',
        '\\theta', '\\alpha', '\\beta', '\\gamma', '\\phi',
      ]),
      mk(r`\sin(x)`, r`\sin(${M})`),
      mk(r`\cos(x)`, r`\cos(${M})`),
      mk(r`\tan(x)`, r`\tan(${M})`),
    ],
  },
  {
    name: 'জ্যামিতি',
    items: [
      ...list([
        '\\angle', '\\angle ABC', '\\triangle ABC', '\\perp', '\\parallel', '\\cong', '\\sim', '\\overline{AB}',
        '\\overrightarrow{AB}', '\\overleftrightarrow{AB}', '\\widehat{ABC}', '\\overset{\\frown}{AB}', '\\odot', '\\bigcirc',
        '\\square', '\\mathrm{cm}^{2}', '\\mathrm{cm}^{3}', '\\mathrm{m}^{2}', '\\mathrm{m}^{3}',
        '\\pi r^{2}', '2\\pi r', '\\frac{1}{2}bh', '\\frac{1}{2}ab\\sin C', '\\pi r l', '\\frac{4}{3}\\pi r^{3}',
        '4\\pi r^{2}', '\\frac{1}{3}\\pi r^{2}h', 'a^{2}+b^{2}=c^{2}', '\\frac{n(n-3)}{2}', '(n-2)\\times 180^{\\circ}',
        '\\sqrt{s(s-a)(s-b)(s-c)}', '\\frac{\\sqrt{3}}{4}a^{2}',
        'y=mx+c', '\\frac{y_{2}-y_{1}}{x_{2}-x_{1}}', '\\sqrt{(x_{2}-x_{1})^{2}+(y_{2}-y_{1})^{2}}',
        '(x-h)^{2}+(y-k)^{2}=r^{2}', 'ax+by+c=0',
      ]),
      mk(r`(x,y)`, r`(${M},)`),
      mk(r`(x_{1},y_{1})`, r`(x_{${M}},y_{})`),
    ],
  },
  {
    name: 'বীজগণিত',
    items: [
      ...list([
        'f(x)', 'f^{-1}(x)', '(f\\circ g)(x)', '\\log_{a}x', '\\log_{10}x', '\\ln x',
        '\\log_{a}b=\\frac{\\log_{c}b}{\\log_{c}a}', '\\log(ab)=\\log a+\\log b', 'a^{m}\\cdot a^{n}=a^{m+n}',
        '(a+b)^{2}=a^{2}+2ab+b^{2}', '(a-b)^{2}=a^{2}-2ab+b^{2}', 'a^{2}-b^{2}=(a+b)(a-b)',
        '(a+b)^{3}=a^{3}+3a^{2}b+3ab^{2}+b^{3}', 'a^{3}+b^{3}=(a+b)(a^{2}-ab+b^{2})',
        'ax^{2}+bx+c=0', 'x=\\frac{-b\\pm\\sqrt{b^{2}-4ac}}{2a}', 'D=b^{2}-4ac',
        '\\alpha+\\beta=-\\frac{b}{a}', '\\alpha\\beta=\\frac{c}{a}',
        'a_{n}=a+(n-1)d', 'S_{n}=\\frac{n}{2}\\left(2a+(n-1)d\\right)', 'a_{n}=ar^{n-1}',
        'S_{n}=\\frac{a(r^{n}-1)}{r-1}', 'S_{\\infty}=\\frac{a}{1-r}',
        '\\sum_{k=1}^{n}k=\\frac{n(n+1)}{2}', '(1+x)^{n}=\\sum_{k=0}^{n}\\binom{n}{k}x^{k}',
        'a<x<b', '\\max', '\\min', '\\gcd(a,b)', '\\operatorname{lcm}(a,b)',
      ]),
      mk(r`\begin{cases}x&\text{if }x\geq 0\\-x&\text{if }x<0\end{cases}`, r`\begin{cases} ${M} & \\ & \end{cases}`),
      mk(
        r`\begin{cases}a_{1}x+b_{1}y=c_{1}\\a_{2}x+b_{2}y=c_{2}\end{cases}`,
        r`\begin{cases} a_{1}x+b_{1}y=c_{1} \\ a_{2}x+b_{2}y=c_{2} \end{cases}`
      ),
    ],
  },
  {
    name: 'জটিল সংখ্যা',
    items: list([
      'i^{2}=-1', '\\sqrt{-1}', 'z=a+ib', '\\bar{z}', '|z|=\\sqrt{a^{2}+b^{2}}', '\\arg z', '\\mathrm{Re}(z)', '\\mathrm{Im}(z)',
      'z=r(\\cos\\theta+i\\sin\\theta)', 'e^{i\\theta}=\\cos\\theta+i\\sin\\theta', '\\omega', '\\omega^{2}', '1+\\omega+\\omega^{2}=0',
      '\\mathbb{C}',
    ]),
  },
  {
    name: 'ক্যালকুলাস',
    items: [
      mk(r`\lim_{x\to 0}`, r`\lim_{x \to ${M}}`),
      mk(r`\lim_{x\to\infty}`, r`\lim_{x \to \infty} ${M}`),
      mk(r`\lim_{h\to 0}\frac{f(x+h)-f(x)}{h}`),
      mk(r`\frac{dy}{dx}`),
      mk(r`\frac{d}{dx}`, r`\frac{d}{dx}(${M})`),
      mk(r`\frac{d^{2}y}{dx^{2}}`),
      mk(r`f'(x)`), mk(r`f''(x)`),
      mk(r`\frac{\partial f}{\partial x}`),
      mk(r`\frac{\partial^{2}f}{\partial x^{2}}`),
      ...list(['\\partial', '\\nabla', '\\Delta x', 'dx', 'dy', 'dt']),
      mk(r`\int`, r`\int ${M}\,dx`),
      mk(r`\int_{a}^{b}`, r`\int_{${M}}^{} f(x)\,dx`),
      mk(r`\int_{0}^{\infty}`, r`\int_{0}^{\infty} ${M}\,dx`),
      mk(r`\iint`, r`\iint ${M}\,dA`),
      mk(r`\iiint`, r`\iiint ${M}\,dV`),
      mk(r`\oint`, r`\oint ${M}`),
      mk(r`\left[F(x)\right]_{a}^{b}`),
      mk(r`\left.\frac{dy}{dx}\right|_{x=a}`),
      mk(r`\int u\,dv=uv-\int v\,du`),
      mk(r`\int x^{n}dx=\frac{x^{n+1}}{n+1}+C`),
      mk(r`\frac{d}{dx}(x^{n})=nx^{n-1}`),
      mk(r`\frac{d}{dx}(\sin x)=\cos x`),
      mk(r`\frac{d}{dx}(e^{x})=e^{x}`),
      mk(r`\frac{d}{dx}(\ln x)=\frac{1}{x}`),
      mk(r`\frac{dy}{dx}=\frac{dy}{du}\cdot\frac{du}{dx}`),
      mk(r`\sum_{i=1}^{n}`, r`\sum_{i=1}^{${M}}`),
      mk(r`\sum_{n=1}^{\infty}`, r`\sum_{n=1}^{\infty} ${M}`),
      mk(r`\prod_{i=1}^{n}`, r`\prod_{i=1}^{${M}}`),
    ],
  },
  {
    name: 'ম্যাট্রিক্স ও ভেক্টর',
    items: [
      mk(r`\begin{pmatrix}a&b\\c&d\end{pmatrix}`, r`\begin{pmatrix} ${M} & \\ & \end{pmatrix}`),
      mk(r`\begin{pmatrix}a&b&c\\d&e&f\\g&h&i\end{pmatrix}`, r`\begin{pmatrix} ${M} & & \\ & & \\ & & \end{pmatrix}`),
      mk(r`\begin{bmatrix}a&b\\c&d\end{bmatrix}`, r`\begin{bmatrix} ${M} & \\ & \end{bmatrix}`),
      mk(r`\begin{vmatrix}a&b\\c&d\end{vmatrix}`, r`\begin{vmatrix} ${M} & \\ & \end{vmatrix}`),
      mk(r`\begin{vmatrix}a&b&c\\d&e&f\\g&h&i\end{vmatrix}`, r`\begin{vmatrix} ${M} & & \\ & & \\ & & \end{vmatrix}`),
      mk(r`\begin{pmatrix}1&0\\0&1\end{pmatrix}`),
      mk(r`\begin{pmatrix}x\\y\end{pmatrix}`, r`\begin{pmatrix} ${M} \\ \end{pmatrix}`),
      mk(r`\begin{pmatrix}x\\y\\z\end{pmatrix}`, r`\begin{pmatrix} ${M} \\ \\ \end{pmatrix}`),
      mk(r`\begin{pmatrix}a&b&c\end{pmatrix}`, r`\begin{pmatrix} ${M} & & \end{pmatrix}`),
      ...list(['A^{T}', 'A^{-1}', '\\det A', '|A|', 'A^{2}', 'AB=BA']),
      mk(r`\vec{a}`, r`\vec{${M}}`),
      mk(r`\overrightarrow{AB}`, r`\overrightarrow{${M}}`),
      mk(r`\mathbf{a}`, r`\mathbf{${M}}`),
      ...list(['\\hat{i}', '\\hat{j}', '\\hat{k}', '\\hat{n}']),
      mk(r`\hat{a}`, r`\hat{${M}}`),
      mk(r`\vec{a}\cdot\vec{b}`),
      mk(r`\vec{a}\times\vec{b}`),
      mk(r`\left|\vec{a}\right|`, r`\left|\vec{${M}}\right|`),
      mk(r`\vec{a}\cdot\vec{b}=|\vec{a}||\vec{b}|\cos\theta`),
      mk(r`a\hat{i}+b\hat{j}+c\hat{k}`, r`${M}\hat{i}+\hat{j}+\hat{k}`),
      mk(r`\nabla\cdot\vec{F}`), mk(r`\nabla\times\vec{F}`), mk(r`\nabla^{2}`),
    ],
  },
  {
    name: 'পরিসংখ্যান',
    items: [
      ...list([
        '\\bar{x}', '\\bar{y}', '\\tilde{x}', '\\mu', '\\sigma', '\\sigma^{2}', '\\bar{x}=\\frac{\\sum x_{i}}{n}',
        '\\bar{x}=\\frac{\\sum f_{i}x_{i}}{\\sum f_{i}}', '\\sigma=\\sqrt{\\frac{\\sum(x_{i}-\\bar{x})^{2}}{n}}',
        'P(A)', 'P(A\\cup B)', 'P(A\\cap B)', 'P(A\\mid B)', "P(A')", 'P(A)=\\frac{n(A)}{n(S)}',
        'P(A\\cap B)=P(A)P(B)', 'P(A\\mid B)=\\frac{P(A\\cap B)}{P(B)}',
        'E(X)', '\\mathrm{Var}(X)', '\\sum_{i=1}^{n}x_{i}', '\\sum fx', 'Q_{1}', 'Q_{3}', '\\chi^{2}', '\\hat{p}',
        'z=\\frac{x-\\mu}{\\sigma}', 'X\\sim N(\\mu,\\sigma^{2})', '\\binom{n}{r}p^{r}q^{n-r}',
        'r=\\frac{\\mathrm{Cov}(x,y)}{\\sigma_{x}\\sigma_{y}}', '\\rho',
      ]),
    ],
  },
  { name: 'গ্রিক অক্ষর', items: GREEK },
];

// ================================================================ পদার্থ
const PHYSICS = [
  {
    name: 'প্রতীক ও ভেক্টর',
    items: [
      mk(r`\vec{F}`, r`\vec{${M}}`),
      ...list(['\\vec{v}', '\\vec{a}', '\\vec{r}', '\\vec{p}', '\\vec{E}', '\\vec{B}', '\\vec{L}', '\\vec{\\tau}', '\\hat{n}', '\\hat{r}', '\\hat{i}', '\\hat{j}', '\\hat{k}']),
      mk(r`\left|\vec{F}\right|`, r`\left|\vec{${M}}\right|`),
      mk(r`\vec{A}\cdot\vec{B}`), mk(r`\vec{A}\times\vec{B}`),
      mk(r`\Delta x`, r`\Delta ${M}`),
      mk(r`\frac{\Delta v}{\Delta t}`),
      mk(r`\frac{dv}{dt}`), mk(r`\frac{d\vec{r}}{dt}`), mk(r`\frac{d^{2}x}{dt^{2}}`),
      ...list(['\\dot{x}', '\\ddot{x}', '\\nabla', '\\partial', '\\oint', '\\int', '\\sum', '\\propto', '\\approx', '\\ll', '\\gg', '\\pm', '\\cdot', '\\times', '\\infty']),
      mk(r`\sqrt{x}`, r`\sqrt{${M}}`),
      mk(r`x^{2}`, r`x^{${M}}`),
      mk(r`x_{0}`, r`x_{${M}}`),
      mk(r`v_{0}`), mk(r`v_{\max}`), mk(r`v_{\mathrm{avg}}`), mk(r`\overline{v}`),
      mk(r`10^{-3}`, r`10^{${M}}`),
      mk(r`\times 10^{-19}`, r`\times 10^{${M}}`),
      ...list(['^{\\circ}', '\\odot', '\\otimes', '\\uparrow', '\\downarrow', '\\rightarrow', '\\leftrightarrow']),
    ],
  },
  {
    name: 'বলবিদ্যা',
    items: list([
      'v=u+at', 's=ut+\\frac{1}{2}at^{2}', 'v^{2}=u^{2}+2as', '\\vec{F}=m\\vec{a}', '\\vec{p}=m\\vec{v}', 'F=\\frac{\\Delta p}{\\Delta t}',
      'W=Fs\\cos\\theta', 'W=\\vec{F}\\cdot\\vec{s}', 'K=\\frac{1}{2}mv^{2}', 'U=mgh', 'P=\\frac{W}{t}', 'P=Fv',
      'F=G\\frac{m_{1}m_{2}}{r^{2}}', 'g=\\frac{GM}{R^{2}}', 'v_{e}=\\sqrt{2gR}',
      '\\tau=rF\\sin\\theta', 'I=mr^{2}', 'L=I\\omega', '\\omega=\\frac{2\\pi}{T}', 'v=\\omega r',
      'a_{c}=\\frac{v^{2}}{r}', 'F_{c}=\\frac{mv^{2}}{r}', 'f=\\mu N', 'F=-kx', 'U=\\frac{1}{2}kx^{2}',
      'T=2\\pi\\sqrt{\\frac{l}{g}}', 'T=2\\pi\\sqrt{\\frac{m}{k}}',
      '\\rho=\\frac{m}{V}', 'P=\\frac{F}{A}', 'P=\\rho gh', 'F=6\\pi\\eta rv',
      '\\mathrm{Stress}=\\frac{F}{A}', 'Y=\\frac{F/A}{\\Delta l/l}', 'e=\\frac{v_{2}-v_{1}}{u_{1}-u_{2}}',
    ]),
  },
  {
    name: 'তাপ',
    items: list([
      'Q=mc\\Delta T', 'Q=mL', 'PV=nRT', '\\frac{P_{1}V_{1}}{T_{1}}=\\frac{P_{2}V_{2}}{T_{2}}', 'P_{1}V_{1}=P_{2}V_{2}',
      '\\Delta U=Q-W', 'W=P\\Delta V', '\\eta=1-\\frac{T_{2}}{T_{1}}', '\\frac{1}{2}mv^{2}=\\frac{3}{2}kT',
      'v_{rms}=\\sqrt{\\frac{3RT}{M}}', '\\Delta S=\\frac{Q}{T}', '\\Delta L=\\alpha L\\Delta T',
      '\\frac{dQ}{dt}=-kA\\frac{dT}{dx}', '\\gamma=\\frac{C_{p}}{C_{v}}', 'PV^{\\gamma}=\\mathrm{constant}',
      'E=\\sigma T^{4}', '\\lambda_{m}T=b', 'C_{p}-C_{v}=R',
      '^{\\circ}\\mathrm{C}', '\\mathrm{K}', '^{\\circ}\\mathrm{F}',
    ]),
  },
  {
    name: 'তরঙ্গ ও আলো',
    items: list([
      'v=f\\lambda', 'f=\\frac{1}{T}', 'k=\\frac{2\\pi}{\\lambda}', 'y=A\\sin(\\omega t-kx)', 'v=\\sqrt{\\frac{T}{\\mu}}',
      "f'=f\\frac{v\\pm v_{o}}{v\\mp v_{s}}", 'I=\\frac{P}{A}', '\\beta=10\\log\\frac{I}{I_{0}}',
      'd\\sin\\theta=n\\lambda', '\\beta=\\frac{\\lambda D}{d}', 'f_{n}=\\frac{nv}{2L}',
      'n=\\frac{\\sin i}{\\sin r}', 'n=\\frac{c}{v}', '\\frac{1}{f}=\\frac{1}{v}-\\frac{1}{u}', '\\frac{1}{f}=\\frac{1}{v}+\\frac{1}{u}',
      'm=\\frac{v}{u}', 'P=\\frac{1}{f}', '\\frac{1}{f}=(n-1)\\left(\\frac{1}{R_{1}}-\\frac{1}{R_{2}}\\right)',
      '\\sin\\theta_{c}=\\frac{1}{n}', '\\tan i_{p}=n', 'c=\\nu\\lambda', 'E=h\\nu',
      'I=I_{0}\\cos^{2}\\theta', '\\delta=\\frac{2\\pi}{\\lambda}\\Delta x',
    ]),
  },
  {
    name: 'তড়িৎ-চুম্বক',
    items: list([
      'F=k\\frac{q_{1}q_{2}}{r^{2}}', 'k=\\frac{1}{4\\pi\\epsilon_{0}}', '\\vec{E}=\\frac{\\vec{F}}{q}', 'E=k\\frac{q}{r^{2}}', 'V=k\\frac{q}{r}',
      'C=\\frac{Q}{V}', 'U=\\frac{1}{2}CV^{2}', 'C=\\frac{\\epsilon_{0}A}{d}', 'V=IR', 'R=\\rho\\frac{l}{A}', 'P=VI', 'P=I^{2}R', 'H=I^{2}Rt',
      'R_{s}=R_{1}+R_{2}', '\\frac{1}{R_{p}}=\\frac{1}{R_{1}}+\\frac{1}{R_{2}}', '\\varepsilon=V+Ir',
      '\\oint\\vec{E}\\cdot d\\vec{A}=\\frac{q}{\\epsilon_{0}}', '\\vec{F}=q(\\vec{E}+\\vec{v}\\times\\vec{B})', 'F=BIl\\sin\\theta',
      'B=\\frac{\\mu_{0}I}{2\\pi r}', 'B=\\mu_{0}nI', '\\Phi=BA\\cos\\theta', '\\varepsilon=-\\frac{d\\Phi}{dt}', '\\varepsilon=-L\\frac{dI}{dt}',
      'X_{L}=\\omega L', 'X_{C}=\\frac{1}{\\omega C}', 'Z=\\sqrt{R^{2}+(X_{L}-X_{C})^{2}}', 'f_{0}=\\frac{1}{2\\pi\\sqrt{LC}}',
      '\\frac{V_{s}}{V_{p}}=\\frac{N_{s}}{N_{p}}', 'I_{rms}=\\frac{I_{0}}{\\sqrt{2}}', '\\oint\\vec{B}\\cdot d\\vec{l}=\\mu_{0}I',
      '\\epsilon_{0}', '\\mu_{0}',
    ]),
  },
  {
    name: 'আধুনিক পদার্থ',
    items: [
      ...list([
        'E=mc^{2}', 'E=h\\nu', '\\lambda=\\frac{h}{p}', 'K_{\\max}=h\\nu-\\phi', 'eV_{0}=K_{\\max}',
        '\\frac{1}{\\lambda}=R\\left(\\frac{1}{n_{1}^{2}}-\\frac{1}{n_{2}^{2}}\\right)', 'E_{n}=-\\frac{13.6}{n^{2}}\\,\\mathrm{eV}',
        'r_{n}=\\frac{n^{2}h^{2}}{4\\pi^{2}mke^{2}}', 'N=N_{0}e^{-\\lambda t}', 'T_{1/2}=\\frac{\\ln 2}{\\lambda}',
        '\\Delta E=\\Delta m\\,c^{2}', '\\Delta x\\,\\Delta p\\geq\\frac{\\hbar}{2}', '\\gamma=\\frac{1}{\\sqrt{1-v^{2}/c^{2}}}',
        '\\hat{H}\\psi=E\\psi', '\\left|\\psi\\right|^{2}', '\\hbar', '\\nu', '\\bar{\\nu}', '\\alpha', '\\beta', '\\gamma',
      ]),
      ce('^{A}_{Z}X'),
      ce('^{4}_{2}He'), ce('^{0}_{-1}e'), ce('^{1}_{0}n'), ce('^{1}_{1}p'),
      ce('^{238}_{92}U -> ^{234}_{90}Th + ^{4}_{2}He'),
    ],
  },
  {
    name: 'একক',
    items: [
      pu('m s^-1'), pu('m s^-2'), pu('kg m s^-1'), pu('N'), pu('N m'), pu('J'), pu('W'), pu('Pa'), pu('Hz'),
      pu('kg m^2'), pu('rad s^-1'), pu('kg m^-3'), pu('N m^-2'), pu('J kg^-1 K^-1'), pu('J mol^-1 K^-1'),
      pu('C'), pu('V'), pu('A'), pu('F'), pu('H'), pu('T'), pu('Wb'), pu('K'), pu('mol'), pu('cd'), pu('eV'),
      pu('V m^-1'), pu('N C^-1'), pu('W m^-2'), pu('km h^-1'), pu('m^2'), pu('m^3'),
      pu('kg'), pu('g'), pu('m'), pu('cm'), pu('mm'), pu('km'), pu('nm'), pu('s'), pu('ms'),
      mk(r`\Omega`, r`${M}\,\Omega`),
      mk(r`\mu\mathrm{F}`, r`${M}\,\mu\mathrm{F}`),
      mk(r`\mu\mathrm{m}`, r`${M}\,\mu\mathrm{m}`),
      mk(r`\mu\mathrm{A}`, r`${M}\,\mu\mathrm{A}`),
      mk(r`\mathring{A}`, r`${M}\,\mathring{A}`),
    ],
  },
  {
    name: 'ধ্রুবক',
    items: [
      mk(r`g=9.8`, r`g=9.8\,\pu{m s^-2}`),
      mk(r`G=6.67\times10^{-11}`, r`G=6.67\times10^{-11}\,\pu{N m^2 kg^-2}`),
      mk(r`c=3\times10^{8}`, r`c=3\times10^{8}\,\pu{m s^-1}`),
      mk(r`h=6.63\times10^{-34}`, r`h=6.63\times10^{-34}\,\pu{J s}`),
      mk(r`e=1.6\times10^{-19}`, r`e=1.6\times10^{-19}\,\pu{C}`),
      mk(r`m_{e}=9.11\times10^{-31}`, r`m_{e}=9.11\times10^{-31}\,\pu{kg}`),
      mk(r`m_{p}=1.67\times10^{-27}`, r`m_{p}=1.67\times10^{-27}\,\pu{kg}`),
      mk(r`k_{B}=1.38\times10^{-23}`, r`k_{B}=1.38\times10^{-23}\,\pu{J K^-1}`),
      mk(r`N_{A}=6.022\times10^{23}`, r`N_{A}=6.022\times10^{23}\,\pu{mol^-1}`),
      mk(r`R=8.314`, r`R=8.314\,\pu{J mol^-1 K^-1}`),
      mk(r`\epsilon_{0}=8.85\times10^{-12}`, r`\epsilon_{0}=8.85\times10^{-12}\,\pu{F m^-1}`),
      mk(r`\mu_{0}=4\pi\times10^{-7}`, r`\mu_{0}=4\pi\times10^{-7}\,\pu{H m^-1}`),
      mk(r`k=9\times10^{9}`, r`k=9\times10^{9}\,\pu{N m^2 C^-2}`),
      mk(r`\sigma=5.67\times10^{-8}`, r`\sigma=5.67\times10^{-8}\,\pu{W m^-2 K^-4}`),
      mk(r`1\,\mathrm{eV}=1.6\times10^{-19}\,\mathrm{J}`),
      mk(r`1\,\mathrm{u}=931.5\,\mathrm{MeV}`),
    ],
  },
  { name: 'গ্রিক অক্ষর', items: GREEK },
];

// ================================================================ রসায়ন
const CHEMISTRY = [
  {
    name: 'যৌগ',
    items: [
      ce('H2O'), ce('CO2'), ce('CO'), ce('O2'), ce('O3'), ce('N2'), ce('H2'), ce('Cl2'), ce('NH3'), ce('CH4'),
      ce('HCl'), ce('HNO3'), ce('H2SO4'), ce('H3PO4'), ce('H2CO3'), ce('H2O2'), ce('H2S'),
      ce('NaOH'), ce('KOH'), ce('Ca(OH)2'), ce('NaCl'), ce('CaCO3'), ce('NaHCO3'), ce('Na2CO3'), ce('CaO'),
      ce('Al2O3'), ce('Fe2O3'), ce('SO2'), ce('SO3'), ce('NO2'), ce('NH4Cl'), ce('KMnO4'), ce('K2Cr2O7'),
      ce('AgNO3'), ce('BaSO4'), ce('CuSO4.5H2O'), ce('C6H12O6'), ce('C2H5OH'),
      ce('NaCl(aq)'), ce('H2O(l)'), ce('CO2(g)'), ce('CaCO3(s)'),
    ],
  },
  {
    name: 'আয়ন ও ইলেকট্রন',
    items: [
      ce('H+'), ce('OH-'), ce('H3O+'), ce('NH4+'), ce('Na+'), ce('K+'), ce('Cl-'), ce('NO3-'), ce('HCO3-'),
      ce('Ca^{2+}'), ce('Mg^{2+}'), ce('Cu^{2+}'), ce('Zn^{2+}'), ce('Fe^{2+}'), ce('Fe^{3+}'), ce('Al^{3+}'),
      ce('SO4^{2-}'), ce('CO3^{2-}'), ce('PO4^{3-}'), ce('MnO4-'), ce('Cr2O7^{2-}'),
      ce('[Cu(NH3)4]^{2+}'), ce('[Fe(CN)6]^{4-}'), ce('e-'),
      ce('Fe^{II}'), ce('Fe^{III}'),
      mk(r`\overset{+3}{\ce{Fe}}`, r`\overset{+${M}}{\ce{}}`),
      mk(r`\overset{-1}{\ce{Cl}}`, r`\overset{-${M}}{\ce{}}`),
      ce('Zn -> Zn^{2+} + 2e-'),
      ce('Cu^{2+} + 2e- -> Cu'),
      ce('MnO4- + 8H+ + 5e- -> Mn^{2+} + 4H2O'),
    ],
  },
  {
    name: 'বিক্রিয়া ও তীর',
    items: [
      ce('A -> B', `${M} -> `),
      ce('A <=> B', `${M} <=> `),
      ce('A <-> B', `${M} <-> `),
      ce('A <- B', `${M} <- `),
      ce('A <=>> B', `${M} <=>> `),
      ce('A <<=> B', `${M} <<=> `),
      ce('A ->[\\Delta] B', `${M} ->[\\Delta] `),
      ce('A ->[catalyst] B', `${M} ->[catalyst] `),
      ce('A ->[h\\nu] B', `${M} ->[h\\nu] `),
      ce('A ->[H2SO4][\\Delta] B', `${M} ->[H2SO4][\\Delta] `),
      ce('A + B -> C + D', `${M} + -> + `),
      ce('2H2 + O2 -> 2H2O'),
      ce('N2 + 3H2 <=> 2NH3'),
      ce('HCl + NaOH -> NaCl + H2O'),
      ce('2Na + 2H2O -> 2NaOH + H2 ^'),
      ce('CaCO3 ->[\\Delta] CaO + CO2 ^'),
      ce('AgNO3 + NaCl -> AgCl v + NaNO3'),
      ce('Zn + Cu^{2+} -> Zn^{2+} + Cu'),
      ce('2H2O ->[\\text{electrolysis}] 2H2 + O2'),
      ce('AgCl v'), ce('CO2 ^'),
      ce('NaCl(aq)'), ce('NaCl(s)'), ce('H2O(l)'), ce('H2O(g)'),
    ],
  },
  {
    name: 'জৈব রসায়ন',
    items: [
      ce('CH3-CH3'), ce('CH2=CH2'), ce('CH#CH'), ce('CH3-CH2-OH'), ce('CH3-CHO'), ce('CH3-CO-CH3'), ce('CH3-COOH'),
      ce('CH3-COO-CH3'), ce('CH3-NH2'), ce('CH3Cl'), ce('CHCl3'), ce('CCl4'), ce('C2H5-Br'),
      ce('R-OH'), ce('R-CHO'), ce('R-COOH'), ce('R-NH2'), ce('R-X'),
      ce('C6H6'), ce('C6H5-OH'), ce('C6H5-NH2'), ce('C6H5-COOH'), ce('C6H5-CH3'),
      ce('C_{n}H_{2n+2}'), ce('C_{n}H_{2n}'), ce('C_{n}H_{2n-2}'),
      ce('-OH'), ce('-CHO'), ce('-COOH'), ce('-NH2'), ce('-NO2'),
      ce('CH3COOH + C2H5OH <=>[H+] CH3COOC2H5 + H2O'),
      ce('CH2=CH2 + H2 ->[Ni] CH3-CH3'),
    ],
  },
  {
    name: 'পরমাণু ও নিউক্লিয়ার',
    items: [
      ce('^{14}_{6}C'), ce('^{12}_{6}C'), ce('^{235}_{92}U'), ce('^{238}_{92}U'), ce('^{1}_{1}H'), ce('^{2}_{1}H'), ce('^{3}_{1}H'),
      ce('^{4}_{2}He'), ce('^{60}_{27}Co'), ce('^{0}_{-1}e'), ce('^{0}_{+1}e'), ce('^{1}_{0}n'),
      ce('^{238}_{92}U -> ^{234}_{90}Th + ^{4}_{2}He'),
      ce('^{14}_{6}C -> ^{14}_{7}N + ^{0}_{-1}e'),
      ...list([
        '\\alpha', '\\beta^{-}', '\\beta^{+}', '\\gamma', '1s^{2}2s^{2}2p^{6}', '[\\mathrm{Ne}]3s^{2}3p^{3}', '[\\mathrm{Ar}]3d^{5}4s^{1}',
        'n', 'l', 'm_{l}', 'm_{s}', '\\uparrow\\downarrow', '\\lambda=\\frac{h}{mv}', 'E_{n}=-\\frac{13.6}{n^{2}}\\,\\mathrm{eV}',
        '\\Delta E=h\\nu', 'N=N_{0}e^{-\\lambda t}', 'T_{1/2}=\\frac{0.693}{\\lambda}',
      ]),
    ],
  },
  {
    name: 'রাশি ও সূত্র',
    items: list([
      '\\mathrm{pH}=-\\log[\\ce{H+}]', '\\mathrm{pOH}=-\\log[\\ce{OH-}]', '\\mathrm{pH}+\\mathrm{pOH}=14',
      'K_{c}=\\frac{[\\mathrm{C}]^{c}[\\mathrm{D}]^{d}}{[\\mathrm{A}]^{a}[\\mathrm{B}]^{b}}', 'K_{p}', 'K_{c}', 'K_{a}', 'K_{b}', 'K_{w}=[\\ce{H+}][\\ce{OH-}]', 'K_{\\mathrm{sp}}',
      '\\Delta H', '\\Delta H^{\\circ}', '\\Delta H_{f}^{\\circ}', '\\Delta S', '\\Delta G=\\Delta H-T\\Delta S', '\\Delta G^{\\circ}=-RT\\ln K',
      'E^{\\circ}_{\\mathrm{cell}}', 'E=E^{\\circ}-\\frac{RT}{nF}\\ln Q', 'PV=nRT', '\\frac{P_{1}V_{1}}{T_{1}}=\\frac{P_{2}V_{2}}{T_{2}}',
      'n=\\frac{m}{M}', 'C=\\frac{n}{V}', 'M_{1}V_{1}=M_{2}V_{2}', '\\chi_{A}=\\frac{n_{A}}{n_{A}+n_{B}}',
      '\\Delta T_{b}=K_{b}\\,m', '\\Delta T_{f}=K_{f}\\,m', '\\Pi=CRT',
      'k=Ae^{-E_{a}/RT}', '\\mathrm{rate}=k[\\mathrm{A}]^{m}[\\mathrm{B}]^{n}', 't_{1/2}=\\frac{0.693}{k}', '\\ln\\frac{[\\mathrm{A}]_{0}}{[\\mathrm{A}]}=kt',
      'Q=It', 'w=ZIt', '\\mathrm{pK}_{a}=-\\log K_{a}',
    ]),
  },
  {
    name: 'একক',
    items: [
      pu('mol L-1'), pu('g mol-1'), pu('kJ mol-1'), pu('J K-1 mol-1'), pu('J mol-1'), pu('mol'), pu('L'), pu('mL'),
      pu('atm'), pu('Pa'), pu('mmHg'), pu('K'), pu('g cm-3'), pu('g L-1'), pu('ppm'), pu('M'),
      pu('L atm K-1 mol-1'), pu('C mol-1'), pu('V'), pu('nm'), pu('pm'), pu('g'), pu('kg'), pu('mg'), pu('s'), pu('min'),
      mk(r`^{\circ}\mathrm{C}`, r`${M}\,^{\circ}\mathrm{C}`),
      mk(r`\mathring{A}`, r`${M}\,\mathring{A}`),
      mk(r`R=8.314`, r`R=8.314\,\pu{J K-1 mol-1}`),
      mk(r`N_{A}=6.022\times10^{23}`, r`N_{A}=6.022\times10^{23}\,\pu{mol-1}`),
      mk(r`F=96500`, r`F=96500\,\pu{C mol-1}`),
    ],
  },
  {
    name: 'প্রতীক',
    items: list([
      '\\Delta', '\\delta^{+}', '\\delta^{-}', '\\sigma', '\\pi', '\\alpha', '\\beta', '\\gamma', '\\lambda', '\\nu', '\\mu', '\\eta', '\\rho', '\\chi',
      '\\oplus', '\\ominus', '\\cdot', '\\bullet', '\\rightleftharpoons', '\\longrightarrow', '\\uparrow', '\\downarrow',
      '\\mathrm{sp}^{3}', '\\mathrm{sp}^{2}', '\\mathrm{sp}', '\\mathrm{pH}', '\\mathrm{pOH}', '\\mathrm{pK}_{a}',
      '^{\\circ}\\mathrm{C}', '\\pm', '\\approx', '\\propto', '\\times', '\\infty', '\\mathring{A}',
    ]),
  },
];

export const GROUPS = [
  { name: 'গণিত', sections: MATH },
  { name: 'পদার্থ', sections: PHYSICS },
  { name: 'রসায়ন', sections: CHEMISTRY },
];
