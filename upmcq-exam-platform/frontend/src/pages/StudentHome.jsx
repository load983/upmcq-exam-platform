import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function StudentHome() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // ব্যাকএন্ডের মূল URL (Environment Variable না থাকলে ডিফল্ট Vercel ব্যাকএন্ড URL কাজ করবে)
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://upmcq-exam-platform.vercel.app';

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/exams/public-list`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        setExams(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching exams:', err);
        setExams([]);
        setLoading(false);
      });
  }, [API_BASE_URL]);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="text-center my-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-blue-400">
            🎓 অনলাইন পরীক্ষা পোর্টাল
          </h1>
          <p className="text-slate-400">
            চলতি পরীক্ষাগুলোর তালিকা নিচে দেওয়া হলো। সরাসরি অংশগ্রহণ করতে "পরীক্ষা দাও" বাটনে ক্লিক করো।
          </p>
        </header>

        {loading ? (
          <div className="text-center py-12 text-slate-400">পরীক্ষার তালিকা লোড হচ্ছে...</div>
        ) : exams.length === 0 ? (
          <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700 text-slate-300">
            বর্তমানে কোনো পরীক্ষা চালু নেই।
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {exams.map((exam) => (
              <div
                key={exam._id}
                className="bg-slate-800 border border-slate-700 p-5 rounded-xl shadow-lg flex flex-col justify-between hover:border-blue-500 transition-colors"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-100 mb-2">{exam.title}</h2>
                  <p className="text-sm text-slate-400 mb-4">
                    ⏱️ সময়: {exam.settings?.totalTimeMinutes ? `${exam.settings.totalTimeMinutes} মিনিট` : 'নির্দিষ্ট সময়সীমা নেই'}
                  </p>
                </div>

                <Link
                  to={`/join/${exam.examCode}`}
                  className="block text-center w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
                >
                  পরীক্ষা দাও 🚀
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
