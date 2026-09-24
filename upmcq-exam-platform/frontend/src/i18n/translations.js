// ================== i18n/translations.js ==================
// সাইটের সব টেক্সট এক জায়গায়। প্রতিটি key-এর নিচে bn (বাংলা) ও en (English) পাশাপাশি রাখা হয়েছে,
// যাতে কোনো একটা ভাষার অনুবাদ বাদ পড়ে না যায়।
//
// নতুন টেক্সট যোগ করতে:  'section.key': { bn: '...', en: '...' }
// ভেতরে ডাইনামিক মান বসাতে {name} ধরনের প্লেসহোল্ডার ব্যবহার করো, যেমন t('key', { name: 'Rakib' })

export const LANGUAGES = [
  { code: 'bn', label: 'বাংলা', short: 'বাং', locale: 'bn-BD' },
  { code: 'en', label: 'English', short: 'EN', locale: 'en-US' },
];

export const DEFAULT_LANG = 'bn';

const entries = {
  // ---------------------------------------------------------------- common
  'common.loading': { bn: 'লোড হচ্ছে...', en: 'Loading...' },
  'common.logout': { bn: 'লগআউট', en: 'Logout' },
  'common.exams': { bn: 'পরীক্ষাসমূহ', en: 'Exams' },
  'common.save': { bn: 'সেভ', en: 'Save' },
  'common.cancel': { bn: 'বাতিল', en: 'Cancel' },
  'common.edit': { bn: 'এডিট', en: 'Edit' },
  'common.delete': { bn: 'ডিলিট', en: 'Delete' },
  'common.name': { bn: 'নাম', en: 'Name' },
  'common.roll': { bn: 'রোল', en: 'Roll' },
  'common.results': { bn: 'রেজাল্ট', en: 'Results' },
  'common.correct': { bn: 'সঠিক', en: 'Correct' },
  'common.wrong': { bn: 'ভুল', en: 'Wrong' },
  'common.skipped': { bn: 'স্কিপ', en: 'Skipped' },
  'common.email': { bn: 'ইমেইল', en: 'Email' },
  'common.password': { bn: 'পাসওয়ার্ড', en: 'Password' },

  // ---------------------------------------------------------------- language switcher
  'lang.select': { bn: 'ভাষা নির্বাচন করুন', en: 'Select language' },

  // ---------------------------------------------------------------- navbar
  'nav.dashboard': { bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
  'nav.teacherLogin': { bn: 'শিক্ষক লগইন', en: 'Teacher Login' },
  'nav.loginAccount': { bn: 'লগইন / অ্যাকাউন্ট', en: 'Login / Account' },
  'nav.loginCreateAccount': { bn: 'লগইন / অ্যাকাউন্ট তৈরি করো', en: 'Login / Create account' },
  'nav.openMenu': { bn: 'মেনু খুলুন', en: 'Open menu' },
  'nav.logoutWithName': { bn: 'লগআউট ({name})', en: 'Logout ({name})' },

  // ---------------------------------------------------------------- footer
  'footer.copyright': {
    bn: '© {year} MCQ Exam Platform — সব অধিকার সংরক্ষিত।',
    en: '© {year} MCQ Exam Platform — All rights reserved.',
  },
  'footer.teacherPortal': { bn: 'শিক্ষক পোর্টাল', en: 'Teacher Portal' },

  // ---------------------------------------------------------------- theme switcher
  'theme.settings': { bn: 'থিম সেটিংস', en: 'Theme settings' },
  'theme.mode': { bn: 'মোড', en: 'Mode' },
  'theme.light': { bn: 'লাইট', en: 'Light' },
  'theme.dark': { bn: 'ডার্ক', en: 'Dark' },
  'theme.system': { bn: 'সিস্টেম', en: 'System' },
  'theme.accent': { bn: 'অ্যাকসেন্ট কালার', en: 'Accent color' },
  'theme.wallpaper': { bn: 'ওয়ালপেপার', en: 'Wallpaper' },
  'theme.bg.minimal': { bn: 'মিনিমাল', en: 'Minimal' },
  'theme.bg.blobs': { bn: 'গ্রেডিয়েন্ট ব্লব', en: 'Gradient blobs' },
  'theme.bg.dots': { bn: 'ডট প্যাটার্ন', en: 'Dot pattern' },
  'theme.bg.mesh': { bn: 'মেশ ওয়াশ', en: 'Mesh wash' },

  // ---------------------------------------------------------------- 404
  'notFound.code': { bn: '৪০৪', en: '404' },
  'notFound.title': { bn: 'পেজটি খুঁজে পাওয়া যায়নি', en: 'Page not found' },
  'notFound.desc': {
    bn: 'তুমি যে পেজটি খুঁজছো সেটি হয়তো সরিয়ে ফেলা হয়েছে অথবা লিংকটি ভুল।',
    en: 'The page you are looking for may have been removed, or the link is incorrect.',
  },
  'notFound.home': { bn: 'হোমে ফিরে যাও', en: 'Back to home' },

  // ---------------------------------------------------------------- home
  'home.badge': { bn: '⚡ পুরোপুরি ফ্রি ও রিয়েল-টাইম', en: '⚡ Completely free & real-time' },
  'home.heroTitle2': { bn: 'সহজে তৈরি করো, শেয়ার করো', en: 'Create and share with ease' },
  'home.heroDesc': {
    bn: 'PDF আপলোড করো, অটোমেটিক Live MCQ পরীক্ষা তৈরি করো, শেয়ারযোগ্য লিংক দাও — শিক্ষার্থীরা রিয়েল-টাইমে পরীক্ষা দেবে, আর তুমি এক জায়গায় বসেই সব রেজাল্ট দেখতে পারবে।',
    en: 'Upload a PDF, generate a live MCQ exam automatically, and share a link — students take the exam in real time while you see every result in one place.',
  },
  'home.teacherLogin': { bn: 'শিক্ষক হিসেবে লগইন', en: 'Login as teacher' },
  'home.createAccount': { bn: 'নতুন একাউন্ট তৈরি করো', en: 'Create a new account' },
  'home.studentNote': {
    bn: 'শিক্ষার্থীরা শিক্ষকের দেয়া লিংক থেকে সরাসরি পরীক্ষায় জয়েন করবে — আলাদা লগইনের দরকার নেই।',
    en: "Students join exams directly from the link their teacher shares — no separate login needed.",
  },
  'home.viewLive': { bn: 'চলতি পরীক্ষাগুলো দেখো →', en: 'View ongoing exams →' },

  'home.featuresTitle': { bn: 'যা যা পাচ্ছো', en: "What you get" },
  'home.featuresSub': {
    bn: 'একটা আধুনিক পরীক্ষা প্ল্যাটফর্মের জন্য যা যা দরকার, সবই এখানে আছে।',
    en: 'Everything a modern exam platform needs is right here.',
  },
  'home.f1.title': { bn: 'PDF থেকে অটো এক্সট্রাক্ট', en: 'Auto-extract from PDF' },
  'home.f1.desc': {
    bn: 'প্রশ্নের PDF আপলোড করলেই সিস্টেম নিজে থেকে MCQ প্রশ্ন, অপশন ও সঠিক উত্তর বের করে নেয়।',
    en: 'Upload a question PDF and the system automatically extracts the MCQ questions, options and correct answers.',
  },
  'home.f2.title': { bn: 'শেয়ারযোগ্য লিংক', en: 'Shareable link' },
  'home.f2.desc': {
    bn: 'পরীক্ষা পাবলিশ করলেই একটা ইউনিক লিংক তৈরি হয় — শিক্ষার্থীরা লগইন ছাড়াই সরাসরি অংশ নিতে পারবে।',
    en: 'Publishing an exam creates a unique link — students can join directly without logging in.',
  },
  'home.f3.title': { bn: 'লাইভ টাইমার ও নিরাপত্তা', en: 'Live timer & security' },
  'home.f3.desc': {
    bn: 'কাউন্টডাউন টাইমার, ট্যাব-সুইচ ডিটেকশন এবং সময় শেষ হলে অটো-সাবমিট — সবই বিল্ট-ইন।',
    en: 'Countdown timer, tab-switch detection and auto-submit when time runs out — all built in.',
  },
  'home.f4.title': { bn: 'কাস্টম মার্কিং সিস্টেম', en: 'Custom marking system' },
  'home.f4.desc': {
    bn: 'নেগেটিভ মার্কিং, প্রশ্ন/অপশন শাফল, নির্দিষ্ট সংখ্যক প্রশ্ন বাছাই — সব কিছু নিয়ন্ত্রণ তোমার হাতে।',
    en: 'Negative marking, question/option shuffling, picking a fixed number of questions — everything is in your control.',
  },
  'home.f5.title': { bn: 'রিয়েল-টাইম রেজাল্ট ড্যাশবোর্ড', en: 'Real-time result dashboard' },
  'home.f5.desc': {
    bn: 'কে কত পেয়েছে, কতজন অংশ নিয়েছে — সব একনজরে দেখো, চাইলে এক্সেলে এক্সপোর্টও করতে পারবে।',
    en: 'See who scored what and how many took part at a glance, and export to Excel if you like.',
  },
  'home.f6.title': { bn: 'কাস্টমাইজযোগ্য থিম', en: 'Customizable theme' },
  'home.f6.desc': {
    bn: 'লাইট, ডার্ক অথবা সিস্টেম মোড — সাথে একাধিক অ্যাকসেন্ট কালার থেকে নিজের পছন্দমতো থিম বেছে নাও।',
    en: 'Light, dark or system mode — plus multiple accent colors so you can pick the theme you like.',
  },

  'home.howTitle': { bn: 'কীভাবে কাজ করে', en: 'How it works' },
  'home.howSub': { bn: 'মাত্র চারটি ধাপে তোমার পরীক্ষা রেডি।', en: 'Your exam is ready in just four steps.' },
  'home.s1.n': { bn: '০১', en: '01' },
  'home.s1.title': { bn: 'PDF আপলোড করো', en: 'Upload the PDF' },
  'home.s1.desc': {
    bn: 'প্রশ্নপত্রের PDF আপলোড করলেই প্রশ্নগুলো অটোমেটিক তৈরি হয়ে যাবে।',
    en: 'Upload your question paper PDF and the questions are created automatically.',
  },
  'home.s2.n': { bn: '০২', en: '02' },
  'home.s2.title': { bn: 'সেটিংস ঠিক করো', en: 'Adjust the settings' },
  'home.s2.desc': {
    bn: 'সময়, মার্কিং, শাফল, শিডিউল — যেভাবে চাও সেভাবে কনফিগার করো।',
    en: 'Time, marking, shuffle, schedule — configure it the way you want.',
  },
  'home.s3.n': { bn: '০৩', en: '03' },
  'home.s3.title': { bn: 'লিংক শেয়ার করো', en: 'Share the link' },
  'home.s3.desc': {
    bn: 'পাবলিশ করে লিংকটা শিক্ষার্থীদের কাছে পাঠিয়ে দাও।',
    en: 'Publish the exam and send the link to your students.',
  },
  'home.s4.n': { bn: '০৪', en: '04' },
  'home.s4.title': { bn: 'রেজাল্ট দেখো', en: 'View the results' },
  'home.s4.desc': {
    bn: 'পরীক্ষা শেষে রিয়েল-টাইম রেজাল্ট ও অ্যানালিটিক্স দেখো।',
    en: 'After the exam, see real-time results and analytics.',
  },

  'home.ctaTitle': { bn: 'আজই তোমার প্রথম Live পরীক্ষা তৈরি করো', en: 'Create your first live exam today' },
  'home.ctaDesc': {
    bn: 'একদম ফ্রি, কোনো ইন্সটলেশন ছাড়াই — মাত্র কয়েক মিনিটেই পরীক্ষা রেডি হয়ে যাবে।',
    en: 'Totally free, no installation — your exam will be ready in just a few minutes.',
  },
  'home.ctaRegister': { bn: 'ফ্রি একাউন্ট খুলো', en: 'Open a free account' },
  'home.ctaExams': { bn: 'পরীক্ষাসমূহ দেখো', en: 'Browse exams' },

  // ---------------------------------------------------------------- student home (exam list)
  'studentHome.title': { bn: 'অনলাইন পরীক্ষা পোর্টাল', en: 'Online Exam Portal' },
  'studentHome.subtitle': {
    bn: 'চলতি পরীক্ষাগুলোর তালিকা নিচে দেওয়া হলো। সরাসরি অংশগ্রহণ করতে "পরীক্ষা দাও" বাটনে ক্লিক করো।',
    en: 'The list of ongoing exams is below. Click the "Take exam" button to participate directly.',
  },
  'studentHome.searchPlaceholder': { bn: '🔍 পরীক্ষার নাম দিয়ে খুঁজুন...', en: '🔍 Search by exam name...' },
  'studentHome.clear': { bn: 'মুছে ফেলুন', en: 'Clear' },
  'studentHome.loading': { bn: 'পরীক্ষার তালিকা লোড হচ্ছে...', en: 'Loading exam list...' },
  'studentHome.noResultTitle': { bn: 'কোনো পরীক্ষা পাওয়া যায়নি!', en: 'No exams found!' },
  'studentHome.noExamsTitle': { bn: 'বর্তমানে কোনো পরীক্ষা চালু নেই', en: 'There are no active exams right now' },
  'studentHome.noResultDesc': {
    bn: '"{query}" নামে কোনো পরীক্ষা খুঁজে পাওয়া যায়নি। বানান সঠিকভাবে টাইপ করেছেন কিনা নিশ্চিত করুন।',
    en: 'No exam was found named "{query}". Please make sure you typed the spelling correctly.',
  },
  'studentHome.noExamsDesc': {
    bn: 'শিক্ষক নতুন কোনো পরীক্ষা পাবলিশ করলে তা এখানে দেখতে পাবেন।',
    en: 'When a teacher publishes a new exam, you will see it here.',
  },
  'studentHome.showAll': { bn: '🔄 সব পরীক্ষা আবার দেখুন', en: '🔄 Show all exams again' },
  'studentHome.time': { bn: '⏱️ সময়: {value}', en: '⏱️ Time: {value}' },
  'studentHome.minutes': { bn: '{n} মিনিট', en: '{n} minutes' },
  'studentHome.noTimeLimit': { bn: 'নির্দিষ্ট সময়সীমা নেই', en: 'No time limit' },
  'studentHome.attempted': { bn: '👥 পরীক্ষা দিয়েছে: {n} জন', en: '👥 Attempted: {n}' },
  'studentHome.by': { bn: '👨‍🏫 শিক্ষক: {name}', en: '👨‍🏫 By {name}' },
  'studentHome.takeExam': { bn: 'পরীক্ষা দাও 🚀', en: 'Take exam 🚀' },

  // ---------------------------------------------------------------- student auth
  'studentAuth.errorGeneric': { bn: 'সমস্যা হয়েছে, আবার চেষ্টা করুন', en: 'Something went wrong, please try again' },
  'studentAuth.loginTitle': { bn: 'শিক্ষার্থী লগইন', en: 'Student Login' },
  'studentAuth.registerTitle': { bn: 'নতুন অ্যাকাউন্ট তৈরি করুন', en: 'Create a new account' },
  'studentAuth.name': { bn: 'নাম', en: 'Name' },
  'studentAuth.roll': { bn: 'রোল নাম্বার', en: 'Roll number' },
  'studentAuth.phone': { bn: 'মোবাইল নাম্বার', en: 'Mobile number' },
  'studentAuth.password': { bn: 'পাসওয়ার্ড', en: 'Password' },
  'studentAuth.wait': { bn: 'অপেক্ষা করুন...', en: 'Please wait...' },
  'studentAuth.login': { bn: 'লগইন', en: 'Login' },
  'studentAuth.register': { bn: 'রেজিস্টার', en: 'Register' },
  'studentAuth.toRegister': { bn: 'নতুন অ্যাকাউন্ট নেই? সাইন আপ করুন', en: "Don't have an account? Sign up" },
  'studentAuth.toLogin': { bn: 'আগে থেকেই অ্যাকাউন্ট আছে? লগইন করুন', en: 'Already have an account? Log in' },

  // ---------------------------------------------------------------- student join
  'join.noExamInfo': {
    bn: 'পরীক্ষার তথ্য পাওয়া যায়নি। অনুগ্রহ করে পেজ রিফ্রেশ করুন।',
    en: 'Exam information could not be found. Please refresh the page.',
  },
  'join.requiredInfo': { bn: 'অনুগ্রহ করে প্রয়োজনীয় তথ্য দিন।', en: 'Please provide the required information.' },
  'join.cannotStart': { bn: 'পরীক্ষা শুরু করা সম্ভব হয়নি। আবার চেষ্টা করুন।', en: 'Could not start the exam. Please try again.' },
  'join.startProblem': { bn: 'পরীক্ষা শুরু করতে সমস্যা হয়েছে', en: 'There was a problem starting the exam' },
  'join.loadingInfo': { bn: 'পরীক্ষার তথ্য লোড হচ্ছে...', en: 'Loading exam information...' },
  'join.time': { bn: 'সময়: {n} মিনিট', en: 'Time: {n} minutes' },
  'join.examinee': { bn: 'পরীক্ষার্থী:', en: 'Examinee:' },
  'join.rollNumber': { bn: 'রোল নম্বর:', en: 'Roll number:' },
  'join.email': { bn: 'ইমেইল:', en: 'Email:' },
  'join.starting': { bn: 'শুরু হচ্ছে...', en: 'Starting...' },
  'join.start': { bn: 'পরীক্ষা শুরু করো', en: 'Start exam' },
  'join.yourName': { bn: 'তোমার নাম', en: 'Your name' },
  'join.rollLabel': { bn: 'রোল নম্বর', en: 'Roll number' },
  'join.phoneOptional': { bn: 'ফোন নম্বর (ঐচ্ছিক)', en: 'Phone number (optional)' },
  'join.namePlaceholder': { bn: 'উদাহরণ: রাকিব হাসান', en: 'e.g. Rakib Hasan' },
  'join.rollPlaceholder': { bn: 'উদাহরণ: 101', en: 'e.g. 101' },
  'join.accessCode': { bn: 'অ্যাকসেস কোড', en: 'Access code' },
  'join.accessCodePlaceholder': { bn: 'শিক্ষকের দেওয়া অ্যাকসেস কোড লিখো', en: 'Enter the access code given by your teacher' },
  'join.accessCodeHint': { bn: '🔒 এই পরীক্ষা দিতে অ্যাকসেস কোড লাগবে', en: '🔒 This exam requires an access code' },
  'join.accessCodeRequired': { bn: 'অনুগ্রহ করে অ্যাকসেস কোড দিন।', en: 'Please enter the access code.' },
  'join.by': { bn: 'শিক্ষক: {name}', en: 'By {name}' },

  // ---------------------------------------------------------------- live exam
  'exam.tabWarning': {
    bn: '⚠️ তুমি ট্যাব পরিবর্তন করেছো — এটি রেকর্ড করা হয়েছে। পরীক্ষার নিয়ম মেনে চলো।',
    en: '⚠️ You switched tabs — this has been recorded. Please follow the exam rules.',
  },
  'exam.questionOf': { bn: 'প্রশ্ন {current} / {total}', en: 'Question {current} / {total}' },
  'exam.prev': { bn: 'আগের প্রশ্ন', en: 'Previous' },
  'exam.next': { bn: 'পরের প্রশ্ন', en: 'Next' },
  'exam.submit': { bn: 'পরীক্ষা জমা দাও ✅', en: 'Submit exam ✅' },
  'exam.answered': { bn: '{answered}/{total} উত্তর দেয়া হয়েছে', en: '{answered}/{total} answered' },
  'exam.submitNow': { bn: 'এখনই জমা দাও', en: 'Submit now' },

  // ---------------------------------------------------------------- student result
  'result.submitted': { bn: 'পরীক্ষা জমা হয়েছে!', en: 'Exam submitted!' },
  'result.marks': { bn: '{n} নম্বর', en: '{n} marks' },
  'result.stats': {
    bn: 'সঠিক: {correct} | ভুল: {wrong} | স্কিপ: {skipped}',
    en: 'Correct: {correct} | Wrong: {wrong} | Skipped: {skipped}',
  },
  'result.later': { bn: 'শিক্ষক রেজাল্ট পরে প্রকাশ করবেন।', en: 'The teacher will publish the result later.' },
  'result.downloadPdf': { bn: '📄 সঠিক উত্তরসহ PDF ডাউনলোড করো', en: '📄 Download PDF with correct answers' },
  'result.viewResource': { bn: '🔗 অতিরিক্ত রিসোর্স দেখো', en: '🔗 View extra resource' },
  'result.downloadResource': { bn: '📥 অতিরিক্ত রিসোর্স ডাউনলোড করো', en: '📥 Download extra resource' },
  'result.detailed': { bn: '📝 বিস্তারিত রেজাল্ট দেখো', en: '📝 View detailed result' },
  'result.backHome': { bn: 'হোমে ফিরে যাও', en: 'Back to home' },
  'result.filterAll': { bn: 'সব ({n})', en: 'All ({n})' },
  'result.filterCorrect': { bn: 'সঠিক ({n})', en: 'Correct ({n})' },
  'result.filterWrong': { bn: 'ভুল ({n})', en: 'Wrong ({n})' },
  'result.filterSkipped': { bn: 'স্কিপ ({n})', en: 'Skipped ({n})' },
  'result.emptyCategory': { bn: 'এই ক্যাটাগরিতে কোনো প্রশ্ন নেই।', en: 'There are no questions in this category.' },
  'result.questionN': { bn: 'প্রশ্ন {n}.', en: 'Question {n}.' },
  'result.yourAnswer': { bn: '✗ (তোমার উত্তর)', en: '✗ (Your answer)' },
  'result.correctAnswer': { bn: '✓ (সঠিক উত্তর)', en: '✓ (Correct answer)' },
  'result.explanation': { bn: 'ব্যাখ্যা: ', en: 'Explanation: ' },

  // ---------------------------------------------------------------- teacher auth
  'teacherLogin.title': { bn: 'শিক্ষক লগইন', en: 'Teacher Login' },
  'teacherLogin.loggingIn': { bn: 'লগইন হচ্ছে...', en: 'Logging in...' },
  'teacherLogin.login': { bn: 'লগইন', en: 'Login' },
  'teacherLogin.noAccount': { bn: 'একাউন্ট নেই?', en: "Don't have an account?" },
  'teacherLogin.registerLink': { bn: 'রেজিস্টার করো', en: 'Register' },
  'teacherLogin.failed': { bn: 'লগইন ব্যর্থ হয়েছে', en: 'Login failed' },

  'teacherRegister.title': { bn: 'নতুন শিক্ষক একাউন্ট', en: 'New teacher account' },
  'teacherRegister.fullName': { bn: 'পুরো নাম', en: 'Full name' },
  'teacherRegister.passwordPlaceholder': { bn: 'পাসওয়ার্ড (সর্বনিম্ন ৬ অক্ষর)', en: 'Password (minimum 6 characters)' },
  'teacherRegister.creating': { bn: 'তৈরি হচ্ছে...', en: 'Creating...' },
  'teacherRegister.create': { bn: 'একাউন্ট তৈরি করো', en: 'Create account' },
  'teacherRegister.haveAccount': { bn: 'আগে থেকেই একাউন্ট আছে?', en: 'Already have an account?' },
  'teacherRegister.loginLink': { bn: 'লগইন করো', en: 'Log in' },
  'teacherRegister.failed': { bn: 'রেজিস্ট্রেশন ব্যর্থ হয়েছে', en: 'Registration failed' },

  'attempt.joinFailed': { bn: 'জয়েন করা যায়নি', en: 'Could not join' },

  // ---------------------------------------------------------------- upload exam
  'upload.selectPdf': { bn: 'একটি PDF ফাইল সিলেক্ট করো', en: 'Please select a PDF file' },
  'upload.title': { bn: 'PDF আপলোড করে পরীক্ষা তৈরি করো', en: 'Create an exam by uploading a PDF' },
  'upload.formatLabel': { bn: 'ফরম্যাট:', en: 'Format:' },
  'upload.formatExample': {
    bn: '1. প্রশ্ন? A. ... B. ... C. ... D. ... Answer: C',
    en: '1. Question? A. ... B. ... C. ... D. ... Answer: C',
  },
  'upload.titlePlaceholder': {
    bn: 'পরীক্ষার নাম (ঐচ্ছিক, না দিলে ফাইলের নাম ব্যবহার হবে)',
    en: 'Exam name (optional, the file name is used if left empty)',
  },
  'upload.dropHere': { bn: 'PDF ফাইলটি এখানে ড্র্যাগ করে ছেড়ে দাও', en: 'Drag & drop your PDF here' },
  'upload.dropActive': { bn: 'ফাইলটি ছেড়ে দাও...', en: 'Drop the file to upload...' },
  'upload.orBrowse': { bn: 'অথবা ক্লিক করে ফাইল বেছে নাও', en: 'or click to choose a file' },
  'upload.change': { bn: 'ফাইল পরিবর্তন করো', en: 'Change file' },
  'upload.onlyPdf': { bn: 'শুধুমাত্র PDF ফাইল দেওয়া যাবে', en: 'Only PDF files are allowed' },
  'upload.parsing': { bn: 'PDF পার্স হচ্ছে...', en: 'Parsing PDF...' },
  'upload.submit': { bn: 'আপলোড ও পার্স করো', en: 'Upload & parse' },

  // ---------------------------------------------------------------- result dashboard (teacher)
  'resultDash.title': { bn: 'রেজাল্ট ড্যাশবোর্ড', en: 'Result Dashboard' },
  'resultDash.export': { bn: '📊 Excel এ এক্সপোর্ট করো', en: '📊 Export to Excel' },
  'resultDash.colName': { bn: 'নাম', en: 'Name' },
  'resultDash.colRoll': { bn: 'রোল', en: 'Roll' },
  'resultDash.colCorrect': { bn: 'সঠিক', en: 'Correct' },
  'resultDash.colWrong': { bn: 'ভুল', en: 'Wrong' },
  'resultDash.colSkipped': { bn: 'স্কিপ', en: 'Skipped' },
  'resultDash.colMarks': { bn: 'নম্বর', en: 'Marks' },
  'resultDash.colStatus': { bn: 'স্ট্যাটাস', en: 'Status' },
  'resultDash.autoSubmit': { bn: 'অটো-সাবমিট', en: 'Auto-submitted' },
  'resultDash.submitted': { bn: 'জমা হয়েছে', en: 'Submitted' },
  'resultDash.ongoing': { bn: 'চলমান', en: 'In progress' },
  'resultDash.empty': { bn: 'এখনো কেউ পরীক্ষা দেয়নি', en: 'No one has taken the exam yet' },

  // ---------------------------------------------------------------- teacher dashboard
  'status.draft': { bn: 'খসড়া', en: 'Draft' },
  'status.published': { bn: 'প্রকাশিত', en: 'Published' },
  'status.closed': { bn: 'বন্ধ', en: 'Closed' },

  'dash.welcome': { bn: 'স্বাগতম, {name} 👋', en: 'Welcome, {name} 👋' },
  'dash.teacherFallback': { bn: 'শিক্ষক', en: 'Teacher' },
  'dash.newExam': { bn: '+ নতুন পরীক্ষা (PDF আপলোড)', en: '+ New exam (upload PDF)' },
  'dash.downloadExcel': { bn: '📥 এক্সেল ফাইল ডাউনলোড', en: '📥 Download Excel file' },
  'dash.tabExams': { bn: 'পরীক্ষাসমূহ ({n})', en: 'Exams ({n})' },
  'dash.tabStudents': { bn: 'শিক্ষার্থী', en: 'Students' },
  'dash.searchExams': { bn: 'পরীক্ষার নাম, স্ট্যাটাস বা কোড দিয়ে খুঁজুন...', en: 'Search by exam name, status or code...' },
  'dash.searchStudents': {
    bn: 'শিক্ষার্থীর নাম, রোল বা মোবাইল নাম্বার দিয়ে খুঁজুন...',
    en: 'Search by student name, roll or mobile number...',
  },
  'dash.examsLoadError': { bn: 'পরীক্ষা লোড করতে সমস্যা হয়েছে: {error}', en: 'Problem loading exams: {error}' },
  'dash.noExams': { bn: 'এখনো কোনো পরীক্ষা তৈরি করোনি।', en: "You haven't created any exams yet." },
  'dash.noExamMatch': {
    bn: '"{term}" এর সাথে মিলে এমন কোনো পরীক্ষা পাওয়া যায়নি।',
    en: 'No exam matching "{term}" was found.',
  },
  'dash.examMeta': {
    bn: 'সময়: {time} মিনিট | মার্কস/প্রশ্ন: {marks}',
    en: 'Time: {time} min | Marks/question: {marks}',
  },
  'dash.editSettings': { bn: 'এডিট / সেটিংস', en: 'Edit / Settings' },
  'dash.confirmDelete': {
    bn: '"{title}" পরীক্ষাটি স্থায়ীভাবে ডিলিট করতে চাও? এর সাথে সব প্রশ্ন ও স্টুডেন্ট রেজাল্টও মুছে যাবে। এটা আর ফিরিয়ে আনা যাবে না।',
    en: 'Do you want to permanently delete the exam "{title}"? All its questions and student results will also be removed. This cannot be undone.',
  },
  'dash.deleteFailed': { bn: 'পরীক্ষাটি ডিলিট করতে সমস্যা হয়েছে', en: 'There was a problem deleting the exam' },
  'dash.excelFailed': { bn: 'এক্সেল ফাইল ডাউনলোড করতে সমস্যা হয়েছে', en: 'There was a problem downloading the Excel file' },
  'dash.studentsLoading': { bn: 'শিক্ষার্থী ডাটা লোড হচ্ছে...', en: 'Loading student data...' },
  'dash.studentsLoadError': { bn: 'শিক্ষার্থী তালিকা লোড করতে সমস্যা হয়েছে', en: 'There was a problem loading the student list' },
  'dash.noStudents': { bn: 'এখনো কোনো শিক্ষার্থী অ্যাকাউন্ট তৈরি করেনি।', en: 'No student has created an account yet.' },
  'dash.noStudentMatch': {
    bn: '"{term}" এর সাথে মিলে এমন কোনো শিক্ষার্থী পাওয়া যায়নি।',
    en: 'No student matching "{term}" was found.',
  },
  'dash.colMobile': { bn: 'মোবাইল নাম্বার', en: 'Mobile number' },
  'dash.colRegDate': { bn: 'নিবন্ধনের তারিখ', en: 'Registered on' },

  // ---------------------------------------------------------------- exam editor
  'editor.settingsTitle': { bn: 'পরীক্ষার সেটিংস', en: 'Exam Settings' },
  'editor.totalTime': { bn: 'মোট সময় (মিনিট)', en: 'Total time (minutes)' },
  'editor.marksPerQuestion': { bn: 'প্রতি প্রশ্নের মার্কস', en: 'Marks per question' },
  'editor.totalQuestionsToUse': {
    bn: 'মোট প্রশ্ন ব্যবহার করবে (এভেইলেবল: {n}, ০ = সব)',
    en: 'Number of questions to use (available: {n}, 0 = all)',
  },
  'editor.accessCode': { bn: 'অ্যাকসেস কোড (ঐচ্ছিক)', en: 'Access code (optional)' },
  'editor.accessCodePlaceholder': { bn: 'খালি রাখলে দরকার হবে না', en: 'Not required if left empty' },
  'editor.negativeMarking': { bn: 'নেগেটিভ মার্কিং', en: 'Negative marking' },
  'editor.marksPerWrong': { bn: 'প্রতি ভুল উত্তরে কাটা যাবে', en: 'Deduction per wrong answer' },
  'editor.shuffleQuestions': { bn: 'প্রশ্ন শাফল করো', en: 'Shuffle questions' },
  'editor.shuffleOptions': { bn: 'অপশন শাফল করো', en: 'Shuffle options' },
  'editor.showResultInstantly': { bn: 'সাথে সাথে রেজাল্ট দেখাও', en: 'Show result instantly' },
  'editor.allowRepetition': {
    bn: 'রিপিটেশন (একই স্টুডেন্ট বারবার দিতে পারবে)',
    en: 'Repetition (the same student can attempt multiple times)',
  },
  'editor.repetitionWarning': {
    bn: '⚠️ রিপিটেশন অন থাকায় "রেজাল্ট" ড্যাশবোর্ডে এই পরীক্ষার টেবিল দেখানো হবে না — প্রতিটা স্টুডেন্ট শুধু নিজের রেজাল্ট নিজে দেখতে পাবে।',
    en: '⚠️ Because Repetition is on, the results table for this exam will not be shown on the "Results" dashboard — each student can only see their own result.',
  },
  'editor.enableSchedule': { bn: 'শিডিউল চালু করো', en: 'Enable schedule' },
  'editor.startAt': { bn: 'শুরুর সময়', en: 'Start time' },
  'editor.endAt': { bn: 'শেষের সময়', en: 'End time' },
  'editor.saveSettings': { bn: 'সেটিংস সেভ করো', en: 'Save settings' },
  'editor.publish': { bn: '🚀 পাবলিশ করে লিংক তৈরি করো', en: '🚀 Publish & generate link' },
  'editor.shareLink': { bn: 'শেয়ারযোগ্য লিংক:', en: 'Shareable link:' },
  'editor.resourceTitle': {
    bn: 'পরীক্ষা শেষে স্টুডেন্টকে যা দেখাবে (ঐচ্ছিক)',
    en: 'What to show students after the exam (optional)',
  },
  'editor.resourceLinkValue': { bn: 'লিংক: {value}', en: 'Link: {value}' },
  'editor.resourcePdfValue': { bn: 'PDF: {value}', en: 'PDF: {value}' },
  'editor.remove': { bn: 'সরাও', en: 'Remove' },
  'editor.driveLink': { bn: 'Google Drive লিংক', en: 'Google Drive link' },
  'editor.orUploadPdf': { bn: 'অথবা PDF আপলোড', en: 'Or upload a PDF' },
  'editor.upload': { bn: 'আপলোড', en: 'Upload' },
  'editor.questionsTitle': { bn: 'প্রশ্নসমূহ ({n})', en: 'Questions ({n})' },
};

// entries → { bn: { key: text }, en: { key: text } }
export const translations = Object.entries(entries).reduce(
  (acc, [key, value]) => {
    acc.bn[key] = value.bn;
    acc.en[key] = value.en;
    return acc;
  },
  { bn: {}, en: {} }
);
