// ব্যাকএন্ডের /uploads/... পাথকে পূর্ণ URL বানায় (API base থেকে /api বাদ দিয়ে)
export default function assetUrl(p) {
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;
  const env = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${env.replace(/\/+$/, '').replace(/\/api$/, '')}${p}`;
}
