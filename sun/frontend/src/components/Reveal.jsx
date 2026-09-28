// ================== components/Reveal.jsx ==================
// যেকোনো কন্টেন্টকে স্ক্রল করে ভিউপোর্টে আসার সময় ফেড/স্লাইড-ইন করাতে
// এই কম্পোনেন্ট দিয়ে wrap করুন। উদাহরণ:
//   <Reveal><div className="card">...</div></Reveal>
//   <Reveal type="left" delay={120}>...</Reveal>
import React from 'react';
import useReveal from '../hooks/useReveal';

const TYPE_CLASS = {
  up: '',
  fade: 'reveal-fade',
  left: 'reveal-left',
  right: 'reveal-right',
  zoom: 'reveal-zoom',
};

export default function Reveal({
  as: Tag = 'div',
  type = 'up',
  delay = 0,
  className = '',
  children,
  ...rest
}) {
  const [ref, visible] = useReveal();

  return (
    <Tag
      ref={ref}
      className={`reveal ${TYPE_CLASS[type] || ''} ${visible ? 'is-visible' : ''} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
