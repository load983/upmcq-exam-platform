// ================== components/BrandLogo.jsx ==================
// সাইটের লোগো: অ্যাডমিন লোগো আপলোড করলে সেটা, নাহলে ডিফল্ট আইকন-বক্স।
import React from 'react';
import { useSite } from '../context/SiteContext';

export default function BrandLogo({ size = 'h-9 w-9', radius = 'rounded-xl', fallback, className = '' }) {
  const { logoUrl } = useSite();
  if (logoUrl) {
    return <img src={logoUrl} alt="" className={`${size} shrink-0 ${radius} object-contain ${className}`} />;
  }
  return fallback;
}
