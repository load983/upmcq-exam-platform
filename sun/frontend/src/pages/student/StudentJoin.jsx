import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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

  const [accessCode, setAccessCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (code) {
      dispatch(clearCurrentExam());
      dispatch(fetchExamByCode(code));
    }
  }, [dispatch, code]);

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
      <div className="card w-full max-w-md p-6 shadow-glow sm:p-8">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary-50 text-2xl dark:bg-primary-500/10" aria-hidden="true">📝</div>
        <h1 className="mb-2 text-center text-2xl font-semibold tracking-tight dark:text-white">{currentExam?.title || 'Exam'}</h1>
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

            <button onClick={handleStartExam} disabled={submitting} className="btn-primary w-full !py-3 text-base">
              {submitting ? t('join.starting') : t('join.start')}
            </button>
          </div>
        ) : (
          // 🔒 লগইন বাধ্যতামূলক — লগইনের পর এই পরীক্ষার পেজেই ফিরে আসবে
          <div className="space-y-4 text-center">
            <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{t('join.loginRequiredDesc')}</p>
            <Link to="/student/auth" state={{ from: `/join/${code}` }} className="btn-primary block w-full">
              {t('join.loginRequiredCta')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentJoin;
