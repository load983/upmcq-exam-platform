// ================== pages/StudentHome.jsx ==================
import { Avatar } from './admin/adminUi';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../context/LanguageContext';

export default function StudentHome() {
  const { t } = useLanguage();
  const { user, token } = useSelector((s) => s.auth);
  const isStudent = !!(user && token && user.role === 'student');

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [needsAccessCode, setNeedsAccessCode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 🔑 এক্সেস কোড সংক্রান্ত স্টেট
  const [teachers, setTeachers] = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [accessCodeMsg, setAccessCodeMsg] = useState({ type: '', text: '' });
  const [connecting, setConnecting] = useState(false);

  const loadExams = () => {
    setLoading(true);
    axiosClient
      .get('/exams/public-list')
      .then(({ data }) => {
        if (Array.isArray(data)) {
          // ব্যাকওয়ার্ড কম্প্যাটিবিলিটি (পুরোনো শেপ)
          setExams(data);
          setNeedsAccessCode(false);
        } else {
          setExams(Array.isArray(data?.exams) ? data.exams : []);
          setNeedsAccessCode(!!data?.needsAccessCode);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching exams:', err);
        setExams([]);
        setLoading(false);
      });
  };

  const loadTeachers = () => {
    if (!isStudent) return;
    setTeachersLoading(true);
    axiosClient
      .get('/auth/student/my-teachers')
      .then(({ data }) => setTeachers(Array.isArray(data) ? data : []))
      .catch(() => setTeachers([]))
      .finally(() => setTeachersLoading(false));
  };

  useEffect(() => {
    if (isStudent) {
      loadExams();
      loadTeachers();
    } else {
      setLoading(false);
      setExams([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStudent]);

  const handleAddAccessCode = async (e) => {
    e.preventDefault();
    if (!accessCodeInput.trim()) return;
    setConnecting(true);
    setAccessCodeMsg({ type: '', text: '' });
    try {
      const { data } = await axiosClient.post('/auth/student/connect-teacher', {
        accessCode: accessCodeInput.trim(),
      });
      setAccessCodeMsg({ type: 'success', text: data.message || t('studentHome.accessCodeAdded') });
      setAccessCodeInput('');
      loadTeachers();
      loadExams();
    } catch (err) {
      setAccessCodeMsg({
        type: 'error',
        text: err.response?.data?.message || t('studentHome.accessCodeFailed'),
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleRemoveTeacher = async (classId) => {
    try {
      await axiosClient.delete(`/auth/student/classes/${classId}`);
      loadTeachers();
      loadExams();
    } catch (err) {
      // নীরবে উপেক্ষা করা হলো, তালিকা যেমন আছে তেমনই থাকবে
    }
  };

  // সার্চ ইনপুট অনুসারে ফিল্টার করা
  const filteredExams = exams.filter((exam) => {
    const q = searchQuery.toLowerCase();
    return (
      exam.title.toLowerCase().includes(q) ||
      (exam.teacherName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen px-4 py-10 md:py-14">
      <div className="mx-auto max-w-4xl">
        {/* হেডার ও শিরোনাম */}
        <header className="mb-10 text-center">
          <h1 className="mb-3 flex items-center justify-center gap-2 text-3xl font-extrabold md:text-4xl">
            <span>🎓</span> <span className="gradient-text">{t('studentHome.title')}</span>
          </h1>
          <p className="mb-6 text-gray-500 dark:text-gray-400">
            {t('studentHome.subtitle')}
          </p>

          {/* ট্যাব: সব পরীক্ষা / Past exam (শুধু লগইন করা স্টুডেন্টের জন্য) */}
          {isStudent && (
            <div className="mx-auto mb-6 inline-flex rounded-full border border-gray-200 p-1 dark:border-white/10">
              <span className="rounded-full bg-primary-600 px-4 py-1.5 text-sm font-medium text-white">
                {t('pastExams.tabAll')}
              </span>
              <Link
                to="/exams/past"
                className="rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-primary-600 dark:text-gray-300"
              >
                {t('pastExams.tabPast')}
              </Link>
            </div>
          )}

          {/* সার্চ বার (শুধু লগইন করা স্টুডেন্টের জন্য) */}
          {isStudent && (
          <div className="relative mx-auto max-w-md">
            <input
              type="text"
              placeholder={t('studentHome.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-11"
            />
            <svg
              className="absolute left-3.5 top-3 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:bg-white/10 dark:text-gray-300"
              >
                {t('studentHome.clear')}
              </button>
            )}
          </div>
          )}
        </header>

        {!isStudent ? (
          /* লগইন করা না থাকলে — এক্সাম লিস্ট না দেখিয়ে লগইন/রেজিস্ট্রেশনের অনুরোধ */
          <div className="card mx-auto max-w-lg p-8 text-center md:p-12">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary-50 text-3xl dark:bg-primary-500/10">
              🔑
            </div>
            <h3 className="mb-2 text-xl font-bold dark:text-gray-100">{t('studentHome.loginNeededTitle')}</h3>
            <p className="mb-6 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              {t('studentHome.loginNeededDesc')}
            </p>
            <Link to="/student/auth" className="btn-primary inline-block">
              {t('studentHome.loginNeededCta')}
            </Link>
          </div>
        ) : (
          <>
            {/* 🔑 এক্সেস কোড প্যানেল */}
            <div className="card mb-8 p-5">
              <h2 className="mb-1 font-semibold dark:text-white">{t('studentHome.accessCodeTitle')}</h2>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                {t('studentHome.accessCodeDesc')}
              </p>

              <form onSubmit={handleAddAccessCode} className="mb-4 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={accessCodeInput}
                  onChange={(e) => setAccessCodeInput(e.target.value)}
                  placeholder={t('studentHome.accessCodePlaceholder')}
                  className="input flex-1"
                />
                <button type="submit" disabled={connecting} className="btn-primary sm:w-auto">
                  {connecting ? t('studentHome.accessCodeAdding') : t('studentHome.accessCodeSubmit')}
                </button>
              </form>

              {accessCodeMsg.text && (
                <p
                  className={`mb-4 text-sm ${
                    accessCodeMsg.type === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {accessCodeMsg.text}
                </p>
              )}

              {teachersLoading ? (
                <p className="text-sm text-gray-400">{t('common.loading')}</p>
              ) : teachers.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('studentHome.noTeachers')}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {teachers.map((tc) => (
                    <span
                      key={tc._id}
                      className="badge flex items-center gap-2 border border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-300"
                    >
                      {tc.teacherName ? `${tc.teacherName} • ` : ''}{t('classes.className', { name: tc.name })}
                      <button
                        type="button"
                        onClick={() => handleRemoveTeacher(tc._id)}
                        title={t('studentHome.removeTeacher')}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* কন্টেন্ট লোডিং অবস্থা */}
        {!isStudent ? null : loading ? (
          <div className="py-16 text-center text-gray-400 dark:text-gray-500">
            <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
            <p>{t('studentHome.loading')}</p>
          </div>
        ) : filteredExams.length === 0 ? (
          /* সুন্দর খালি ফলাফল নোটিফিকেশন কার্ড */
          <div className="card mx-auto max-w-lg p-8 text-center md:p-12">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-gray-100 text-3xl text-gray-400 dark:bg-white/5">
              {searchQuery ? '🔎' : needsAccessCode ? '🔑' : '📑'}
            </div>

            <h3 className="mb-2 text-xl font-bold dark:text-gray-100">
              {searchQuery
                ? t('studentHome.noResultTitle')
                : needsAccessCode
                ? t('studentHome.needAccessCodeTitle')
                : t('studentHome.noExamsTitle')}
            </h3>

            <p className="mb-6 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              {searchQuery ? (
                (() => {
                  // অনুবাদের ভেতরের {query} অংশটা হাইলাইট করে দেখানো (দুই ভাষায় শব্দক্রম আলাদা হতে পারে)
                  const [before, after] = t('studentHome.noResultDesc').split('{query}');
                  return (
                    <>
                      {before}
                      <span className="font-semibold text-primary-600 dark:text-primary-400">{searchQuery}</span>
                      {after}
                    </>
                  );
                })()
              ) : needsAccessCode ? (
                t('studentHome.needAccessCodeDesc')
              ) : (
                t('studentHome.noExamsDesc')
              )}
            </p>

            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="btn-secondary text-sm">
                {t('studentHome.showAll')}
              </button>
            )}
          </div>
        ) : (
          /* পরীক্ষাগুলোর কার্ড লিস্ট */
          <div className="grid gap-4 md:grid-cols-2">
            {filteredExams.map((exam) => (
              <div
                key={exam._id}
                className="card flex flex-col justify-between p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-glow dark:hover:border-primary-500/40"
              >
                <div>
                  <div className="mb-3 flex items-start gap-3">
                    {exam.teacherName && <Avatar name={exam.teacherName} />}
                    <div>
                      <h2 className="text-lg font-semibold leading-snug dark:text-gray-100">{exam.title}</h2>
                      {exam.teacherName && (
                        <p className="text-sm font-medium text-primary-600 dark:text-primary-400">
                          {t('studentHome.by', { name: exam.teacherName })}
                        </p>
                      )}
                    </div>
                  </div>
                  {exam.classNames?.length > 0 && (
                    <p className="mb-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                      🎓 {t('classes.classNames', { names: exam.classNames.join(', ') })}
                    </p>
                  )}

                  <div className="mb-5 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-2.5 text-xs text-gray-500 dark:border-white/5 dark:bg-white/5 dark:text-gray-400">
                    <span>
                      {t('studentHome.time', {
                        value: exam.settings?.totalTimeMinutes
                          ? t('studentHome.minutes', { n: exam.settings.totalTimeMinutes })
                          : t('studentHome.noTimeLimit'),
                      })}
                    </span>
                    <span className="badge border border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-300">
                      {t('studentHome.attempted', { n: exam.attemptCount ?? 0 })}
                    </span>
                  </div>
                </div>

                <Link to={`/join/${exam.examCode}`} className="btn-primary w-full">
                  {t('studentHome.takeExam')}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
