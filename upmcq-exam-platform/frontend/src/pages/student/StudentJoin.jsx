import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchExamByCode, clearCurrentExam } from '../../features/exam/examSlice';
import { startAttempt } from '../../features/attempt/attemptSlice';
import { useLanguage } from '../../context/LanguageContext';

const StudentJoin = () => {
  const { t } = useLanguage();
  const { code } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentExam, loading: examLoading, error: examError } = useSelector((state) => state.exam);
  const { user } = useSelector((state) => state.auth);

  const [studentName, setStudentName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (code) {
      dispatch(clearCurrentExam());
      dispatch(fetchExamByCode(code));
    }
  }, [dispatch, code]);

  useEffect(() => {
    if (user && user.role === 'student') {
      setStudentName(user.name || '');
      setRollNumber(user.rollNumber || user.roll || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleStartExam = async (e) => {
    if (e) e.preventDefault();

    const targetExamId =
      currentExam?._id ||
      currentExam?.id ||
      currentExam?.examId ||
      currentExam?.exam?._id ||
      currentExam?.examCode ||
      code;

    if (!targetExamId) {
      alert(t('join.noExamInfo'));
      return;
    }

    const nameToUse = user ? user.name : studentName;
    const rollToUse = user ? (user.rollNumber || user.roll || user.studentRoll || '101') : rollNumber;
    const phoneToUse = user ? (user.phone || '') : phone;

    if (!nameToUse?.trim() || (!user && !rollToUse?.trim())) {
      alert(t('join.requiredInfo'));
      return;
    }

    if (currentExam?.requiresAccessCode && !accessCode.trim()) {
      alert(t('join.accessCodeRequired'));
      return;
    }

    try {
      setSubmitting(true);
      const result = await dispatch(
        startAttempt({
          examId: targetExamId,
          examCode: code,
          studentName: nameToUse,
          rollNumber: rollToUse,
          studentRoll: rollToUse, // ব্যাকএন্ডের চাহিদা অনুযায়ী studentRoll যুক্ত করা হলো
          phone: phoneToUse,
          studentId: user ? user._id || user.id : null,
          accessCode: accessCode.trim(),
        })
      ).unwrap();

      const attemptId = result.attemptId || result._id || result.id || result.attempt?._id || result.attempt?.id;

      if (attemptId) {
        navigate(`/exam/live`, { state: { attemptId } });
      } else {
        alert(t('join.cannotStart'));
      }
    } catch (err) {
      console.error('Failed to start exam:', err);
      alert(typeof err === 'string' ? err : t('join.startProblem'));
    } finally {
      setSubmitting(false);
    }
  };

  if (examLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 text-center">
        <div>
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          <p className="text-gray-500 dark:text-gray-400">{t('join.loadingInfo')}</p>
        </div>
      </div>
    );
  }
  if (examError) {
    return <div className="p-8 text-center text-red-500">{examError}</div>;
  }

  const examDuration =
    currentExam?.settings?.totalTimeMinutes ||
    currentExam?.totalTimeMinutes ||
    currentExam?.duration ||
    20;

  const accessCodeField = currentExam?.requiresAccessCode ? (
    <div>
      <label className="mb-1 block text-sm font-medium dark:text-gray-200">
        {t('join.accessCode')} <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        required
        value={accessCode}
        onChange={(e) => setAccessCode(e.target.value)}
        placeholder={t('join.accessCodePlaceholder')}
        autoComplete="off"
        className="input"
      />
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('join.accessCodeHint')}</p>
    </div>
  ) : null;

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-10">
      <div className="card w-full max-w-md p-6">
        <h1 className="mb-2 text-center text-2xl font-bold dark:text-white">{currentExam?.title || 'Exam'}</h1>
        {currentExam?.teacherName && (
          <p className="mb-1 text-center text-sm font-medium text-primary-600 dark:text-primary-400">
            👨‍🏫 {t('join.by', { name: currentExam.teacherName })}
          </p>
        )}
        <p className="mb-6 text-center text-gray-500 dark:text-gray-400">{t('join.time', { n: examDuration })}</p>

        {user && user.role === 'student' ? (
          <div className="space-y-4 text-center">
            <div className="space-y-1 rounded-xl border border-gray-100 bg-gray-50 p-4 text-left text-sm dark:border-white/5 dark:bg-white/5">
              <p><span className="text-gray-500 dark:text-gray-400">{t('join.examinee')}</span> <strong className="dark:text-white">{user.name}</strong></p>
              <p><span className="text-gray-500 dark:text-gray-400">{t('join.rollNumber')}</span> <strong className="dark:text-white">{user.rollNumber || user.roll || 'N/A'}</strong></p>
              {user.email && <p><span className="text-gray-500 dark:text-gray-400">{t('join.email')}</span> <strong className="dark:text-white">{user.email}</strong></p>}
            </div>

            {accessCodeField && <div className="text-left">{accessCodeField}</div>}

            <button onClick={handleStartExam} disabled={submitting} className="btn-primary w-full">
              {submitting ? t('join.starting') : t('join.start')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleStartExam} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium dark:text-gray-200">
                {t('join.yourName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder={t('join.namePlaceholder')}
                className="input"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium dark:text-gray-200">
                {t('join.rollLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder={t('join.rollPlaceholder')}
                className="input"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium dark:text-gray-200">{t('join.phoneOptional')}</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017xxxxxxxx"
                className="input"
              />
            </div>
            {accessCodeField}
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? t('join.starting') : t('join.start')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default StudentJoin;
