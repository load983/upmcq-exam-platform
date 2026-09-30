# 📝 Live MCQ Exam Platform

PDF আপলোড করে অটোমেটিক Live MCQ পরীক্ষা তৈরি করার ফুল-স্ট্যাক ওয়েব অ্যাপ।

## স্ট্যাক
- **Frontend:** React + Redux Toolkit + React Router + Tailwind CSS (Vite)
- **Backend:** Node.js + Express.js
- **Database:** MongoDB (Mongoose)
- **PDF Parsing:** pdf-parse (আপলোড হওয়া PDF থেকে টেক্সট বের করে প্রশ্ন পার্স করে)
- **Word Parsing:** mammoth (.docx) ও word-extractor (.doc) — সাব/সুপারস্ক্রিপ্ট (H₂O, x²) থাকে; Word-এর Equation Editor-এর সূত্র বাদ পড়ে
- **Auth:** JWT (Teacher ও Student এর জন্য আলাদা role)
- **Excel Export:** exceljs
- **Result PDF:** pdfkit

## ফোল্ডার স্ট্রাকচার
```
mcq-exam-platform/
├── backend/
│   ├── server.js               # এন্ট্রি পয়েন্ট
│   ├── config/db.js            # MongoDB কানেকশন
│   ├── models/                 # User, Exam, Question, Attempt
│   ├── middleware/              # auth.js (JWT), upload.js (multer)
│   ├── controllers/            # authController, examController, attemptController
│   ├── routes/                 # authRoutes, examRoutes, attemptRoutes
│   ├── utils/                  # pdfParser.js, excelExport.js
│   └── uploads/                # আপলোড করা PDF ফাইল এখানে জমা হয়
└── frontend/
    ├── src/
    │   ├── app/store.js         # Redux store
    │   ├── features/            # auth, exam, attempt — Redux slices
    │   ├── api/axiosClient.js   # কেন্দ্রীয় axios instance
    │   ├── components/          # Navbar, Timer, QuestionPalette, PrivateRoute...
    │   └── pages/
    │       ├── teacher/         # Login, Register, Dashboard, UploadExam, ExamEditor, ResultDashboard
    │       └── student/         # StudentJoin, StudentExam, StudentResult
    └── ...vite/tailwind config
```

## PDF এর প্রয়োজনীয় ফরম্যাট
পার্সার এই প্যাটার্নটা খোঁজে (প্রতিটা প্রশ্নের জন্য):
```
1. বাংলাদেশের রাজধানীর নাম কী?
A. ঢাকা
B. চট্টগ্রাম
C. রাজশাহী
D. খুলনা
Answer: A

2. ...
```
- প্রশ্ন নম্বর দিয়ে শুরু (`1.` বা `1)`)
- অপশনগুলো `A.`/`B.`/`C.`/`D.` দিয়ে শুরু (কমপক্ষে ২টা অপশন থাকতে হবে)
- সঠিক উত্তর `Answer: <letter>` লাইনে থাকতে হবে

## রান করার উপায়

### ১. Backend
```bash
cd backend
npm install
cp .env.example .env   # তারপর .env এ MONGO_URI, JWT_SECRET বসাও
npm run dev            # http://localhost:5000
```

### ২. Frontend
```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL ঠিক আছে কিনা চেক করো
npm run dev            # http://localhost:5173
```

MongoDB লোকালি চালাতে চাইলে `mongod` চালু করো, অথবা MongoDB Atlas এর কানেকশন স্ট্রিং `.env` এ দাও।

## মূল ফিচার চেকলিস্ট
- [x] PDF আপলোড → অটো MCQ পার্স
- [x] প্রশ্ন Edit / Delete / Add / Reorder (ব্যাকএন্ড রেডি; Reorder API আছে, UI তে drag-drop যোগ করা যাবে)
- [x] Exam Settings: সময়, মার্কস, প্রশ্নসংখ্যা, Negative Marking, Shuffle Questions/Options, Instant Result
- [x] Exam Schedule (Start/End time)
- [x] শেয়ারযোগ্য লিংক + ঐচ্ছিক Access Code
- [x] Result Dashboard + Excel Export
- [x] Student List with IP Address
- [x] Student Join (নাম/রোল/ফোন), Live Timer, Auto Submit, Anytime Submit
- [x] Question Palette (Answered/Skipped)
- [x] Submit এর আগে উত্তর হাইড থাকে
- [x] Result + সঠিক উত্তরসহ PDF ডাউনলোড
- [x] একবার Submit করলে আবার দেয়া যাবে না (DB unique index + স্ট্যাটাস চেক)
- [x] ট্যাব পরিবর্তনে Warning
- [x] Dark Mode
- [x] Formula: Total Marks = (Correct × Marks) − (Wrong × Negative Marks)

