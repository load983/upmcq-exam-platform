// ================== pages/teacher/ResultDashboard.jsx ==================
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchExamResults, fetchExamById } from '../../features/exam/examSlice';
import axiosClient from '../../api/axiosClient';

export default function ResultDashboard() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { results, currentExam, resultsDisabledMessage } = useSelector((s) => s.exam);

  useEffect(() => {
    dispatch(fetchExamById(id));
    dispatch(fetchExamResults(id));
  }, [dispatch, id]);

  const handleExport = async () => {
    const res = await axiosClient.get(`/exams/${id}/results/export`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentExam?.title || 'results'}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (resultsDisabledMessage) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold dark:text-white mb-6">রেজাল্ট ড্যাশবোর্ড — {currentExam?.title}</h1>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow text-center text-gray-500 dark:text-gray-400">
          {resultsDisabledMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">রেজাল্ট ড্যাশবোর্ড — {currentExam?.title}</h1>
        <button onClick={handleExport} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium">
          📊 Excel এ Export করো
        </button>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-2xl shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700 dark:text-white">
            <tr>
              <th className="p-3 text-left">নাম</th>
              <th className="p-3 text-left">রোল</th>
              <th className="p-3 text-left">IP</th>
              <th className="p-3 text-center">সঠিক</th>
              <th className="p-3 text-center">ভুল</th>
              <th className="p-3 text-center">স্কিপ</th>
              <th className="p-3 text-center">নম্বর</th>
              <th className="p-3 text-center">স্ট্যাটাস</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r._id} className="border-t dark:border-gray-700 dark:text-gray-200">
                <td className="p-3">{r.studentName}</td>
                <td className="p-3">{r.studentRoll}</td>
                <td className="p-3">{r.ipAddress}</td>
                <td className="p-3 text-center text-green-600">{r.totalCorrect}</td>
                <td className="p-3 text-center text-red-600">{r.totalWrong}</td>
                <td className="p-3 text-center text-gray-500">{r.totalSkipped}</td>
                <td className="p-3 text-center font-semibold">{r.obtainedMarks}</td>
                <td className="p-3 text-center">
                  {r.status === 'submitted' ? (r.autoSubmitted ? 'Auto-Submit' : 'জমা হয়েছে') : 'চলমান'}
                </td>
              </tr>
            ))}
            {results.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-center text-gray-400">এখনো কেউ পরীক্ষা দেয়নি</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
