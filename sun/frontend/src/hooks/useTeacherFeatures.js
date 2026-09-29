// ================== hooks/useTeacherFeatures.js ==================
// শিক্ষকের সাবস্ক্রিপশন স্ট্যাটাস থেকে জানা যায় কোন ফিচার চালু (ফ্রি ট্রায়ালে কিছু ফিচার বন্ধ থাকতে পারে)।
// পেইড/অ্যাডমিন-প্রদত্ত সাবস্ক্রিপশনে সব ফিচার চালু।
import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../context/LanguageContext';

export default function useTeacherFeatures() {
  const { t } = useLanguage();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    axiosClient.get('/subscription/me').then(({ data }) => setStatus(data.status)).catch(() => {});
  }, []);

  // status আসার আগে/না পেলে কিছু আটকানো হয় না (ব্যাকএন্ড যেকোনো ক্ষেত্রে নিজেই আটকায়)
  const has = (key) => !status?.featureLimited || (status.features || []).includes(key);
  const featureName = (key) => { const k = `feat.${key}.label`; const v = t(k); return v === k ? key : v; };
  const lockedMessage = (key) => t('feat.locked', { name: featureName(key) });
  const warnLocked = (key) => window.alert(lockedMessage(key));

  return { status, has, warnLocked, lockedMessage };
}
