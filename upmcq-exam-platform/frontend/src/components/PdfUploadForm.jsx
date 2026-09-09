import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadExamPdf } from '../../features/exam/examSlice';

const PdfUploadForm = () => {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.exam);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return alert('অনুগ্রহ করে একটি PDF ফাইল সিলেক্ট করুন');

    // ⚠️ সঠিকভাবে FormData অবজেক্ট তৈরি
    const formData = new FormData();
    formData.append('title', title);
    formData.append('pdf', file); // ব্যাকএন্ডে multer.single('pdf') এর কী-নাম 'pdf' হতে হবে

    dispatch(uploadExamPdf(formData));
  };

  return (
    <form onSubmit={handleSubmit} className="upload-container">
      <h2>PDF আপলোড করে পরীক্ষা তৈরি করো</h2>
      
      <input
        type="text"
        placeholder="পরীক্ষার নাম (যেমন: kio)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
        required
      />

      {error && <p className="error-text">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'প্রসেস হচ্ছে...' : 'আপলোড ও পার্স করো'}
      </button>
    </form>
  );
};

export default PdfUploadForm;
