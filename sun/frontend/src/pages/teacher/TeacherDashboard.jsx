// ================== pages/teacher/TeacherDashboard.jsx ==================
import { Avatar, Icon, Badge } from '../admin/adminUi';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import QuickStart from '../../components/QuickStart';
import { useShellBadges } from '../../components/DashboardShell';
import { fetchMyExams, deleteExam } from '../../features/exam/examSlice';
import axiosClient from '../../api/axiosClient';
import { useLanguage } from '../../context/LanguageContext';
import SubscriptionBanner from '../../components/SubscriptionBanner';
import useTeacherFeatures from '../../hooks/useTeacherFeatures';
import { downloadFile } from '../../utils/download';
import MessagesTab from './MessagesTab';

const statusColor = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300',
  published: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  closed: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
};

// অ্যাডমিন প্যানেলের মতো স্ট্যাট কার্ড
function Stat({ label, value, onClick }) {
  const body = (
    <>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-primary-700 dark:text-primary-300">{value}</div>
    </>
  );
  return onClick
    ? <button type="button" onClick={onClick} className="card p-4 text-left transition hover:-translate-y-0.5 hover:shadow-glow focus-visible:ring-2 focus-visible:ring-primary-500">{body}</button>
    : <div className="card p-4">{body}</div>;
}

const TABS = ['overview', 'exams', 'pending', 'classes', 'students', 'messages'];

