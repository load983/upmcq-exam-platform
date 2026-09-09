import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function StudentHome() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    axiosClient
      .get('/exams/public-list')
      .then(({ data }) => {
        setExams(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching exams:', err);
        setExams([]);
        setLoading(false);
      });
  }, []);

  // সার্চ কোয়েরি অনুযায়ী ফিল্টার করা
  const filteredExams = exams.filter((exam) =>
    exam.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="text-center my-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-blue-400">
            🎓 অনলাইন পরীক্ষা পোর্টাল
          </h1>
          <p className="text-slate-400 mb-6">
            চলতি পরীক্ষাগুলোর তালিকা নিচে দেওয়া হলো। সরাসরি অংশগ্রহণ করতে "পরীক্ষা দাও" বাটনে ক্লিক করো।
          </p>

          {/* সার্চ বার */}
          <div className="max-w-md mx-auto relative">
            <input
              type="text"
              placeholder="🔍 পরীক্ষার নাম দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:border-blue-500 shadow-md text-sm transition-all"
            />
            <svg
              className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400"
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
          </div>
        </header>

        {loading ? (
          <div className="text-center py-12 text-slate-400">পরীক্ষার তালিকা লোড হচ্ছে...</div>
        ) : filteredExams.length === 0 ? (
          <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700 text-slate-300">
            {searchQuery ? `"${searchQuery}" নামে কোনো পরীক্ষা পাওয়া যায়নি।` : 'বর্তমানে কোনো পরীক্ষা চালু নেই।'}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredExams.map((exam) => (
              <div
                key={exam._id}
                className="bg-slate-800 border border-slate-700 p-5 rounded-xl shadow-lg flex flex-col justify-between hover:border-blue-500 transition-colors"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-100 mb-3">{exam.title}</h2>
                  
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-5 bg-slate-900/50 p-2.5 rounded-lg border border-slate-700/50">
                    <span>
                      ⏱️ সময়: {exam.settings?.totalTimeMinutes ? `${exam.settings.totalTimeMinutes} মিনিট` : 'নির্দিষ্ট সময়সীমা নেই'}
                    </span>
                    <span className="bg-blue-900/40 text-blue-300 border border-blue-800/50 px-2.5 py-1 rounded-md font-medium">
                      👥 পরীক্ষা দিয়েছে: {exam.attemptCount ?? 0} জন
                    </span>
                  </div>
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
