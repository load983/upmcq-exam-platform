// ================== pages/teacher/ExamEditor.jsx ==================
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchExamById, updateExamSettings, publishExam, deleteQuestion, updateQuestion,
  setResourceLink, uploadResourcePdf, removeResource,
} from '../../features/exam/examSlice';
import { useLanguage } from '../../context/LanguageContext';
import PdfDropzone from '../../components/PdfDropzone';

export default function ExamEditor() {
  const { t } = useLanguage();
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentExam, questions, shareLink } = useSelector((s) => s.exam);
  const [settings, setSettings] = useState(null);
  const [accessCode, setAccessCode] = useState('');
  const [editingQ, setEditingQ] = useState(null);
  const [resourceLinkInput, setResourceLinkInput] = useState('');
  const [resourcePdfFile, setResourcePdfFile] = useState(null);

  useEffect(() => { dispatch(fetchExamById(id)); }, [dispatch, id]);

  useEffect(() => {
    if (currentExam) {
      setSettings(currentExam.settings);
      setAccessCode(currentExam.accessCode || '');
      setResourceLinkInput(currentExam.resource?.kind === 'link'? currentExam.resource.link : '');
    }
  }, [currentExam]);

  if (!currentExam ||!settings) return <p className="text-center mt-10 dark:text-white">{t('common.loading')}</p>;

  const saveSettings = () => {
    dispatch(updateExamSettings({ id, payload: { title: currentExam.title, settings, accessCode } }));
  };

  const handlePublish = async () => {
    await saveSettings();
    dispatch(publishExam(id));
  };

  const handleSaveLink = () => {
    if (!resourceLinkInput.trim()) return;
    dispatch(setResourceLink({ id, link: resourceLinkInput.trim() }));
  };

  const handleUploadPdf = () => {
    if (!resourcePdfFile) return;
    const formData = new FormData();
    formData.append('pdf', resourcePdfFile);
    dispatch(uploadResourcePdf({ id, formData }));
    setResourcePdfFile(null);
  };

  const handleRemoveResource = () => {
    dispatch(removeResource(id));
    setResourceLinkInput('');
    setResourcePdfFile(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold dark:text-white">{currentExam.title}</h1>

      {/* ---------- Exam Settings ---------- */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-lg dark:text-white">{t('editor.settingsTitle')}</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t('editor.totalTime')}>
            <input type="number" min={1} value={settings.totalTimeMinutes}
              onChange={(e) => setSettings({...settings, totalTimeMinutes: +e.target.value })}
              className="input" />
          </Field>
          <Field label={t('editor.marksPerQuestion')}>
            <input type="number" step="0.25" value={settings.marksPerQuestion}
              onChange={(e) => setSettings({...settings, marksPerQuestion: +e.target.value })}
              className="input" />
          </Field>
          <Field label={t('editor.totalQuestionsToUse', { n: questions.length })}>
            <input type="number" min={0} max={questions.length} value={settings.totalQuestionsToUse}
              onChange={(e) => setSettings({...settings, totalQuestionsToUse: +e.target.value })}
              className="input" />
          </Field>
          <Field label={t('editor.accessCode')}>
            <input value={accessCode} onChange={(e) => setAccessCode(e.target.value)} className="input" placeholder={t('editor.accessCodePlaceholder')} />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Toggle label={t('editor.negativeMarking')} checked={settings.negativeMarking.enabled}
            onChange={(v) => setSettings({...settings, negativeMarking: {...settings.negativeMarking, enabled: v } })} />
          {settings.negativeMarking.enabled && (
            <Field label={t('editor.marksPerWrong')}>
              <input type="number" step="0.05" value={settings.negativeMarking.marksPerWrong}
                onChange={(e) => setSettings({...settings, negativeMarking: {...settings.negativeMarking, marksPerWrong: +e.target.value } })}
                className="input" />
            </Field>
          )}
          <Toggle label={t('editor.shuffleQuestions')} checked={settings.shuffleQuestions}
            onChange={(v) => setSettings({...settings, shuffleQuestions: v })} />
          <Toggle label={t('editor.shuffleOptions')} checked={settings.shuffleOptions}
            onChange={(v) => setSettings({...settings, shuffleOptions: v })} />
          <Toggle label={t('editor.showResultInstantly')} checked={settings.showResultInstantly}
            onChange={(v) => setSettings({...settings, showResultInstantly: v })} />
          <Toggle label={t('editor.allowRepetition')} checked={settings.allowRepetition}
            onChange={(v) => setSettings({...settings, allowRepetition: v })} />
        </div>

        {/* --- Repetition Warning - স্ক্রিনশট অনুযায়ী --- */}
        {settings.allowRepetition && (
          <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
            {t('editor.repetitionWarning')}
          </p>
        )}

        <Toggle label={t('editor.enableSchedule')} checked={settings.schedule.enabled}
          onChange={(v) => setSettings({...settings, schedule: {...settings.schedule, enabled: v } })} />

        {settings.schedule.enabled && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t('editor.startAt')}>
              <input type="datetime-local" value={settings.schedule.startAt || ''} onChange={(e) => setSettings({...settings, schedule: {...settings.schedule, startAt: e.target.value } })} className="input" />
            </Field>
            <Field label={t('editor.endAt')}>
              <input type="datetime-local" value={settings.schedule.endAt || ''} onChange={(e) => setSettings({...settings, schedule: {...settings.schedule, endAt: e.target.value } })} className="input" />
            </Field>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={saveSettings} className="btn-secondary">
            {t('editor.saveSettings')}
          </button>
          <button onClick={handlePublish} className="btn-primary">
            {t('editor.publish')}
          </button>
        </div>

        {(shareLink || currentExam.status === 'published') && (
          <div className="rounded-lg bg-primary-50 p-3 text-sm dark:bg-primary-500/10 break-all dark:text-white">
            {t('editor.shareLink')} <strong>{shareLink || `${window.location.origin}/join/${currentExam.examCode}`}</strong>
          </div>
        )}
      </div>

      {/* ---------- রিসোর্স ---------- */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-lg dark:text-white">{t('editor.resourceTitle')}</h2>
        {currentExam.resource?.kind && (
          <div className="rounded-lg bg-primary-50 p-3 text-sm dark:bg-primary-500/10 dark:text-white flex justify-between items-center">
            <span>{currentExam.resource.kind === 'link'? t('editor.resourceLinkValue', { value: currentExam.resource.link }) : t('editor.resourcePdfValue', { value: currentExam.resource.pdfOriginalName })}</span>
            <button onClick={handleRemoveResource} className="text-red-600 font-medium ml-3">{t('editor.remove')}</button>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t('editor.driveLink')}>
            <div className="flex gap-2">
              <input value={resourceLinkInput} onChange={(e) => setResourceLinkInput(e.target.value)} className="input" placeholder="https://drive.google.com/..." />
              <button onClick={handleSaveLink} className="rounded-lg bg-primary-600 px-3 text-sm text-white hover:bg-primary-700">{t('common.save')}</button>
            </div>
          </Field>
          <Field label={t('editor.orUploadPdf')}>
            <div className="space-y-2">
              <PdfDropzone compact file={resourcePdfFile} onFile={setResourcePdfFile} />
              <button onClick={handleUploadPdf} disabled={!resourcePdfFile} className="w-full rounded-lg bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50">{t('editor.upload')}</button>
            </div>
          </Field>
        </div>
      </div>

      {/* ---------- প্রশ্ন তালিকা ---------- */}
      <div className="card p-6">
        <h2 className="font-semibold text-lg mb-4 dark:text-white">{t('editor.questionsTitle', { n: questions.length })}</h2>
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <QuestionRow key={q._id} index={idx} question={q} isEditing={editingQ === q._id} onEditToggle={() => setEditingQ(editingQ === q._id? null : q._id)} onSave={(payload) => { dispatch(updateQuestion({ questionId: q._id, payload })); setEditingQ(null); }} onDelete={() => dispatch(deleteQuestion(q._id))} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) { return (<label className="block text-sm"><span className="block mb-1 text-gray-600 dark:text-gray-300">{label}</span>{children}</label>); }
function Toggle({ label, checked, onChange }) { return (<label className="flex items-center gap-2 text-sm dark:text-gray-200"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />{label}</label>); }
function QuestionRow({ index, question, isEditing, onEditToggle, onSave, onDelete }) {
  const [text, setText] = useState(question.questionText);
  const [options, setOptions] = useState(question.options);
  const [correctIdx, setCorrectIdx] = useState(question.correctOptionIndex);
  const { t } = useLanguage();
  if (!isEditing) {
    return (<div className="border dark:border-gray-700 rounded-lg p-3 flex justify-between items-start"><div><p className="font-medium dark:text-white">{index + 1}. {question.questionText}</p><ul className="text-sm text-gray-500 dark:text-gray-400 mt-1">{question.options.map((opt, i) => (<li key={i} className={i === question.correctOptionIndex? 'text-green-600 font-semibold' : ''}>{String.fromCharCode(65 + i)}. {opt} {i === question.correctOptionIndex && '✓'}</li>))}</ul></div><div className="flex gap-2 text-sm shrink-0"><button onClick={onEditToggle} className="text-primary-600">{t('common.edit')}</button><button onClick={onDelete} className="text-red-600">{t('common.delete')}</button></div></div>);
  }
  return (<div className="border dark:border-gray-700 rounded-lg p-3 space-y-2 bg-primary-50 dark:bg-gray-700"><input value={text} onChange={(e) => setText(e.target.value)} className="input" />{options.map((opt, i) => (<div key={i} className="flex items-center gap-2"><input type="radio" checked={correctIdx === i} onChange={() => setCorrectIdx(i)} /><input value={opt} onChange={(e) => { const n = [...options]; n[i] = e.target.value; setOptions(n); }} className="input" /></div>))}<div className="flex gap-2"><button onClick={() => onSave({ questionText: text, options, correctOptionIndex: correctIdx })} className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm">{t('common.save')}</button><button onClick={onEditToggle} className="text-sm text-gray-500">{t('common.cancel')}</button></div></div>);
}
