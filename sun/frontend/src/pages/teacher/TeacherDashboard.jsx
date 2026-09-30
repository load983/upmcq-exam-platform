// ================== pages/teacher/TeacherDashboard.jsx ==================
import { Avatar } from '../admin/adminUi';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchMyExams, deleteExam } from '../../features/exam/examSlice';
import axiosClient from '../../api/axiosClient';
import { useLanguage } from '../../context/LanguageContext';
import SubscriptionBanner from '../../components/SubscriptionBanner';
import useTeacherFeatures from '../../hooks/useTeacherFeatures';
import { downloadFile } from '../../utils/download';
import MessagesTab from './MessagesTab';

const statusColor = {
  draft: 'bg-gray-200 text-gray-700',
  published: 'bg-green-100 text-green-700',
  closed: 'bg-red-100 text-red-700',
};

export default function TeacherDashboard() {
  const { t, locale } = useLanguage();
  const dispatch = useDispatch();
  const { exams: examList, loading, error } = useSelector((s) => s.exam);
  const { user } = useSelector((s) => s.auth);
  const { status: subStatus, has, warnLocked } = useTeacherFeatures();

  // Tab state: 'exams' অথবা 'students'
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(['pending', 'messages'].includes(searchParams.get('tab')) ? searchParams.get('tab') : 'exams');
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <SubscriptionBanner status={subStatus} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight dark:text-white sm:text-3xl">{t('dash.welcome', { name: user?.name || t('dash.teacherFallback') })}</h1>
        {activeTab !== 'students' && activeTab !== 'messages' ? (
          <div className="flex gap-3">
            {has('createExam') ? (
              <Link to="/teacher/create" className="btn-primary">
                {t('dash.newExamOnline')}
              </Link>
            ) : (
              <button onClick={() => warnLocked('createExam')} className="btn-primary opacity-60">
                🔒 {t('dash.newExamOnline')}
              </button>
            )}
            {has('uploadExam') ? (
              <Link to="/teacher/upload" className="btn-secondary">
                {t('dash.newExam')}
              </Link>
            ) : (
              <button onClick={() => warnLocked('uploadExam')} className="btn-secondary opacity-60">
                🔒 {t('dash.newExam')}
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={has('exportStudents') ? handleExportStudents : () => warnLocked('exportStudents')}
            className={`btn-success ${has('exportStudents') ? '' : 'opacity-60'}`}
          >
            {has('exportStudents') ? '' : '🔒 '}
            {t('dash.downloadExcel')}
          </button>
        )}
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[[t('t.stat.exams'), exams.length], [t('t.stat.pending'), pendingExams.length], [t('t.stat.classes'), classes.length]].map(([l, n]) => (
          <div key={l} className="card px-4 py-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">{l}</div>
            <div className="text-2xl font-semibold tabular-nums text-primary-700 dark:text-primary-300">{n}</div>
          </div>
        ))}
      </div>

      {/* 🎓 শ্রেণী ও প্রতি শ্রেণীর আলাদা এক্সেস কোড */}
      <div className="card mb-6 p-5 sm:p-6">
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

      {/* 📌 ট্যাবস (Exams & Students) */}
      <div role="tablist" className="seg">
        <button
          role="tab" aria-selected={activeTab === 'exams'} className="seg-item"
          onClick={() => {
            setActiveTab('exams');
            setSearchTerm('');
          }}
        >
          {t('dash.tabExams', { n: exams.length })}
        </button>
        <button
          role="tab" aria-selected={activeTab === 'pending'} className="seg-item"
          onClick={() => {
            setActiveTab('pending');
            setSearchTerm('');
          }}
        >
          ⏳ {t('dash.tabPending', { n: pendingExams.length })}
        </button>
        <button
          role="tab" aria-selected={activeTab === 'students'} className="seg-item"
          onClick={() => {
            setActiveTab('students');
            setSearchTerm('');
          }}
        >
          {t('dash.tabStudents')}
        </button>
        <button
          role="tab" aria-selected={activeTab === 'messages'} className="seg-item"
          onClick={() => {
            setActiveTab('messages');
            setSearchTerm('');
          }}
        >
          💬 {t('msg.tab')}
        </button>
      </div>

      {/* 🔍 সার্চবার */}
      <div className={`mb-6 ${activeTab === 'messages' ? 'hidden' : ''}`}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={
            activeTab !== 'students'
              ? t('dash.searchExams')
              : t('dash.searchStudents')
          }
          className="input w-full sm:w-96 bg-white dark:bg-white/5"
        />
      </div>

      {/* 📝 ট্যাব ১: পরীক্ষা তালিকা (Exams Tab) */}
      {activeTab === 'exams' && (
        <>
          {/* 🎓 শ্রেণী অনুযায়ী ফিল্টার */}
          <div className="mb-5 flex flex-wrap gap-2">
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
            <div className="grid gap-4 md:grid-cols-2">
              {filteredExams.map((exam) => (
                <div
                  key={exam._id}
                  className="card flex flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:shadow-glow"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold leading-snug dark:text-white">{exam.title}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          statusColor[exam.status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {statusLabel(exam.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-primary-600 dark:text-primary-400">
                      🎓 {exam.classRefs?.length ? t('classes.classNames', { names: exam.classRefs.map((c) => c.name).join(', ') }) : t('classes.noClass')}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t('dash.examMeta', {
                        time: exam.settings?.totalTimeMinutes ?? '-',
                        marks: exam.settings?.marksPerQuestion ?? '-',
                      })}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-gray-100 pt-3 text-sm dark:border-white/5">
                    <Link to={`/teacher/exam/${exam._id}`} className="act">
                      {t('dash.editSettings')}
                    </Link>
                    {has('results') ? (
                      <Link
                        to={`/teacher/exam/${exam._id}/results`}
                        className="act"
                      >
                        {t('common.results')}
                      </Link>
                    ) : (
                      <button onClick={() => warnLocked('results')} className="act !text-gray-400">
                        🔒 {t('common.results')}
                      </button>
                    )}
                    <button
                      onClick={() => handleExamPdf(exam, false)}
                      disabled={!!pdfBusy}
                      title={t('exam.pdfQuestionsTitle')}
                      className={has('downloadExamPdf') ? 'act' : 'act !text-gray-400'}
                    >
                      {has('downloadExamPdf') ? '📄' : '🔒'} {pdfBusy === `${exam._id}:0` ? '...' : t('exam.pdfQuestions')}
                    </button>
                    <button
                      onClick={() => handleExamPdf(exam, true)}
                      disabled={!!pdfBusy}
                      title={t('exam.pdfAnswersTitle')}
                      className={has('downloadExamPdf') ? 'act' : 'act !text-gray-400'}
                    >
                      {has('downloadExamPdf') ? '📄' : '🔒'} {pdfBusy === `${exam._id}:1` ? '...' : t('exam.pdfWithAnswers')}
                    </button>
                    <button
                      onClick={() => handleDelete(exam)}
                      className="act-danger ml-auto"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ⏳ ট্যাব: পেন্ডিং (অসম্পূর্ণ) পরীক্ষা */}
      {activeTab === 'pending' && (
        <>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{t('dash.pendingHelp')}</p>
          {loading ? (
            <div className="empty">{t('common.loading')}</div>
          ) : pendingExams.length === 0 ? (
            <div className="empty">{t('dash.noPending')}</div>
          ) : filteredPending.length === 0 ? (
            <div className="empty">{t('dash.noExamMatch', { term: searchTerm })}</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredPending.map((exam) => (
                <div key={exam._id} className="card flex flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:shadow-glow">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-lg font-semibold leading-snug dark:text-white">{exam.title}</h3>
                      <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                        ⏳ {t('dash.pendingBadge')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t('dash.pendingMeta', { n: exam.pendingQuestionCount ?? 0, time: fmtTime(exam.updatedAt) })}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-gray-100 pt-3 text-sm dark:border-white/5">
                    <Link to={`/teacher/create?pending=${exam._id}`} className="act">
                      {t('dash.pendingEdit')}
                    </Link>
                    <button
                      onClick={() => handleDelete(exam)}
                      className="act-danger ml-auto"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              ))}
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
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-b dark:border-gray-700 text-sm">
                      <th className="p-4">#</th>
                      <th className="p-4">{t('common.name')}</th>
                      <th className="p-4">{t('common.roll')}</th>
                      <th className="p-4">{t('dash.colMobile')}</th>
                      <th className="p-4">{t('dash.colClass')}</th>
                      <th className="p-4">{t('dash.colRegDate')}</th>
                      <th className="p-4">{t('dash.colStatus')}</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700 text-gray-800 dark:text-gray-200 text-sm">
                    {filteredStudents.map((s, index) => (
                      <tr key={s._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                        <td className="p-4">{index + 1}</td>
                        <td className="font-medium"><div className="flex items-center gap-3"><Avatar name={s.name} />{s.name}</div></td>
                        <td className="p-4">{s.roll || '-'}</td>
                        <td className="p-4">{s.phone || '-'}</td>
                        <td className="p-4">{s.classes?.length ? s.classes.map((c) => c.name).join(', ') : '-'}</td>
                        <td className="p-4">
                          {s.createdAt ? new Date(s.createdAt).toLocaleDateString(locale) : '-'}
                        </td>
                        <td className="p-4">
                          <span className={`badge ${s.banned ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                            {s.banned ? t('dash.statusBanned') : t('dash.statusActive')}
                          </span>
                        </td>
                        <td className="p-4">
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
    </div>
  );
}
