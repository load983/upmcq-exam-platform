// ================== pages/teacher/ResultDashboard.jsx ==================
import { Avatar } from '../admin/adminUi';
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchExamResults, fetchExamById } from '../../features/exam/examSlice';
import axiosClient from '../../api/axiosClient';
import { useLanguage } from '../../context/LanguageContext';
import useTeacherFeatures from '../../hooks/useTeacherFeatures';

export default function ResultDashboard() {
  const { t } = useLanguage();
  const { has, warnLocked } = useTeacherFeatures();
  const { id } = useParams();
  const dispatch = useDispatch();
  const { results, currentExam, resultsDisabledMessage } = useSelector((s) => s.exam);

  useEffect(() => {
    dispatch(fetchExamById(id));
    dispatch(fetchExamResults(id));
  }, [dispatch, id]);

  const handleExport = async () => {
    if (!has('exportResults')) return warnLocked('exportResults');
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
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight dark:text-white sm:text-3xl mb-6">{t('resultDash.title')} — {currentExam?.title}</h1>
        <div className="card p-8 text-center text-gray-500 dark:text-gray-400">
          {resultsDisabledMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold tracking-tight dark:text-white sm:text-3xl">{t('resultDash.title')} — {currentExam?.title}</h1>
        <button onClick={handleExport} className={`btn-primary ${has('exportResults') ? '' : 'opacity-60'}`}>
          {has('exportResults') ? '' : '🔒 '}{t('resultDash.export')}
        </button>
      </div>

      {(() => {
        const done = results.filter((r) => r.status === 'submitted');
        const marks = done.map((r) => Number(r.obtainedMarks) || 0);
        const avg = marks.length ? (marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(1) : '-';
        const top = marks.length ? Math.max(...marks) : '-';
        return (
          <div className="mb-5 grid grid-cols-3 gap-3">
            {[[t('r.stat.count'), results.length], [t('r.stat.avg'), avg], [t('r.stat.top'), top]].map(([l, v]) => (
              <div key={l} className="card px-4 py-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">{l}</div>
                <div className="text-2xl font-semibold tabular-nums text-primary-700 dark:text-primary-300">{v}</div>
              </div>
            ))}
          </div>
        );
      })()}

      <div className="card overflow-x-auto !p-1">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="text-left">{t('resultDash.colName')}</th>
              <th className="text-left">{t('resultDash.colRoll')}</th>
              <th className="text-left">IP</th>
              <th className="text-center">{t('resultDash.colCorrect')}</th>
              <th className="text-center">{t('resultDash.colWrong')}</th>
              <th className="text-center">{t('resultDash.colSkipped')}</th>
              <th className="text-center">{t('resultDash.colMarks')}</th>
              <th className="text-center">{t('resultDash.colStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r._id} className="dark:text-gray-200">
                <td><div className="flex items-center gap-3"><Avatar name={r.studentName} /><span className="font-medium">{r.studentName}</span></div></td>
                <td>{r.studentRoll}</td>
                <td>{r.ipAddress}</td>
                <td className="text-center text-emerald-600">{r.totalCorrect}</td>
                <td className="text-center text-red-600">{r.totalWrong}</td>
                <td className="text-center text-gray-500">{r.totalSkipped}</td>
                <td className="text-center font-semibold">{r.obtainedMarks}</td>
                <td className="text-center"><span className={`badge ${r.status === 'submitted' ? (r.autoSubmitted ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300') : 'bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300'}`}>{r.status === 'submitted' ? (r.autoSubmitted ? t('resultDash.autoSubmit') : t('resultDash.submitted')) : t('resultDash.ongoing')}</span></td>
              </tr>
            ))}
            {results.length === 0 && (
              <tr><td colSpan={8} className="!py-10 text-center text-gray-400">{t('resultDash.empty')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
