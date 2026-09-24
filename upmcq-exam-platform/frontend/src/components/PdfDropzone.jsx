// ================== components/PdfDropzone.jsx ==================
// Drag & drop (অথবা ক্লিক করে) PDF বাছাই করার রিইউজেবল কম্পোনেন্ট
import React, { useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const isPdf = (f) => f && (f.type === 'application/pdf' || /\.pdf$/i.test(f.name));

export default function PdfDropzone({ file, onFile, onError, compact = false }) {
  const { t } = useLanguage();
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);
  const dragDepth = useRef(0);

  const pick = (f) => {
    if (!f) return;
    if (!isPdf(f)) {
      onFile(null);
      onError?.(t('upload.onlyPdf'));
      return;
    }
    onError?.('');
    onFile(f);
  };

  const open = () => inputRef.current?.click();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        dragDepth.current += 1;
        setDragActive(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragActive(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragDepth.current = 0;
        setDragActive(false);
        pick(e.dataTransfer.files?.[0]);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 text-center transition-colors ${
        compact ? 'py-5' : 'py-8'
      } ${
        dragActive
          ? 'border-primary-500 bg-primary-500/10'
          : 'border-gray-300 hover:border-primary-500 dark:border-white/20'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <div className={compact ? 'mb-1 text-3xl' : 'mb-2 text-4xl'}>{file ? '📄' : '📥'}</div>
      {file ? (
        <>
          <p className="break-all text-sm font-semibold dark:text-white">{file.name}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {(file.size / 1024 / 1024).toFixed(2)} MB · {t('upload.change')}
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold dark:text-white">
            {dragActive ? t('upload.dropActive') : t('upload.dropHere')}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('upload.orBrowse')}</p>
        </>
      )}
    </div>
  );
}
