// ================== utils/contactLinks.js ==================
// অ্যাডমিনের সেভ করা যোগাযোগ তথ্য → ক্লিকযোগ্য লিংকের তালিকা (হেল্পলাইন উইজেট ও অ্যাডমিন প্রিভিউ দুই জায়গায় ব্যবহার)

import { translate } from '../context/LanguageContext';

// key → { icon, placeholder } — নাম/লেবেল translations থেকে আসে (contact.f.<key> পূর্ণ নাম, contact.s.<key> ছোট নাম)
export const CONTACT_FIELDS = [
  { key: 'phone', labelKey: 'contact.f.phone', icon: '📞', placeholder: '01XXXXXXXXX' },
  { key: 'whatsapp', labelKey: 'contact.f.whatsapp', icon: '🟢', placeholderKey: 'contact.ph.whatsapp' },
  { key: 'email', labelKey: 'contact.f.email', icon: '✉️', placeholder: 'support@example.com' },
  { key: 'facebook', labelKey: 'contact.f.facebook', icon: '📘', placeholder: 'https://facebook.com/yourpage' },
  { key: 'messenger', labelKey: 'contact.f.messenger', icon: '💬', placeholder: 'https://m.me/yourpage' },
  { key: 'telegram', labelKey: 'contact.f.telegram', icon: '✈️', placeholder: 'https://t.me/username' },
  { key: 'instagram', labelKey: 'contact.f.instagram', icon: '📸', placeholder: 'https://instagram.com/username' },
  { key: 'youtube', labelKey: 'contact.f.youtube', icon: '▶️', placeholder: 'https://youtube.com/@channel' },
  { key: 'twitter', labelKey: 'contact.f.twitter', icon: '🐦', placeholder: 'https://x.com/username' },
  { key: 'tiktok', labelKey: 'contact.f.tiktok', icon: '🎵', placeholder: 'https://tiktok.com/@username' },
  { key: 'website', labelKey: 'contact.f.website', icon: '🌐', placeholder: 'https://example.com' },
];

const isHttp = (v) => /^https?:\/\//i.test(String(v || '').trim());
const looksLikePhone = (v) => /^\+?[\d\s()-]{6,20}$/.test(String(v || '').trim());
const digits = (v) => String(v || '').replace(/\D/g, '');

// বাংলাদেশি নাম্বার (01XXXXXXXXX) হলে wa.me-র জন্য 880 কোড বসায়
const waNumber = (v) => {
  const d = digits(v);
  return d.startsWith('01') && d.length === 11 ? `88${d}` : d;
};

export function buildContactList(contacts = {}, extras = []) {
  const list = [];
  for (const f of CONTACT_FIELDS) {
    const v = String(contacts[f.key] || '').trim();
    if (!v) continue;
    let href = null;
    if (f.key === 'phone') href = `tel:${v}`;
    else if (f.key === 'whatsapp') href = `https://wa.me/${waNumber(v)}`;
    else if (f.key === 'email') href = `mailto:${v}`;
    else if (isHttp(v)) href = v; // শুধু http/https লিংকই ক্লিকযোগ্য
    list.push({ id: f.key, label: translate(`contact.s.${f.key}`), icon: f.icon, text: v, href });
  }
  for (const [i, e] of (extras || []).entries()) {
    const v = String(e.value || '').trim();
    if (!e.label || !v) continue;
    let href = null;
    if (isHttp(v)) href = v;
    else if (looksLikePhone(v)) href = `tel:${v.replace(/[^\d+]/g, '')}`;
    list.push({ id: `x${i}`, label: e.label, icon: '🔗', text: v, href });
  }
  return list;
}
