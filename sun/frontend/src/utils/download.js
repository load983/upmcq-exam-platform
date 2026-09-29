// ================== utils/download.js ==================
// টোকেনসহ axios দিয়ে ফাইল (PDF/Excel) নামিয়ে ব্রাউজারে সেভ করায়।
// সার্ভার এরর দিলে (blob-এর ভেতরের JSON মেসেজ পড়ে) সেই মেসেজ throw করে।
import axiosClient from '../api/axiosClient';

export async function downloadFile(path, filename, params = {}) {
  try {
    const res = await axiosClient.get(path, { responseType: 'blob', params });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: res.headers['content-type'] }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 2000);
  } catch (err) {
    let message = 'ডাউনলোড করা যায়নি';
    try {
      const data = err.response?.data;
      if (data instanceof Blob) message = JSON.parse(await data.text()).message || message;
    } catch { /* JSON না হলে ডিফল্ট মেসেজ */ }
    throw new Error(message);
  }
}