export default function TeacherDashboard() {
  const { t, locale } = useLanguage();
  const dispatch = useDispatch();
  const { exams: examList, loading, error } = useSelector((s) => s.exam);
  const { user } = useSelector((s) => s.auth);
  const { status: subStatus, has, warnLocked } = useTeacherFeatures();

  // Tab state: 'exams' অথবা 'students'
  // সক্রিয় ট্যাব URL-এ থাকে (?tab=...) — সাইডবারের লিংক এটাই বদলায়
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'overview';
  const setActiveTab = (k) => setSearchParams(k === 'overview' ? {} : { tab: k });
  const [searchTerm, setSearchTerm] = useState('');

  // Student state
  const [students, setStudents] = useState([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState('');
  // 🎓 শ্রেণী ও প্রতি শ্রেণীর এক্সেস কোড
  const [classes, setClasses] = useState([]);
  const [presets, setPresets] = useState([]);
  const [classFilter, setClassFilter] = useState('all');
  const [newClassName, setNewClassName] = useState('');
  const [classMsg, setClassMsg] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [studentClassFilter, setStudentClassFilter] = useState('all');

  const allExams = Array.isArray(examList) ? examList : [];
  const exams = allExams.filter((e) => !e.pending); // চূড়ান্ত পরীক্ষা
  const pendingExams = allExams.filter((e) => e.pending); // ⏳ অসম্পূর্ণ (পেন্ডিং) পরীক্ষা

  const loadClasses = useCallback(() => {
    axiosClient
      .get('/classes')
      .then(({ data }) => {
        setClasses(data.classes || []);
        setPresets(data.presets || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const handleCreateClass = async (name) => {
    const finalName = String(name ?? newClassName).trim();
    if (!finalName) return;
    if (!has('classes')) return warnLocked('classes');
    setClassMsg('');
    try {
      await axiosClient.post('/classes', { name: finalName });
      setNewClassName('');
      loadClasses();
    } catch (err) {
      setClassMsg(err.response?.data?.message || t('classes.createFailed'));
    }
  };

  const handleDeleteClass = async (cls) => {
    if (!window.confirm(t('classes.confirmDelete', { name: cls.name }))) return;
    try {
      await axiosClient.delete(`/classes/${cls._id}`);
      if (classFilter === cls._id) setClassFilter('all');
      loadClasses();
    } catch (err) {
      alert(err.response?.data?.message || t('classes.deleteFailed'));
    }
  };

  const handleCopyCode = (cls) => {
    navigator.clipboard
      ?.writeText(cls.accessCode)
      .then(() => {
        setCopiedId(cls._id);
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(() => {});
  };

  const remainingPresets = presets.filter((p) => !classes.some((c) => c.name === p));

  // স্ট্যাটাস (draft/published/closed) এর অনুবাদ; অচেনা স্ট্যাটাস হলে যেমন আছে তেমনই দেখাবে
  const statusLabel = (status) => {
    const key = `status.${status}`;
    const label = t(key);
    return label === key ? status : label;
  };

  // 🔍 সার্চ টার্ম অনুযায়ী পরীক্ষা ফিল্টার করা
  const filteredExams = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const examClassIds = (exam) => {
      const ids = (exam.classRefs || []).map((c) => c._id || c);
      return ids.length ? ids : ['none'];
    };
    return exams.filter((exam) => {
      if (classFilter !== 'all' && !examClassIds(exam).includes(classFilter)) return false;
      if (!term) return true;
      return (
        exam.title?.toLowerCase().includes(term) ||
        exam.status?.toLowerCase().includes(term) ||
        exam.examCode?.toLowerCase().includes(term)
      );
    });
  }, [exams, searchTerm, classFilter]);

  // ⏳ পেন্ডিং পরীক্ষা (নাম দিয়ে সার্চ)
  const filteredPending = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return pendingExams.filter((e) => !term || e.title?.toLowerCase().includes(term));
  }, [pendingExams, searchTerm]);

  const fmtTime = (d) => {
    try {
      return new Date(d).toLocaleString(locale || undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch (e) {
      return '';
    }
  };

  // 🔍 সার্চ টার্ম অনুযায়ী শিক্ষার্থী ফিল্টার করা
  const filteredStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return students.filter((s) => {
      if (studentClassFilter !== 'all' && !(s.classes || []).some((c) => c._id === studentClassFilter)) return false;
      if (!term) return true;
      return (
        s.name?.toLowerCase().includes(term) ||
        s.roll?.toLowerCase().includes(term) ||
        s.phone?.toLowerCase().includes(term)
      );
    });
  }, [students, searchTerm, studentClassFilter]);

  useEffect(() => {
    dispatch(fetchMyExams());
  }, [dispatch]);

  // শিক্ষার্থী ডাটা ফেচ করা
  useEffect(() => {
    if (activeTab === 'students') {
      setStudentLoading(true);
      setStudentError('');
      axiosClient
        .get('/auth/students')
        .then((res) => {
          setStudents(res.data);
          setStudentLoading(false);
        })
        .catch((err) => {
          setStudentError(err.response?.data?.message || t('dash.studentsLoadError'));
          setStudentLoading(false);
        });
    }
  }, [activeTab]);

  // 🗑️ পরীক্ষা ডিলিট হ্যান্ডলার
  const handleDelete = async (exam) => {
    const confirmed = window.confirm(
      t('dash.confirmDelete', { title: exam.title })
    );

    if (confirmed) {
      try {
        await dispatch(deleteExam(exam._id)).unwrap();
        dispatch(fetchMyExams());
      } catch (err) {
        alert(typeof err === 'string' ? err : t('dash.deleteFailed'));
      }
    }
  };

  // 📥 এক্সেল ফাইল ডাউনলোড হ্যান্ডলার
  const handleExportStudents = async () => {
    try {
      const response = await axiosClient.get('/auth/students/export', {
        responseType: 'blob',
        params: studentClassFilter !== 'all' ? { classId: studentClassFilter } : {},
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'students_list.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(t('dash.excelFailed'));
    }
  };

  // 📄 পরীক্ষার PDF (প্রশ্নপত্র অথবা উত্তরসহ)
  const [pdfBusy, setPdfBusy] = useState('');
  const handleExamPdf = async (exam, withAnswers) => {
    if (!has('downloadExamPdf')) return warnLocked('downloadExamPdf');
    const key = `${exam._id}:${withAnswers ? 1 : 0}`;
    setPdfBusy(key);
    try {
      await downloadFile(`/exams/${exam._id}/pdf`, `${exam.title}-${withAnswers ? t('exam.pdfWithAnswers') : t('exam.pdfQuestions')}.pdf`, withAnswers ? { answers: 1 } : {});
    } catch (err) {
      alert(err.message);
    } finally {
      setPdfBusy('');
    }
  };

  // 🚫 শিক্ষার্থীকে ব্যান / আনব্যান
  const handleToggleBan = async (student) => {
    const willBan = !student.banned;
    if (willBan && !window.confirm(t('dash.banConfirm', { name: student.name }))) return;
    try {
      await axiosClient.patch(`/auth/students/${student._id}/ban`, { banned: willBan });
      setStudents((list) => list.map((s) => (s._id === student._id ? { ...s, banned: willBan } : s)));
    } catch (err) {
      alert(err.response?.data?.message || t('dash.banFailed'));
    }
  };

  const goTab = (k) => { setActiveTab(k); setSearchTerm(''); };

  useShellBadges({ pending: pendingExams.length });

  // একটি পরীক্ষার অ্যাকশন বাটন (এডিট / রেজাল্ট / PDF / ডিলিট)
  const examActions = (exam) => (
    <div className="flex flex-wrap gap-1">
      <Link to={`/teacher/exam/${exam._id}`} className="btn-secondary !px-2 !py-1 text-xs">{t('dash.editSettings')}</Link>
      {has('results') ? (
        <Link to={`/teacher/exam/${exam._id}/results`} className="btn-secondary !px-2 !py-1 text-xs">{t('common.results')}</Link>
      ) : (
        <button onClick={() => warnLocked('results')} className="btn-secondary !px-2 !py-1 text-xs opacity-60">🔒 {t('common.results')}</button>
      )}
      {[false, true].map((withAns) => (
        <button
          key={withAns ? 'a' : 'q'}
          onClick={() => handleExamPdf(exam, withAns)}
          disabled={!!pdfBusy}
          title={withAns ? t('exam.pdfAnswersTitle') : t('exam.pdfQuestionsTitle')}
          className={`btn-secondary !px-2 !py-1 text-xs ${has('downloadExamPdf') ? '' : 'opacity-60'}`}
        >
          {has('downloadExamPdf') ? '📄' : '🔒'} {pdfBusy === `${exam._id}:${withAns ? 1 : 0}` ? '...' : (withAns ? t('exam.pdfWithAnswers') : t('exam.pdfQuestions'))}
        </button>
      ))}
      <button onClick={() => handleDelete(exam)} className="btn-danger !px-2 !py-1 text-xs">{t('common.delete')}</button>
    </div>
  );

  const examTitleCell = (exam) => (
    <div>
      <div className="font-medium dark:text-white">{exam.title}</div>
      <div className="font-mono text-xs text-gray-500">{exam.examCode}</div>
    </div>
  );

  const classNamesOf = (exam) => (exam.classRefs?.length ? t('classes.classNames', { names: exam.classRefs.map((c) => c.name).join(', ') }) : t('classes.noClass'));

  const canCreate = activeTab === 'overview' || activeTab === 'exams' || activeTab === 'pending';

  return (
    <div>
      <main className="min-w-0 space-y-4">
        <SubscriptionBanner status={subStatus} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-semibold dark:text-white">
            {activeTab === 'overview' ? t('dash.welcome', { name: user?.name || t('dash.teacherFallback') }) : t(`t.tab.${activeTab}`)}
          </h1>
          {canCreate ? (
            <div className="flex flex-wrap gap-2">
              {has('createExam') ? (
                <Link to="/teacher/create" className="btn-primary">{t('dash.newExamOnline')}</Link>
              ) : (
                <button onClick={() => warnLocked('createExam')} className="btn-primary opacity-60">🔒 {t('dash.newExamOnline')}</button>
              )}
              {has('uploadExam') ? (
                <Link to="/teacher/upload" className="btn-secondary">{t('dash.newExam')}</Link>
              ) : (
                <button onClick={() => warnLocked('uploadExam')} className="btn-secondary opacity-60">🔒 {t('dash.newExam')}</button>
              )}
            </div>
          ) : activeTab === 'students' ? (
            <button
              onClick={has('exportStudents') ? handleExportStudents : () => warnLocked('exportStudents')}
              className={`btn-success ${has('exportStudents') ? '' : 'opacity-60'}`}
            >
              {has('exportStudents') ? '' : '🔒 '}
              {t('dash.downloadExcel')}
            </button>
          ) : null}
        </div>

        {/* ---------- ওভারভিউ ---------- */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <Stat label={t('t.stat.exams')} value={exams.length} onClick={() => goTab('exams')} />
              <Stat label={t('t.stat.pending')} value={pendingExams.length} onClick={() => goTab('pending')} />
              <Stat label={t('t.stat.classes')} value={classes.length} onClick={() => goTab('classes')} />
            </div>
            <QuickStart
              title={t('qs.title')}
              subtitle={t('qs.teacher.sub')}
              steps={[
                { icon: 'tag', title: t('qs.teacher.1.t'), body: t('qs.teacher.1.b'), to: '/teacher/dashboard?tab=classes' },
                { icon: 'plus', title: t('qs.teacher.2.t'), body: t('qs.teacher.2.b'), to: '/teacher/create' },
                { icon: 'file', title: t('qs.teacher.3.t'), body: t('qs.teacher.3.b'), to: '/teacher/dashboard?tab=exams' },
                { icon: 'chart', title: t('qs.teacher.4.t'), body: t('qs.teacher.4.b'), to: '/teacher/dashboard?tab=students' },
              ]}
            />
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm text-gray-500">{t('t.recent')}</h2>
                {exams.length > 5 && <button className="act" onClick={() => goTab('exams')}>{t('t.viewAll')}</button>}
              </div>
              {loading ? (
                <div className="empty">{t('common.loading')}</div>
              ) : exams.length === 0 ? (
                <div className="empty">{t('dash.noExams')}</div>
              ) : (
                <div className="card overflow-x-auto !p-1">
                  <table className="admin-table">
                    <thead><tr><th>{t('t.col.exam')}</th><th>{t('t.col.class')}</th><th>{t('t.col.status')}</th><th>{t('t.col.actions')}</th></tr></thead>
                    <tbody className="dark:text-gray-200">
                      {exams.slice(0, 5).map((exam) => (
                        <tr key={exam._id} className="align-top">
                          <td>{examTitleCell(exam)}</td>
                          <td className="text-xs text-primary-700 dark:text-primary-300">{classNamesOf(exam)}</td>
                          <td><span className={`badge ${statusColor[exam.status] || statusColor.draft}`}>{statusLabel(exam.status)}</span></td>
                          <td>{examActions(exam)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ---------- শ্রেণী ও এক্সেস কোড ---------- */}
        {activeTab === 'classes' && (
          <>
      <div className="card p-5 sm:p-6">
        <h2 className="text-lg font-semibold dark:text-white">{t('classes.title')}</h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{t('classes.desc')}</p>

        {classes.length > 0 && (
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            {classes.map((c) => (
              <div key={c._id} className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                <div>
                  <p className="font-medium dark:text-white">{t('classes.className', { name: c.name })}</p>
                  <p className="text-xs text-gray-400">{t('classes.examCount', { n: c.examCount })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-primary-50 px-3 py-1 font-mono font-bold tracking-widest text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">
                    {c.accessCode}
                  </span>
                  <button onClick={() => handleCopyCode(c)} className="btn-secondary !px-2 !py-1 text-xs">
                    {copiedId === c._id ? t('dash.accessCodeCopied') : t('dash.accessCodeCopy')}
                  </button>
                  <button onClick={() => handleDeleteClass(c)} className="text-red-500 text-sm" title={t('common.delete')}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mb-2 text-sm font-medium dark:text-gray-200">{t('classes.pickToCreate')}</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {remainingPresets.map((p) => (
            <button
              key={p}
              onClick={() => handleCreateClass(p)}
              className="rounded-full border border-gray-300 px-3 py-1 text-sm hover:border-primary-500 hover:text-primary-600 dark:border-white/10 dark:text-gray-300"
            >
              + {p}
            </button>
          ))}
        </div>
        <div className="flex gap-2 sm:max-w-md">
          <input
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            placeholder={t('classes.customPlaceholder')}
            className="input"
          />
          <button onClick={() => handleCreateClass()} className="btn-primary shrink-0">
            {t('classes.create')}
          </button>
        </div>
        {classMsg && <p className="mt-2 text-sm text-red-600">{classMsg}</p>}
      </div>
          </>
        )}

        {/* 🔍 সার্চবার */}
        {['exams', 'pending', 'students'].includes(activeTab) && (
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeTab !== 'students' ? t('dash.searchExams') : t('dash.searchStudents')}
            className="input w-full bg-white sm:w-96 dark:bg-white/5"
          />
        )}

        {/* 📝 পরীক্ষা তালিকা */}
        {activeTab === 'exams' && (
          <>
            <div className="flex flex-wrap gap-2">
              {[['all', t('classes.filterAll')], ...classes.map((c) => [c._id, c.name]), ['none', t('classes.filterNone')]].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setClassFilter(key)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    classFilter === key
                      ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/25'
                      : 'border border-gray-200 bg-white text-gray-600 hover:border-primary-400 dark:border-white/10 dark:bg-white/5 dark:text-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {loading ? (
              <div className="empty">{t('common.loading')}</div>
            ) : error ? (
              <p className="text-red-500">{t('dash.examsLoadError', { error: String(error) })}</p>
            ) : exams.length === 0 ? (
              <div className="empty">{t('dash.noExams')}</div>
            ) : filteredExams.length === 0 ? (
              <div className="empty">{t('dash.noExamMatch', { term: searchTerm })}</div>
            ) : (
              <div className="card overflow-x-auto !p-1">
                <table className="admin-table">
                  <thead><tr><th>{t('t.col.exam')}</th><th>{t('t.col.class')}</th><th>{t('t.col.details')}</th><th>{t('t.col.status')}</th><th>{t('t.col.actions')}</th></tr></thead>
                  <tbody className="dark:text-gray-200">
                    {filteredExams.map((exam) => (
                      <tr key={exam._id} className="align-top">
                        <td>{examTitleCell(exam)}</td>
                        <td className="text-xs text-primary-700 dark:text-primary-300">{classNamesOf(exam)}</td>
                        <td className="text-xs text-gray-500 dark:text-gray-400">{t('dash.examMeta', { time: exam.settings?.totalTimeMinutes ?? '-', marks: exam.settings?.marksPerQuestion ?? '-' })}</td>
                        <td><span className={`badge ${statusColor[exam.status] || statusColor.draft}`}>{statusLabel(exam.status)}</span></td>
                        <td>{examActions(exam)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ⏳ পেন্ডিং (অসম্পূর্ণ) পরীক্ষা */}
        {activeTab === 'pending' && (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('dash.pendingHelp')}</p>
            {loading ? (
              <div className="empty">{t('common.loading')}</div>
            ) : pendingExams.length === 0 ? (
              <div className="empty">{t('dash.noPending')}</div>
            ) : filteredPending.length === 0 ? (
              <div className="empty">{t('dash.noExamMatch', { term: searchTerm })}</div>
            ) : (
              <div className="card overflow-x-auto !p-1">
                <table className="admin-table">
                  <thead><tr><th>{t('t.col.exam')}</th><th>{t('t.col.details')}</th><th>{t('t.col.status')}</th><th>{t('t.col.actions')}</th></tr></thead>
                  <tbody className="dark:text-gray-200">
                    {filteredPending.map((exam) => (
                      <tr key={exam._id} className="align-top">
                        <td className="font-medium dark:text-white">{exam.title}</td>
                        <td className="text-xs text-gray-500 dark:text-gray-400">{t('dash.pendingMeta', { n: exam.pendingQuestionCount ?? 0, time: fmtTime(exam.updatedAt) })}</td>
                        <td><span className="badge bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">⏳ {t('dash.pendingBadge')}</span></td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            <Link to={`/teacher/create?pending=${exam._id}`} className="btn-secondary !px-2 !py-1 text-xs">{t('dash.pendingEdit')}</Link>
                            <button onClick={() => handleDelete(exam)} className="btn-danger !px-2 !py-1 text-xs">{t('common.delete')}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* 💬 ট্যাব ৩: Message with student */}
      {activeTab === 'messages' && <MessagesTab classes={classes} />}

        {/* 🎓 ট্যাব ২: নিবন্ধিত শিক্ষার্থী (Students Tab) */}
      {activeTab === 'students' && (
        <>
          {/* 🎓 শ্রেণী অনুযায়ী শিক্ষার্থী ফিল্টার (এক্সেল ডাউনলোডও এই ফিল্টার অনুযায়ী হবে) */}
          <div className="mb-5 flex flex-wrap gap-2">
            {[['all', t('classes.filterAll')], ...classes.map((c) => [c._id, c.name])].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStudentClassFilter(key)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  studentClassFilter === key
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/25'
                    : 'border border-gray-200 bg-white text-gray-600 hover:border-primary-400 dark:border-white/10 dark:bg-white/5 dark:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {studentLoading ? (
            <div className="empty">{t('dash.studentsLoading')}</div>
          ) : studentError ? (
            <p className="text-red-500">{studentError}</p>
          ) : students.length === 0 ? (
            <div className="empty">{t('dash.noStudents')}</div>
          ) : filteredStudents.length === 0 ? (
            <div className="empty">{t('dash.noStudentMatch', { term: searchTerm })}</div>
          ) : (
            <div className="card !p-1">
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{t('common.name')}</th>
                      <th>{t('common.roll')}</th>
                      <th>{t('dash.colMobile')}</th>
                      <th>{t('dash.colClass')}</th>
                      <th>{t('dash.colRegDate')}</th>
                      <th>{t('dash.colStatus')}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="dark:text-gray-200">
                    {filteredStudents.map((s, index) => (
                      <tr key={s._id}>
                        <td>{index + 1}</td>
                        <td className="font-medium"><div className="flex items-center gap-3"><Avatar name={s.name} />{s.name}</div></td>
                        <td>{s.roll || '-'}</td>
                        <td>{s.phone || '-'}</td>
                        <td>{s.classes?.length ? s.classes.map((c) => c.name).join(', ') : '-'}</td>
                        <td>
                          {s.createdAt ? new Date(s.createdAt).toLocaleDateString(locale) : '-'}
                        </td>
                        <td>
                          <span className={`badge ${s.banned ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                            {s.banned ? t('dash.statusBanned') : t('dash.statusActive')}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggleBan(s)}
                            className={s.banned ? 'act' : 'act-danger'}
                          >
                            {s.banned ? t('dash.unban') : t('dash.ban')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
      </main>
    </div>
  );
}
