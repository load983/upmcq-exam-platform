// ================== pages/teacher/TeacherDashboard.jsx ==================
import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchMyExams, deleteExam } from '../../features/exam/examSlice';
import axiosClient from '../../api/axiosClient';

const statusColor = {
  draft: 'bg-gray-200 text-gray-700',
  published: 'bg-green-100 text-green-700',
  closed: 'bg-red-100 text-red-700',
};

export default function TeacherDashboard() {
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
          setStudentError(err.response?.data?.message || 'শিক্ষার্থী তালিকা লোড করতে সমস্যা হয়েছে');
          setStudentLoading(false);
        });
    }
  }, [activeTab]);

  // 🗑️ পরীক্ষা ডিলিট হ্যান্ডলার
  const handleDelete = async (exam) => {
    const confirmed = window.confirm(
      `"${exam.title}" পরীক্ষাটি স্থায়ীভাবে ডিলিট করতে চাও? এর সাথে সব প্রশ্ন ও স্টুডেন্ট রেজাল্টও মুছে যাবে। এটা আর ফিরিয়ে আনা যাবে না।`
    );

    if (confirmed) {
      try {
        await dispatch(deleteExam(exam._id)).unwrap();
        dispatch(fetchMyExams());
      } catch (err) {
        alert(typeof err === 'string' ? err : 'পরীক্ষাটি ডিলিট করতে সমস্যা হয়েছে');
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
      alert('এক্সেল ফাইল ডাউনলোড করতে সমস্যা হয়েছে');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">স্বাগতম, {user?.name || 'শিক্ষক'} 👋</h1>
        {activeTab === 'exams' ? (
          <Link
            to="/teacher/upload"
            className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            + নতুন পরীক্ষা (PDF আপলোড)
          </Link>
        ) : (
          <button
            onClick={handleExportStudents}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            📥 এক্সেল ফাইল ডাউনলোড
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
          পরীক্ষাসমূহ ({exams.length})
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
          শিক্ষার্থী (Students)
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
              ? 'পরীক্ষার নাম, স্ট্যাটাস বা কোড দিয়ে খুঁজুন...'
              : 'শিক্ষার্থীর নাম, রোল বা মোবাইল নাম্বার দিয়ে খুঁজুন...'
          }
          className="w-full sm:w-96 px-4 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* 📝 ট্যাব ১: পরীক্ষা তালিকা (Exams Tab) */}
      {activeTab === 'exams' && (
        <>
          {loading ? (
            <p className="text-gray-500 dark:text-gray-400">লোড হচ্ছে...</p>
          ) : error ? (
            <p className="text-red-500">পরীক্ষা লোড করতে সমস্যা হয়েছে: {String(error)}</p>
          ) : exams.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">এখনো কোনো পরীক্ষা তৈরি করোনি।</p>
          ) : filteredExams.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">"{searchTerm}" এর সাথে মিলে এমন কোনো পরীক্ষা পাওয়া যায়নি।</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredExams.map((exam) => (
                <div
                  key={exam._id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border dark:border-gray-700 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg dark:text-white">{exam.title}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          statusColor[exam.status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {exam.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      সময়: {exam.settings?.totalTimeMinutes ?? '-'} মিনিট | মার্কস/প্রশ্ন:{' '}
                      {exam.settings?.marksPerQuestion ?? '-'}
                    </p>
                  </div>

                  <div className="flex gap-3 mt-4 text-sm items-center pt-2 border-t dark:border-gray-700/50">
                    <Link to={`/teacher/exam/${exam._id}`} className="text-primary-600 font-medium hover:underline">
                      এডিট / সেটিংস
                    </Link>
                    <Link
                      to={`/teacher/exam/${exam._id}/results`}
                      className="text-primary-600 font-medium hover:underline"
                    >
                      রেজাল্ট
                    </Link>
                    <button
                      onClick={() => handleDelete(exam)}
                      className="text-red-600 font-medium ml-auto hover:text-red-700 transition-colors"
                    >
                      ডিলিট
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
            <p className="text-gray-500 dark:text-gray-400">শিক্ষার্থী ডাটা লোড হচ্ছে...</p>
          ) : studentError ? (
            <p className="text-red-500">{studentError}</p>
          ) : students.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">এখনো কোনো শিক্ষার্থী অ্যাকাউন্ট তৈরি করেনি।</p>
          ) : filteredStudents.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">"{searchTerm}" এর সাথে মিলে এমন কোনো শিক্ষার্থী পাওয়া যায়নি।</p>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-b dark:border-gray-700 text-sm">
                      <th className="p-4">#</th>
                      <th className="p-4">নাম</th>
                      <th className="p-4">রোল</th>
                      <th className="p-4">মোবাইল নাম্বার</th>
                      <th className="p-4">নিবন্ধনের তারিখ</th>
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
                          {s.createdAt ? new Date(s.createdAt).toLocaleDateString('bn-BD') : '-'}
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
