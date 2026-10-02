// ================== components/QuickStart.jsx ==================
// "Quick Start" কার্ড-গ্রিড — ধাপে ধাপে কী করতে হবে (প্রতিটা ড্যাশবোর্ডের ওভারভিউতে)
import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../pages/admin/adminUi';

const TONES = [
  'bg-red-500/15 text-red-500',
  'bg-emerald-500/15 text-emerald-500',
  'bg-blue-500/15 text-blue-500',
  'bg-amber-500/15 text-amber-500',
];

export default function QuickStart({ title, subtitle, steps }) {
  return (
    <section className="card p-5 md:p-6">
      <h2 className="text-lg font-semibold dark:text-white">{title}</h2>
      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {steps.map((s, i) => {
          const body = (
            <>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${TONES[i % TONES.length]}`}>
                <Icon name={s.icon} className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold dark:text-white">{i + 1}. {s.title}</span>
                <span className="mt-0.5 block text-sm text-gray-500 dark:text-gray-400">{s.body}</span>
              </span>
            </>
          );
          return s.to ? (
            <Link key={i} to={s.to} className="quick-card">{body}</Link>
          ) : (
            <div key={i} className="quick-card">{body}</div>
          );
        })}
      </div>
    </section>
  );
}
