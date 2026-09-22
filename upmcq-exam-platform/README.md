# 📝 Live MCQ Exam Platform

PDF আপলোড করে অটোমেটিক Live MCQ পরীক্ষা তৈরি করার ফুল-স্ট্যাক ওয়েব অ্যাপ।

## স্ট্যাক
- **Frontend:** React + Redux Toolkit + React Router + Tailwind CSS (Vite)
- **Backend:** Node.js + Express.js
- **Database:** MongoDB (Mongoose)
- **PDF Parsing:** pdf-parse (আপলোড হওয়া PDF থেকে টেক্সট বের করে প্রশ্ন পার্স করে)
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
