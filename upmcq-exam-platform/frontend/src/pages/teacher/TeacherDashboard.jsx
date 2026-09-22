// ================== pages/teacher/TeacherDashboard.jsx ==================
import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchMyExams, deleteExam } from '../../features/exam/examSlice';
import axiosClient from '../../api/axiosClient';
import { useLanguage } from '../../context/LanguageContext';

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

  // Tab state: 'exams' অথবা 'students'
  const [activeTab, setActiveTab] = useState('exams');
  const [searchTerm, setSearchTerm] = useState('');

  // Student state
  const [students, setStudents] = useState([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState('');

  const exams = Array.isArray(examList) ? examList : [];

  // স্ট্যাটাস (draft/published/closed) এর অনুবাদ; অচেনা স্ট্যাটাস হলে যেমন আছে তেমনই দেখাবে
  const statusLabel = (status) => {
    const key = `status.${status}`;
    const label = t(key);
    return label === key ? status : label;
  };

  // 🔍 সার্চ টার্ম অনুযায়ী পরীক্ষা ফিল্টার করা
  const filteredExams = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return exams;
    return exams.filter(
      (exam) =>
        exam.title?.toLowerCase().includes(term) ||
        exam.status?.toLowerCase().includes(term) ||
        exam.examCode?.toLowerCase().includes(term)
    );
  }, [exams, searchTerm]);

  // 🔍 সার্চ টার্ম অনুযায়ী শিক্ষার্থী ফিল্টার করা
  const filteredStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return students;
    return students.filter(
      (s) =>
        s.name?.toLowerCase().includes(term) ||
        s.roll?.toLowerCase().includes(term) ||
        s.phone?.toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">{t('dash.welcome', { name: user?.name || t('dash.teacherFallback') })}</h1>
        {activeTab === 'exams' ? (
          <Link
            to="/teacher/upload"
            className="btn-primary"
          >
            {t('dash.newExam')}
          </Link>
        ) : (
          <button
            onClick={handleExportStudents}
            className="btn-success"
          >
            {t('dash.downloadExcel')}
          </button>
        )}
      </div>

      {/* 📌 ট্যাবস (Exams & Students) */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          className={`py-2 px-4 font-medium transition-colors ${
            activeTab === 'exams'
              ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
          onClick={() => {
            setActiveTab('exams');
            setSearchTerm('');
          }}
        >
          {t('dash.tabExams', { n: exams.length })}
        </button>
        <button
          className={`py-2 px-4 font-medium transition-colors ${
            activeTab === 'students'
              ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
          onClick={() => {
            setActiveTab('students');
            setSearchTerm('');
          }}
        >
          {t('dash.tabStudents')}
        </button>
      </div>

      {/* 🔍 সার্চবার */}
      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={
            activeTab === 'exams'
              ? t('dash.searchExams')
              : t('dash.searchStudents')
          }
          className="input w-full sm:w-96"
        />
      </div>

      {/* 📝 ট্যাব ১: পরীক্ষা তালিকা (Exams Tab) */}
      {activeTab === 'exams' && (
        <>
          {loading ? (
            <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
          ) : error ? (
            <p className="text-red-500">{t('dash.examsLoadError', { error: String(error) })}</p>
          ) : exams.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">{t('dash.noExams')}</p>
          ) : filteredExams.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">{t('dash.noExamMatch', { term: searchTerm })}</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredExams.map((exam) => (
                <div
                  key={exam._id}
                  className="card flex flex-col justify-between p-5"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg dark:text-white">{exam.title}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          statusColor[exam.status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {statusLabel(exam.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t('dash.examMeta', {
                        time: exam.settings?.totalTimeMinutes ?? '-',
                        marks: exam.settings?.marksPerQuestion ?? '-',
                      })}
                    </p>
                  </div>

                  <div className="flex gap-3 mt-4 text-sm items-center pt-2 border-t dark:border-gray-700/50">
                    <Link to={`/teacher/exam/${exam._id}`} className="text-primary-600 font-medium hover:underline">
                      {t('dash.editSettings')}
                    </Link>
                    <Link
                      to={`/teacher/exam/${exam._id}/results`}
                      className="text-primary-600 font-medium hover:underline"
                    >
                      {t('common.results')}
                    </Link>
                    <button
                      onClick={() => handleDelete(exam)}
                      className="text-red-600 font-medium ml-auto hover:text-red-700 transition-colors"
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

      {/* 🎓 ট্যাব ২: নিবন্ধিত শিক্ষার্থী (Students Tab) */}
      {activeTab === 'students' && (
        <>
          {studentLoading ? (
            <p className="text-gray-500 dark:text-gray-400">{t('dash.studentsLoading')}</p>
          ) : studentError ? (
            <p className="text-red-500">{studentError}</p>
          ) : students.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">{t('dash.noStudents')}</p>
          ) : filteredStudents.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">{t('dash.noStudentMatch', { term: searchTerm })}</p>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-b dark:border-gray-700 text-sm">
                      <th className="p-4">#</th>
                      <th className="p-4">{t('common.name')}</th>
                      <th className="p-4">{t('common.roll')}</th>
                      <th className="p-4">{t('dash.colMobile')}</th>
                      <th className="p-4">{t('dash.colRegDate')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700 text-gray-800 dark:text-gray-200 text-sm">
                    {filteredStudents.map((s, index) => (
                      <tr key={s._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                        <td className="p-4">{index + 1}</td>
                        <td className="p-4 font-medium">{s.name}</td>
                        <td className="p-4">{s.roll || '-'}</td>
                        <td className="p-4">{s.phone || '-'}</td>
                        <td className="p-4">
                          {s.createdAt ? new Date(s.createdAt).toLocaleDateString(locale) : '-'}
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
