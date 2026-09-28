// ================== pages/teacher/CreateMcqExam.jsx ==================
// শিক্ষক এখানে নিজে টাইপ করে অনলাইনে MCQ প্রশ্ন তৈরি করতে পারেন এবং পরীক্ষা তৈরি করার পর
// আগের মতোই (PDF আপলোডের মতো) সেটিংস ঠিক করে পাবলিশ করতে পারবেন।
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createExam } from '../../features/exam/examSlice';
import { useLanguage } from '../../context/LanguageContext';
import ClassSelect from '../../components/ClassSelect';

const emptyQuestion = () => ({
  key: Math.random().toString(36).slice(2),
  questionText: '',
  options: ['', ''],
  correctOptionIndex: 0,
  explanation: '',
});

export default function CreateMcqExam() {
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((s) => s.exam);

  const [title, setTitle] = useState('');
  const [classIds, setClassIds] = useState([]);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const updateQuestion = (key, patch) => {
    setQuestions((qs) => qs.map((q) => (q.key === key ? { ...q, ...patch } : q)));
  };

  const updateOption = (key, idx, value) => {
    setQuestions((qs) =>
      qs.map((q) => {
        if (q.key !== key) return q;
        const options = [...q.options];
        options[idx] = value;
        return { ...q, options };
      })
    );
  };

  const addOption = (key) => {
    setQuestions((qs) =>
      qs.map((q) => (q.key === key && q.options.length < 8 ? { ...q, options: [...q.options, ''] } : q))
    );
  };

  const removeOption = (key, idx) => {
    setQuestions((qs) =>
      qs.map((q) => {
        if (q.key !== key || q.options.length <= 2) return q;
        const options = q.options.filter((_, i) => i !== idx);
        let correctOptionIndex = q.correctOptionIndex;
        if (correctOptionIndex === idx) correctOptionIndex = 0;
        else if (correctOptionIndex > idx) correctOptionIndex -= 1;
        return { ...q, options, correctOptionIndex };
      })
    );
  };

  const addQuestionRow = () => setQuestions((qs) => [...qs, emptyQuestion()]);

  const removeQuestionRow = (key) => {
    setQuestions((qs) => (qs.length > 1 ? qs.filter((q) => q.key !== key) : qs));
  };

  const validate = () => {
    if (!title.trim()) return t('createMcq.needTitle');
    if (classIds.length === 0) return t('classes.required');
    if (questions.length === 0) return t('createMcq.needQuestion');

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) return t('createMcq.needQuestionText', { n: i + 1 });
      const filled = q.options.filter((o) => o.trim());
      if (filled.length < 2) return t('createMcq.needTwoOptions', { n: i + 1 });
      if (!q.options[q.correctOptionIndex] || !q.options[q.correctOptionIndex].trim()) {
        return t('createMcq.needCorrectAnswer', { n: i + 1 });
      }
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setLocalError('');
    setLoading(true);

    const payload = {
      title: title.trim(),
      classIds,
      questions: questions.map((q) => ({
        questionText: q.questionText.trim(),
        options: q.options.map((o) => o.trim()),
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation.trim() || undefined,
      })),
    };

    const result = await dispatch(createExam(payload));
    setLoading(false);
    if (createExam.fulfilled.match(result)) {
      const exam = result.payload.exam || result.payload;
      navigate(`/teacher/exam/${exam._id}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h2 className="text-xl font-bold mb-2 dark:text-white">{t('createMcq.title')}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('createMcq.subtitle')}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-4">
          <input
            placeholder={t('createMcq.titlePlaceholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
          />
          <ClassSelect value={classIds} onChange={setClassIds} />
        </div>

        <div className="space-y-5">
          {questions.map((q, index) => (
            <div key={q.key} className="card p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold dark:text-white">
                  {t('createMcq.questionLabel', { n: index + 1 })}
                </h3>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestionRow(q.key)}
                    className="text-red-600 text-sm font-medium hover:text-red-700"
                  >
                    {t('common.delete')}
                  </button>
                )}
              </div>

              <textarea
                placeholder={t('createMcq.questionPlaceholder')}
                value={q.questionText}
                onChange={(e) => updateQuestion(q.key, { questionText: e.target.value })}
                rows={2}
                className="input resize-none"
              />

              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${q.key}`}
                      checked={q.correctOptionIndex === i}
                      onChange={() => updateQuestion(q.key, { correctOptionIndex: i })}
                      title={t('createMcq.markCorrect')}
                    />
                    <span className="w-6 text-sm text-gray-500 dark:text-gray-400 shrink-0">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <input
                      placeholder={t('createMcq.optionPlaceholder', { letter: String.fromCharCode(65 + i) })}
                      value={opt}
                      onChange={(e) => updateOption(q.key, i, e.target.value)}
                      className="input"
                    />
                    {q.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(q.key, i)}
                        className="text-red-500 text-sm px-1 shrink-0"
                        title={t('common.delete')}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {q.options.length < 8 && (
                  <button
                    type="button"
                    onClick={() => addOption(q.key)}
                    className="text-primary-600 text-sm font-medium hover:underline"
                  >
                    {t('createMcq.addOption')}
                  </button>
                )}
              </div>

              <input
                placeholder={t('createMcq.explanationPlaceholder')}
                value={q.explanation}
                onChange={(e) => updateQuestion(q.key, { explanation: e.target.value })}
                className="input"
              />
            </div>
          ))}
        </div>

        <button type="button" onClick={addQuestionRow} className="btn-secondary w-full">
          {t('createMcq.addQuestion')}
        </button>

        {(localError || error) && <p className="text-red-600 text-sm">{localError || error}</p>}

        <button disabled={loading} className="btn-primary w-full">
          {loading ? t('createMcq.creating') : t('createMcq.submit')}
        </button>
      </form>
    </div>
  );
}
