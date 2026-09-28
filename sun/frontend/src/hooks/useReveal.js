// ================== hooks/useReveal.js ==================
// স্ক্রল করে এলিমেন্ট ভিউপোর্টে ঢুকলে true রিটার্ন করে (IntersectionObserver ভিত্তিক)।
// Reveal.jsx কম্পোনেন্ট এটি ব্যবহার করে fade/slide-in অ্যানিমেশন ট্রিগার করে।
import { useEffect, useRef, useState } from 'react';

export default function useReveal({ threshold = 0.15, rootMargin = '0px 0px -8% 0px', once = true } = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    // মোশন কমানো থাকলে সরাসরি ভিজিবল ধরে নেওয়া
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, visible];
}
