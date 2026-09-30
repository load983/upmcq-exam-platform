// ================== utils/features.js ==================
// শিক্ষকের যেসব ফিচার অ্যাডমিন "Test Web" (ফ্রি ট্রায়াল)-এ আলাদা করে চালু/বন্ধ করতে পারে।
// (পরীক্ষা এডিট/পাবলিশ/মুছা, স্টুডেন্টের পরীক্ষা দেওয়া — এগুলো সবসময় চালু থাকে)
const TEACHER_FEATURES = [
  { key: 'createExam', label: 'অনলাইনে MCQ পরীক্ষা তৈরি', desc: 'নিজে প্রশ্ন লিখে পরীক্ষা বানানো ও খসড়া সেভ' },
  { key: 'uploadExam', label: 'PDF/Word আপলোড করে পরীক্ষা', desc: 'ফাইল থেকে অটোমেটিক প্রশ্ন তৈরি' },
  { key: 'downloadExamPdf', label: 'পরীক্ষার PDF ডাউনলোড', desc: 'তৈরি করা পরীক্ষার প্রশ্নপত্র / উত্তরসহ PDF নামানো' },
  { key: 'results', label: 'রেজাল্ট দেখা', desc: 'স্টুডেন্টদের রেজাল্ট ও উত্তরপত্র দেখা' },
  { key: 'exportResults', label: 'রেজাল্ট Excel ডাউনলোড', desc: 'পরীক্ষার রেজাল্ট এক্সেলে নামানো' },
  { key: 'classes', label: 'শ্রেণী ও এক্সেস কোড তৈরি', desc: 'নতুন শ্রেণী খোলা/মুছা ও এক্সেস কোড' },
  { key: 'students', label: 'স্টুডেন্ট তালিকা ও ব্যান', desc: 'যুক্ত স্টুডেন্ট দেখা, ব্যান/আনব্যান' },
  { key: 'exportStudents', label: 'স্টুডেন্ট তালিকা Excel ডাউনলোড', desc: 'স্টুডেন্টদের তালিকা এক্সেলে নামানো' },
  { key: 'resource', label: 'পরীক্ষার রিসোর্স (লিংক/PDF)', desc: 'পরীক্ষার সাথে স্টাডি ম্যাটেরিয়াল যুক্ত করা' },
];

const FEATURE_KEYS = TEACHER_FEATURES.map((f) => f.key);
const featureLabel = (key) => TEACHER_FEATURES.find((f) => f.key === key)?.label || key;

module.exports = { TEACHER_FEATURES, FEATURE_KEYS, featureLabel };
