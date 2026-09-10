import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchExamByCode } from '../../features/exam/examSlice';
import { startAttempt } from '../../features/attempt/attemptSlice';

const StudentJoin = () => {
  const { examCode } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentExam, loading: examLoading, error: examError } = useSelector((state) => state.exam);
  const { user } = useSelector((state) => state.auth);

  const [studentName, setStudentName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (examCode) {
      dispatch(fetchExamByCode(examCode));
    }
  }, [dispatch, examCode]);

  useEffect(() => {
    if (user && user.role === 'student') {
      setStudentName(user.name || '');
      setRollNumber(user.rollNumber || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleStartExam = async (e) => {
    if (e) e.preventDefault();

    if (!currentExam?._id) {
      alert('পরীক্ষার তথ্য পাওয়া যায়নি। অনুগ্রহ করে পেজ রিফ্রেশ করুন।');
      return;
    }

    const nameToUse = user ? user.name : studentName;
    const rollToUse = user ? (user.rollNumber || 'N/A') : rollNumber;
    const phoneToUse = user ? (user.phone || '') : phone;

    if (!nameToUse || (!user && !rollToUse)) {
      alert('অনুগ্রহ করে প্রয়োজনীয় তথ্য দিন।');
      return;
    }

    try {
      setSubmitting(true);
      const result = await dispatch(
        startAttempt({
          examId: currentExam._id,
          studentName: nameToUse,
          rollNumber: rollToUse,
          phone: phoneToUse,
          studentId: user ? user._id : null,
        })
      ).unwrap();

      // backend data format অনুযায়ী attemptId বা _id নিরাপদভাবে গ্রহণ
      const attemptId = result.attemptId || result._id || result.attempt?._id;
      
      if (attemptId) {
        navigate(`/student/exam/${attemptId}`);
      } else {
        alert('পরীক্ষা শুরু করা সম্ভব হয়নি। আবার চেষ্টা করুন।');
      }
    } catch (err) {
      console.error('Failed to start exam:', err);
      alert(typeof err === 'string' ? err : 'পরীক্ষা শুরু করতে সমস্যা হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  if (examLoading) return <div className="p-8 text-center text-white">Loading exam...</div>;
  if (examError) return <div className="p-8 text-center text-red-500">{examError}</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
        <h1 className="text-2xl font-bold text-center mb-2">{currentExam?.title || 'Exam'}</h1>
        <p className="text-center text-slate-400 mb-6">সময়: {currentExam?.duration} মিনিট</p>

        {user && user.role === 'student' ? (
          <div className="text-center space-y-4">
            <div className="bg-slate-700/50 p-4 rounded-lg text-left text-sm space-y-1 border border-slate-600">
              <p><span className="text-slate-400">পরীক্ষার্থী:</span> <strong className="text-white">{user.name}</strong></p>
              {user.rollNumber && <p><span className="text-slate-400">রোল নম্বর:</span> <strong className="text-white">{user.rollNumber}</strong></p>}
              {user.email && <p><span className="text-slate-400">ইমেইল:</span> <strong className="text-white">{user.email}</strong></p>}
            </div>

            <button
              onClick={handleStartExam}
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-medium py-2.5 rounded-lg transition"
            >
              {submitting ? 'শুরু হচ্ছে...' : 'পরীক্ষা শুরু করো'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleStartExam} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">তোমার নাম <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="উদাহরণ: রাকিব হাসান"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">রোল নম্বর <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="উদাহরণ: 101"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ফোন নম্বর (ঐচ্ছিক)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017xxxxxxxx"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-medium py-2.5 rounded-lg transition"
            >
              {submitting ? 'শুরু হচ্ছে...' : 'পরীক্ষা শুরু করো'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default StudentJoin;