## পরবর্তী উন্নয়নের সাজেশন
- প্রশ্ন Add/Reorder এর জন্য UI (API আগে থেকেই আছে)
- ফরগট পাসওয়ার্ড / ইমেইল ভেরিফিকেশন
- WebSocket দিয়ে সত্যিকারের রিয়েল-টাইম মনিটরিং (এখন REST + client-side timer ব্যবহার হয়েছে)
- Rate limiting ও input sanitization যোগ করা প্রোডাকশনের আগে জরুরি

---

## 💳 সাবস্ক্রিপশন সিস্টেম

- শিক্ষক প্ল্যান কিনলে (ম্যানুয়াল TrxID + অ্যাডমিন approve, অথবা SSLCommerz অনলাইন পেমেন্ট) নির্দিষ্ট মেয়াদে সব ফিচার পায়।
- মেয়াদ শেষ/স্থগিত হলে শিক্ষকের সব রুট `402` দেয় এবং তার ছাত্ররা নতুন করে পরীক্ষা শুরু করতে পারে না (আগে থেকে শুরু করা পরীক্ষা শেষ করা যায়)।
- **অ্যাডমিন:** `backend/.env`-এ `ADMIN_EMAIL` ও `ADMIN_PASSWORD` দাও, সার্ভার রিস্টার্ট করলেই অ্যাডমিন তৈরি হয়। শুধু এই ইমেইল-পাসওয়ার্ড দিয়েই ঢোকা যায়।
- অ্যাডমিন লগইন: `/admin/login` → প্যানেল `/admin/dashboard`
- প্রথমে অ্যাডমিন প্যানেলের "প্ল্যান" ট্যাবে প্ল্যান যোগ করতে হবে।
- `.env` সেটআপ: `backend/.env.example` দেখো। SSLCommerz ব্যবহারে `SERVER_URL` অবশ্যই পাবলিক URL হতে হবে (IPN/কলব্যাকের জন্য)।
- Node.js 18+ লাগবে (গেটওয়ে কলে বিল্ট-ইন `fetch` ব্যবহার হয়েছে)।

## 🧮 গণিত / পদার্থ / রসায়নের সূত্র

- প্রশ্ন, অপশন ও ব্যাখ্যায় সূত্র `$ ... $` এর ভেতরে লিখলে বইয়ের মতো সুন্দরভাবে দেখায় (KaTeX)।
- গণিত/পদার্থ: `$\frac{a}{b}$`, `$x^{2}$`, `$\sqrt{x}$`, `$\vec{F}=m\vec{a}$`
- রসায়ন: `$\ce{2H2 + O2 -> 2H2O}$`, `$\ce{SO4^{2-}}$`, একক `$\pu{9.8 m s^-2}$`
- প্রশ্ন তৈরি ও এডিটর পেজে সূত্রের বাটন (গণিত/পদার্থ/রসায়ন) আছে এবং সূত্র থাকলে লাইভ প্রিভিউ দেখায়।
- ফ্রন্টএন্ডে নতুন ডিপেন্ডেন্সি `katex` — `npm install` চালাতে হবে (Vercel নিজে করে নেয়)।

## PDF-এর সূত্র যেমন আছে তেমন আসে (গণিত / পদার্থ / রসায়ন)

PDF আপলোড করলে সূত্র আর সাধারণ লেখা হয়ে আসে না — আপলোডের সময়ই স্বয়ংক্রিয়ভাবে বইয়ের মতো সূত্রে বদলে যায়:

| PDF-এ যেমন আছে | সেভ হয় | দেখায় |
|---|---|---|
| H<sub>2</sub>O (ছোট ফন্টে নিচু করা `2`) বা `H₂O` | `$\ce{H2O}$` | H₂O |
| x<sup>2</sup> (ছোট ফন্টে উঁচু করা `2`) বা `x²` | `$x^{2}$` | x² |
| `SO₄²⁻`, `Fe³⁺`, `¹⁴₆C`, `K₂Cr₂O₇` | `$\ce{SO4^{2-}}$` ... | রাসায়নিক সংকেত |
| উপরে-নিচে সাজানো ভগ্নাংশ (মাঝে দাগসহ) | `$\frac{a+b}{2c}$` | ভগ্নাংশ |

