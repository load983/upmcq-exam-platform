// ================== pages/student/Leaderboard.jsx ==================
// নির্দিষ্ট পরীক্ষার লিডারবোর্ড — নাম, রোল ও তম দেখায়।
// শিক্ষক পরীক্ষার সেটিংসে লিডারবোর্ড অন করলে তবেই এটি কাজ করে।
import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useLanguage } from '../../context/LanguageContext';

export default function Leaderboard() {
  const { t, lang } = useLanguage();
  const { examId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [off, setOff] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axiosClient
      .get(`/attempts/leaderboard/${examId}`)
      .then(({ data }) => setData(data))
      .catch((err) => {
        if (err.response?.data?.disabled) setOff(true);
        else setError(err.response?.data?.message || t('leaderboard.loadFailed'));
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  const num = (n) => (lang === 'bn' ? Number(n).toLocaleString('bn-BD', { useGrouping: false }) : n);
  const medal = (r) => (r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : null);

  return (
    <div className="px-4 py-10 md:py-14">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 text-center">
          <h1 className="mb-2 flex items-center justify-center gap-2 text-3xl font-extrabold md:text-4xl">
            <span>🏆</span> <span className="gradient-text">{t('leaderboard.title')}</span>
          </h1>
          {data?.examTitle && <p className="text-gray-500 dark:text-gray-400">{data.examTitle}</p>}
        </header>

        {loading ? (
          <p className="py-16 text-center text-gray-400 dark:text-gray-500">{t('common.loading')}</p>
        ) : off ? (
          <div className="card p-8 text-center text-gray-500 dark:text-gray-400">🔒 {t('leaderboard.off')}</div>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : !data || data.entries.length === 0 ? (
          <div className="card p-8 text-center text-gray-500 dark:text-gray-400">{t('leaderboard.empty')}</div>
        ) : (
          <>
            {data.myRank && (
              <p className="mb-4 rounded-xl bg-primary-50 p-3 text-center text-sm font-semibold text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">
                {t('leaderboard.myRank', { rank: num(data.myRank), total: num(data.total) })}
              </p>
            )}

            <div className="card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-white/5 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3 w-20">{t('leaderboard.colRank')}</th>
                    <th className="px-4 py-3">{t('leaderboard.colName')}</th>
                    <th className="px-4 py-3">{t('leaderboard.colRoll')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map((e) => (
                    <tr
                      key={`${e.rank}-${e.roll}`}
                      className={`border-t border-gray-100 dark:border-white/10 dark:text-gray-100 ${
                        e.isMe ? 'bg-primary-50 font-semibold dark:bg-primary-500/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-bold">
                        {medal(e.rank) || ''} {num(e.rank)}
                      </td>
                      <td className="px-4 py-3">
                        {e.name}
                        {e.isMe && (
                          <span className="badge ml-2 bg-primary-600 text-white">{t('leaderboard.you')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{e.roll}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="mt-6 text-center">
          <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:underline dark:text-gray-400">
            {t('leaderboard.back')}
          </button>
          {' · '}
          <Link to="/exams/past" className="text-sm text-primary-600 hover:underline">{t('pastExams.title')}</Link>
        </div>
      </div>
    </div>
  );
}
