// ================== pages/teacher/ExamEditor.jsx ==================
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchExamById, updateExamSettings, publishExam, deleteQuestion, updateQuestion,
  setResourceLink, uploadResourcePdf, removeResource,
} from '../../features/exam/examSlice';

export default function ExamEditor() {
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

  if (!currentExam ||!settings) return <p className="text-center mt-10 dark:text-white">লোড হচ্ছে...</p>;

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
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow space-y-4">
        <h2 className="font-semibold text-lg dark:text-white">Exam Settings</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Total Time (মিনিট)">
            <input type="number" min={1} value={settings.totalTimeMinutes}
              onChange={(e) => setSettings({...settings, totalTimeMinutes: +e.target.value })}
              className="input" />
          </Field>
          <Field label="প্রতি প্রশ্নের মার্কস">
            <input type="number" step="0.25" value={settings.marksPerQuestion}
              onChange={(e) => setSettings({...settings, marksPerQuestion: +e.target.value })}
              className="input" />
          </Field>
          <Field label={`মোট প্রশ্ন ব্যবহার করবে (এভেইলেবল: ${questions.length}, ০ = সব)`}>
            <input type="number" min={0} max={questions.length} value={settings.totalQuestionsToUse}
              onChange={(e) => setSettings({...settings, totalQuestionsToUse: +e.target.value })}
              className="input" />
          </Field>
          <Field label="Access Code (ঐচ্ছিক)">
            <input value={accessCode} onChange={(e) => setAccessCode(e.target.value)} className="input" placeholder="খালি রাখলে দরকার হবে না" />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Toggle label="Negative Marking" checked={settings.negativeMarking.enabled}
            onChange={(v) => setSettings({...settings, negativeMarking: {...settings.negativeMarking, enabled: v } })} />
          {settings.negativeMarking.enabled && (
            <Field label="প্রতি ভুল উত্তরে কাটা যাবে">
              <input type="number" step="0.05" value={settings.negativeMarking.marksPerWrong}
                onChange={(e) => setSettings({...settings, negativeMarking: {...settings.negativeMarking, marksPerWrong: +e.target.value } })}
                className="input" />
            </Field>
          )}
          <Toggle label="Shuffle Questions" checked={settings.shuffleQuestions}
            onChange={(v) => setSettings({...settings, shuffleQuestions: v })} />
          <Toggle label="Shuffle Options" checked={settings.shuffleOptions}
            onChange={(v) => setSettings({...settings, shuffleOptions: v })} />
          <Toggle label="Show Result Instantly" checked={settings.showResultInstantly}
            onChange={(v) => setSettings({...settings, showResultInstantly: v })} />
          <Toggle label="Repetition (একই স্টুডেন্ট বারবার দিতে পারবে)" checked={settings.allowRepetition}
            onChange={(v) => setSettings({...settings, allowRepetition: v })} />
        </div>

        {/* --- Repetition Warning - স্ক্রিনশট অনুযায়ী --- */}
        {settings.allowRepetition && (
          <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
            ⚠️ Repetition অন থাকায় "রেজাল্ট" ড্যাশবোর্ডে এই পরীক্ষার টেবিল দেখানো হবে না — প্রতিটা স্টুডেন্ট শুধু নিজের রেজাল্ট নিজে দেখতে পাবে।
          </p>
        )}

        <Toggle label="Schedule চালু করো" checked={settings.schedule.enabled}
          onChange={(v) => setSettings({...settings, schedule: {...settings.schedule, enabled: v } })} />

        {settings.schedule.enabled && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="শুরুর সময়">
              <input type="datetime-local" value={settings.schedule.startAt || ''} onChange={(e) => setSettings({...settings, schedule: {...settings.schedule, startAt: e.target.value } })} className="input" />
            </Field>
            <Field label="শেষের সময়">
              <input type="datetime-local" value={settings.schedule.endAt || ''} onChange={(e) => setSettings({...settings, schedule: {...settings.schedule, endAt: e.target.value } })} className="input" />
            </Field>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={saveSettings} className="border border-primary-600 text-primary-600 px-4 py-2 rounded-lg font-medium">
            সেটিংস সেভ করো
          </button>
          <button onClick={handlePublish} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium">
            🚀 Publish করে লিংক তৈরি করো
          </button>
        </div>

        {(shareLink || currentExam.status === 'published') && (
          <div className="bg-primary-50 dark:bg-gray-700 p-3 rounded-lg text-sm break-all dark:text-white">
            শেয়ারযোগ্য লিংক: <strong>{shareLink || `${window.location.origin}/join/${currentExam.examCode}`}</strong>
          </div>
        )}
      </div>

      {/* ---------- রিসোর্স ---------- */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow space-y-4">
        <h2 className="font-semibold text-lg dark:text-white">পরীক্ষা শেষে স্টুডেন্টকে যা দেখাবে (ঐচ্ছিক)</h2>
        {currentExam.resource?.kind && (
          <div className="bg-primary-50 dark:bg-gray-700 p-3 rounded-lg text-sm dark:text-white flex justify-between items-center">
            <span>{currentExam.resource.kind === 'link'? `লিংক: ${currentExam.resource.link}` : `PDF: ${currentExam.resource.pdfOriginalName}`}</span>
            <button onClick={handleRemoveResource} className="text-red-600 font-medium ml-3">সরাও</button>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Google Drive লিংক">
            <div className="flex gap-2">
              <input value={resourceLinkInput} onChange={(e) => setResourceLinkInput(e.target.value)} className="input" placeholder="https://drive.google.com/..." />
              <button onClick={handleSaveLink} className="bg-primary-600 text-white px-3 rounded-lg text-sm">সেভ</button>
            </div>
          </Field>
          <Field label="অথবা PDF আপলোড">
            <div className="flex gap-2">
              <input type="file" accept="application/pdf" onChange={(e) => setResourcePdfFile(e.target.files[0])} className="input" />
              <button onClick={handleUploadPdf} className="bg-primary-600 text-white px-3 rounded-lg text-sm">আপলোড</button>
            </div>
          </Field>
        </div>
      </div>

      {/* ---------- প্রশ্ন তালিকা ---------- */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow">
        <h2 className="font-semibold text-lg mb-4 dark:text-white">প্রশ্নসমূহ ({questions.length})</h2>
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <QuestionRow key={q._id} index={idx} question={q} isEditing={editingQ === q._id} onEditToggle={() => setEditingQ(editingQ === q._id? null : q._id)} onSave={(payload) => { dispatch(updateQuestion({ questionId: q._id, payload })); setEditingQ(null); }} onDelete={() => dispatch(deleteQuestion(q._id))} />
          ))}
        </div>
      </div>
      <style>{`.input{width:100%;border:1px solid #d1d5db;border-radius:0.5rem;padding:0.5rem 0.75rem}.dark.input{background:#374151;color:white;border-color:#4b5563}`}</style>
    </div>
  );
}

function Field({ label, children }) { return (<label className="block text-sm"><span className="block mb-1 text-gray-600 dark:text-gray-300">{label}</span>{children}</label>); }
function Toggle({ label, checked, onChange }) { return (<label className="flex items-center gap-2 text-sm dark:text-gray-200"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />{label}</label>); }
function QuestionRow({ index, question, isEditing, onEditToggle, onSave, onDelete }) {
  const [text, setText] = useState(question.questionText);
  const [options, setOptions] = useState(question.options);
  const [correctIdx, setCorrectIdx] = useState(question.correctOptionIndex);
  if (!isEditing) {
    return (<div className="border dark:border-gray-700 rounded-lg p-3 flex justify-between items-start"><div><p className="font-medium dark:text-white">{index + 1}. {question.questionText}</p><ul className="text-sm text-gray-500 dark:text-gray-400 mt-1">{question.options.map((opt, i) => (<li key={i} className={i === question.correctOptionIndex? 'text-green-600 font-semibold' : ''}>{String.fromCharCode(65 + i)}. {opt} {i === question.correctOptionIndex && '✓'}</li>))}</ul></div><div className="flex gap-2 text-sm shrink-0"><button onClick={onEditToggle} className="text-primary-600">Edit</button><button onClick={onDelete} className="text-red-600">Delete</button></div></div>);
  }
  return (<div className="border dark:border-gray-700 rounded-lg p-3 space-y-2 bg-primary-50 dark:bg-gray-700"><input value={text} onChange={(e) => setText(e.target.value)} className="input" />{options.map((opt, i) => (<div key={i} className="flex items-center gap-2"><input type="radio" checked={correctIdx === i} onChange={() => setCorrectIdx(i)} /><input value={opt} onChange={(e) => { const n = [...options]; n[i] = e.target.value; setOptions(n); }} className="input" /></div>))}<div className="flex gap-2"><button onClick={() => onSave({ questionText: text, options, correctOptionIndex: correctIdx })} className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm">সেভ</button><button onClick={onEditToggle} className="text-sm text-gray-500">বাতিল</button></div></div>);
}
