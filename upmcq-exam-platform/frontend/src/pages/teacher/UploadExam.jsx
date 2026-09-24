// ================== pages/teacher/UploadExam.jsx ==================
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { uploadExamPdf } from '../../features/exam/examSlice';
import { useLanguage } from '../../context/LanguageContext';
import PdfDropzone from '../../components/PdfDropzone';

export default function UploadExam() {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((s) => s.exam);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setLocalError(t('upload.selectPdf'));
    setLoading(true);
    setLocalError('');

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('title', title);

    const result = await dispatch(uploadExamPdf(formData));
    setLoading(false);
    if (uploadExamPdf.fulfilled.match(result)) {
      navigate(`/teacher/exam/${result.payload.exam._id}`);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h2 className="text-xl font-bold mb-2 dark:text-white">{t('upload.title')}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {t('upload.formatLabel')} <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{t('upload.formatExample')}</code>
      </p>
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <input placeholder={t('upload.titlePlaceholder')}
          value={title} onChange={(e) => setTitle(e.target.value)}
          className="input" />

        <PdfDropzone file={file} onFile={setFile} onError={setLocalError} />

        {(localError || error) && <p className="text-red-600 text-sm">{localError || error}</p>}
        <button disabled={loading} className="btn-primary w-full">
          {loading ? t('upload.parsing') : t('upload.submit')}
        </button>
      </form>
    </div>
  );
}