- লেআউট পড়ার কোড: `backend/utils/pdfLayout.js` (অক্ষরের ফন্ট-সাইজ ও উচ্চতা দেখে সাব/সুপারস্ক্রিপ্ট, দাগ দেখে ভগ্নাংশ)।
- রূপান্তর: `backend/utils/mathText.js`। ফ্রন্টএন্ডে হাতে টাইপ করা `H₂O`/`x²`-ও একইভাবে সূত্র হয় (`frontend/src/utils/mathParse.js`)।
- আগের বাগ ঠিক: পার্সার সব লেখা থেকে `=` ও `7` মুছে ফেলত; অপশনে `(x+1)`, `f(a)` থাকলে অপশন ভেঙে যেত; `2.5 কেজি` লাইন নতুন প্রশ্ন ধরা হতো।
- রেজাল্ট PDF: বাংলা ফন্টে ইংরেজি অক্ষর ও `₂ ² √ π ≤` নেই বলে ফাঁকা আসত। এখন বাংলা অংশ Noto Sans Bengali-তে, বাকি সব `fonts/DejaVuSans.ttf`-এ আঁকা হয় (`backend/utils/pdfFonts.js`)।
- সীমা: PDF-এ সূত্র ছবি হিসেবে বসানো থাকলে, বা PDF-এর বাংলা ফন্টে Unicode ম্যাপিং না থাকলে (বাংলা বিকৃত আসে) লেখা বের করা যায় না — সেক্ষেত্রে পরিষ্কার এরর দেখায়।

---

## ⏳ পেন্ডিং (অসম্পূর্ণ) পরীক্ষা ও অটো-সেভ

অনলাইনে পরীক্ষা তৈরির সময় ভুলে পেছনে গেলে বা ট্যাব বন্ধ হলেও লেখা হারায় না।

- **অটো-সেভ:** ফর্মে যা লেখা হয় তা সঙ্গে সঙ্গে ব্রাউজারে এবং ২.৫ সেকেন্ড থেমে থাকলে সার্ভারে "পেন্ডিং" হিসেবে জমা হয় (অসম্পূর্ণ প্রশ্ন, ফাঁকা অপশনসহ — যেমন আছে তেমন)।
- **ফিরে এলে:** `/teacher/create` আবার খুললে আগের লেখা যেমন ছিল তেমনই ফিরে আসে। "নতুন করে শুরু করো" চাপলে ফর্ম খালি হয়; পুরনোটি পেন্ডিং তালিকায় থেকে যায়।
- **পেন্ডিং ট্যাব:** শিক্ষক ড্যাশবোর্ডে "⏳ পেন্ডিং" ট্যাবে সব অসম্পূর্ণ পরীক্ষা দেখা যায় → "এডিট করে সম্পূর্ণ করো" (`/teacher/create?pending=ID`)।
- **"পেন্ডিংয়ে সংরক্ষণ" বাটন:** অসম্পূর্ণ অবস্থায় রেখে সরাসরি পেন্ডিং ট্যাবে যাওয়া যায়।
- **সম্পূর্ণ করলে:** "পরীক্ষা তৈরি করো" চাপলে পেন্ডিংটি সাধারণ পরীক্ষায় রূপ নেয় (তখনই প্ল্যানের পরীক্ষা-সীমায় গণনা হয়; পেন্ডিং গণনায় ধরা হয় না)। পেন্ডিং পরীক্ষা চালু (publish) করা যায় না।

ব্যাকএন্ড API (শিক্ষক + সচল সাবস্ক্রিপশন): `POST /api/exams/pending`, `GET /api/exams/pending/:id`, `POST /api/exams/pending/:id/finalize`।

## 🧮 সূত্র (LaTeX) টুলবার

`frontend/src/components/formulaData.js` এ সব সূত্র-বাটনের তালিকা (গণিত/পদার্থ/রসায়ন, বিষয়ভিত্তিক বিভাগসহ)। নতুন বাটন যোগ করতে ওই ফাইলে একটি লাইন যোগ করলেই হয়।
