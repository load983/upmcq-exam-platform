// ================== hooks/useTeacherFeatures.js ==================
// শিক্ষকের সাবস্ক্রিপশন স্ট্যাটাস থেকে জানা যায় কোন ফিচার চালু (ফ্রি ট্রায়ালে কিছু ফিচার বন্ধ থাকতে পারে)।
// পেইড/অ্যাডমিন-প্রদত্ত সাবস্ক্রিপশনে সব ফিচার চালু।
import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

export const FEATURE_LABELS = {
  createExam: 'অনলাইনে MCQ পরীক্ষা তৈরি',
  uploadExam: 'PDF/Word আপলোড করে পরীক্ষা',
  downloadExamPdf: 'পরীক্ষার PDF ডাউনলোড',
  results: 'রেজাল্ট দেখা',
  exportResults: 'রেজাল্ট Excel ডাউনলোড',
  classes: 'শ্রেণী ও এক্সেস কোড তৈরি',
  students: 'স্টুডেন্ট তালিকা ও ব্যান',
  exportStudents: 'স্টুডেন্ট তালিকা Excel ডাউনলোড',
  resource: 'পরীক্ষার রিসোর্স (লিংক/PDF)',
};

export default function useTeacherFeatures() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    axiosClient.get('/subscription/me').then(({ data }) => setStatus(data.status)).catch(() => {});
  }, []);

  // status আসার আগে/না পেলে কিছু আটকানো হয় না (ব্যাকএন্ড যেকোনো ক্ষেত্রে নিজেই আটকায়)
  const has = (key) => !status?.featureLimited || (status.features || []).includes(key);
  const lockedMessage = (key) => `ফ্রি ট্রায়ালে "${FEATURE_LABELS[key] || key}" ফিচারটি চালু নেই। ব্যবহার করতে সাবস্ক্রিপশন নিন।`;
  const warnLocked = (key) => window.alert(lockedMessage(key));

  return { status, has, warnLocked, lockedMessage };
}
