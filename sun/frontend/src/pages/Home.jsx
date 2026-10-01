// ================== pages/Home.jsx ==================
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Reveal from '../components/Reveal';

const FEATURES = [
  { icon: '📄', id: 'f1' },
  { icon: '🔗', id: 'f2' },
  { icon: '⏱️', id: 'f3' },
  { icon: '🎯', id: 'f4' },
  { icon: '📊', id: 'f5' },
  { icon: '🎨', id: 'f6' },
];

const STEPS = ['s1', 's2', 's3', 's4'];
const CHIPS = [
  { icon: '📄', id: 'chip1' },
  { icon: '🔗', id: 'chip2' },
  { icon: '📊', id: 'chip3' },
];
const FAQS = ['faq1', 'faq2', 'faq3', 'faq4'];
const OPTIONS = ['H₂O', 'CO₂', 'NaCl', 'O₂'];

// হিরো সেকশনের ডান পাশের নমুনা পরীক্ষার কার্ড (শুধু ডেকোরেটিভ প্রিভিউ)
function ExamPreview({ t }) {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div
        aria-hidden
        className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-tr from-primary-400/30 via-sky-300/20 to-violet-300/30 blur-2xl"
      />
      <div className="card animate-float-slow p-5 text-left shadow-glow" role="img" aria-label={t('home.pv.hint')}>
        <div className="flex items-center justify-between">
          <span className="badge gap-1.5 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            {t('home.pv.live')}
          </span>
          <span className="text-sm font-semibold tabular-nums text-gray-500 dark:text-gray-400">⏱ 14:32</span>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
          <div className="h-full w-[15%] rounded-full bg-gradient-to-r from-primary-500 to-sky-500" />
        </div>
        <p className="mt-2 text-xs text-gray-400">{t('home.pv.progress')}</p>

        <p className="mt-3 font-semibold dark:text-white">{t('home.pv.q')}</p>

        <div className="mt-4 space-y-2.5">
          {OPTIONS.map((o, i) => (
            <div
              key={o}
              className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm ${
                i === 0
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-500/60 dark:bg-primary-500/10 dark:text-primary-300'
                  : 'border-gray-200 text-gray-700 dark:border-white/10 dark:text-gray-300'
              }`}
            >
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  i === 0 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              {o}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-white/5 dark:text-gray-400">
          <span aria-hidden>👥</span>
          {t('home.pv.joined')}
        </div>
      </div>
    </div>
  );
}

function CheckList({ prefix, count, tone }) {
  const { t } = useLanguage();
  return (
    <ul className="mt-5 space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
          <span
            aria-hidden
            className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${tone}`}
          >
            ✓
          </span>
          {t(`${prefix}${i + 1}`)}
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  const { t } = useLanguage();
  return (
    <div className="overflow-hidden">
      {/* ---------- Hero ---------- */}
      <section className="relative">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:pt-20 lg:grid-cols-2 lg:gap-8">
          <div className="text-center lg:text-left">
            <Reveal type="fade">
              <span className="badge mb-5 border border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-300">
                {t('home.badge')}
              </span>
            </Reveal>
            <Reveal type="up" delay={80} as="h1" className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl xl:text-6xl">
              <span className="gradient-text">{t('home.heroTitle1')}</span>
              <br />
              <span className="dark:text-white">{t('home.heroTitle2')}</span>
            </Reveal>
            <Reveal type="up" delay={160} as="p" className="mx-auto mt-6 max-w-xl text-base text-gray-600 dark:text-gray-300 sm:text-lg lg:mx-0">
              {t('home.heroDesc')}
            </Reveal>

            <Reveal type="up" delay={240} className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link to="/teacher/login" className="btn-primary px-6 py-3 text-base shadow-glow">
                {t('home.teacherLogin')}
              </Link>
              <Link to="/teacher/register" className="btn-secondary px-6 py-3 text-base">
                {t('home.createAccount')}
              </Link>
            </Reveal>

            <Reveal type="fade" delay={300} as="p" className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              {t('home.studentNote')}{' '}
              <Link to="/exams" className="link">
                {t('home.viewLive')}
              </Link>
            </Reveal>

            <Reveal type="fade" delay={360} className="mt-8 flex flex-wrap justify-center gap-2 lg:justify-start">
              {CHIPS.map((c) => (
                <span
                  key={c.id}
                  className="badge gap-1.5 border border-gray-200 bg-white/70 px-3 py-1.5 text-gray-600 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
                >
                  <span aria-hidden>{c.icon}</span>
                  {t(`home.${c.id}`)}
                </span>
              ))}
            </Reveal>
          </div>

          <Reveal type="zoom" delay={200}>
            <ExamPreview t={t} />
          </Reveal>
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <Reveal type="up" className="mx-auto mb-10 max-w-xl text-center">
          <h2 className="section-title">{t('home.featuresTitle')}</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            {t('home.featuresSub')}
          </p>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal
              key={f.id}
              type="up"
              delay={i * 80}
              className="card group p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-glow dark:hover:border-primary-500/30"
            >
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-primary-50 text-2xl transition-transform duration-300 group-hover:scale-110 dark:bg-primary-500/10">
                {f.icon}
              </div>
              <h3 className="mb-1.5 font-semibold dark:text-white">{t(`home.${f.id}.title`)}</h3>
              <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{t(`home.${f.id}.desc`)}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="bg-gray-50/70 py-16 dark:bg-white/[0.02] sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <Reveal type="up" className="mx-auto mb-12 max-w-xl text-center">
            <h2 className="section-title">{t('home.howTitle')}</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 sm:text-base">{t('home.howSub')}</p>
          </Reveal>
          <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* ধাপগুলোকে যুক্ত করা লাইন (শুধু বড় স্ক্রিনে) */}
            <div
              aria-hidden
              className="absolute left-[12%] right-[12%] top-6 hidden border-t-2 border-dashed border-primary-200 dark:border-primary-500/20 lg:block"
            />
            {STEPS.map((s, i) => (
              <Reveal key={s} type="up" delay={i * 90} className="relative text-center sm:text-left">
                <span className="relative mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-primary-200 bg-white text-lg font-extrabold text-primary-600 shadow-soft dark:border-primary-500/30 dark:bg-gray-900 dark:text-primary-400 sm:mx-0">
                  {t(`home.${s}.n`)}
                </span>
                <h3 className="mt-4 font-semibold dark:text-white">{t(`home.${s}.title`)}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t(`home.${s}.desc`)}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Teachers & Students ---------- */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <Reveal type="up" className="mx-auto mb-10 max-w-xl text-center">
          <h2 className="section-title">{t('home.forTitle')}</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 sm:text-base">{t('home.forSub')}</p>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2">
          <Reveal type="left" className="card p-6 sm:p-8">
            <span className="text-3xl" aria-hidden>👩‍🏫</span>
            <h3 className="mt-3 text-lg font-bold dark:text-white">{t('home.forTeacher')}</h3>
            <CheckList
              prefix="home.ft"
              count={3}
              tone="bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300"
            />
          </Reveal>
          <Reveal type="right" className="card p-6 sm:p-8">
            <span className="text-3xl" aria-hidden>🎓</span>
            <h3 className="mt-3 text-lg font-bold dark:text-white">{t('home.forStudent')}</h3>
            <CheckList
              prefix="home.fs"
              count={3}
              tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
            />
          </Reveal>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="mx-auto max-w-3xl px-4 pb-16 sm:pb-20">
        <Reveal type="up" className="mb-8 text-center">
          <h2 className="section-title">{t('home.faqTitle')}</h2>
        </Reveal>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <Reveal key={f} type="up" delay={i * 60}>
              <details className="card group px-5 py-4 open:shadow-glow">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold dark:text-white [&::-webkit-details-marker]:hidden">
                  {t(`home.${f}.q`)}
                  <span
                    aria-hidden
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-600 transition-transform duration-200 group-open:rotate-45 dark:bg-primary-500/10 dark:text-primary-300"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{t(`home.${f}.a`)}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <Reveal type="zoom" className="card relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 p-10 text-center text-white shadow-glow dark:bg-gradient-to-br sm:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl"
          />
          <h2 className="relative text-2xl font-bold sm:text-3xl">{t('home.ctaTitle')}</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-sm text-primary-100 sm:text-base">
            {t('home.ctaDesc')}
          </p>
          <div className="relative mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/teacher/register"
              className="btn bg-white px-6 py-3 text-base text-primary-700 hover:bg-primary-50"
            >
              {t('home.ctaRegister')}
            </Link>
            <Link
              to="/exams"
              className="btn border border-white/40 px-6 py-3 text-base text-white hover:bg-white/10"
            >
              {t('home.ctaExams')}
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
