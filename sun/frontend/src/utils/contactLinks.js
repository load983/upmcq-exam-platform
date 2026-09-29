// ================== utils/contactLinks.js ==================
// অ্যাডমিনের সেভ করা যোগাযোগ তথ্য → ক্লিকযোগ্য লিংকের তালিকা (হেল্পলাইন উইজেট ও অ্যাডমিন প্রিভিউ দুই জায়গায় ব্যবহার)

// key → { label, icon, placeholder } (অ্যাডমিন ফর্মেও এটা দিয়ে ফিল্ড বানানো হয়)
export const CONTACT_FIELDS = [
  { key: 'phone', label: 'মোবাইল নাম্বার', icon: '📞', placeholder: '01XXXXXXXXX' },
  { key: 'whatsapp', label: 'WhatsApp নাম্বার', icon: '🟢', placeholder: '01XXXXXXXXX (দেশের কোড সহ/ছাড়া)' },
  { key: 'email', label: 'ইমেইল', icon: '✉️', placeholder: 'support@example.com' },
  { key: 'facebook', label: 'Facebook লিংক', icon: '📘', placeholder: 'https://facebook.com/yourpage' },
  { key: 'messenger', label: 'Messenger লিংক', icon: '💬', placeholder: 'https://m.me/yourpage' },
  { key: 'telegram', label: 'Telegram লিংক', icon: '✈️', placeholder: 'https://t.me/username' },
  { key: 'instagram', label: 'Instagram লিংক', icon: '📸', placeholder: 'https://instagram.com/username' },
  { key: 'youtube', label: 'YouTube লিংক', icon: '▶️', placeholder: 'https://youtube.com/@channel' },
  { key: 'twitter', label: 'X (Twitter) লিংক', icon: '🐦', placeholder: 'https://x.com/username' },
  { key: 'tiktok', label: 'TikTok লিংক', icon: '🎵', placeholder: 'https://tiktok.com/@username' },
  { key: 'website', label: 'ওয়েবসাইট', icon: '🌐', placeholder: 'https://example.com' },
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
    list.push({ id: f.key, label: f.label.replace(/ (লিংক|নাম্বার)$/, ''), icon: f.icon, text: v, href });
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
