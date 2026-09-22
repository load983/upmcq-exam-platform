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

export default function Home() {
  const { t } = useLanguage();
  return (
    <div className="overflow-hidden">
      {/* ---------- Hero ---------- */}
      <section className="relative">
        <div className="mx-auto max-w-4xl px-4 pb-16 pt-16 text-center sm:pt-24">
          <Reveal type="fade">
            <span className="badge mb-5 border border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-300">
              {t('home.badge')}
            </span>
          </Reveal>
          <Reveal type="up" delay={80} as="h1" className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            <span className="gradient-text">Live MCQ Exam</span>
            <br />
            <span className="dark:text-white">{t('home.heroTitle2')}</span>
          </Reveal>
          <Reveal type="up" delay={160} as="p" className="mx-auto mt-6 max-w-2xl text-base text-gray-600 dark:text-gray-300 sm:text-lg">
            {t('home.heroDesc')}
          </Reveal>

          <Reveal type="up" delay={240} className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link to="/teacher/login" className="btn-primary px-6 py-3 text-base shadow-glow">
              {t('home.teacherLogin')}
            </Link>
            <Link to="/teacher/register" className="btn-secondary px-6 py-3 text-base">
              {t('home.createAccount')}
            </Link>
          </Reveal>

          <Reveal type="fade" delay={300} as="p" className="mt-6 text-sm text-gray-400 dark:text-gray-500">
            {t('home.studentNote')}{' '}
            <Link to="/exams" className="link">
              {t('home.viewLive')}
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <Reveal type="up" className="mx-auto mb-10 max-w-xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">{t('home.featuresTitle')}</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t('home.featuresSub')}
          </p>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal
              key={f.id}
              type="up"
              delay={i * 80}
              className="card group p-6 transition-all hover:-translate-y-1 hover:shadow-glow"
            >
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-2xl dark:bg-primary-500/10">
                {f.icon}
              </div>
              <h3 className="mb-1.5 font-semibold dark:text-white">{t(`home.${f.id}.title`)}</h3>
              <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{t(`home.${f.id}.desc`)}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="bg-gray-50/70 py-20 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-5xl px-4">
          <Reveal type="up" className="mx-auto mb-12 max-w-xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">{t('home.howTitle')}</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('home.howSub')}</p>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s} type="up" delay={i * 90} className="relative">
                <span className="gradient-text text-4xl font-extrabold opacity-60">{t(`home.${s}.n`)}</span>
                <h3 className="mt-2 font-semibold dark:text-white">{t(`home.${s}.title`)}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t(`home.${s}.desc`)}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <Reveal type="zoom" className="card relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 p-10 text-center text-white shadow-glow sm:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
          />
          <h2 className="text-2xl font-bold sm:text-3xl">{t('home.ctaTitle')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-primary-100 sm:text-base">
            {t('home.ctaDesc')}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
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
