// ================== pages/Home.jsx ==================
import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <h1 className="text-4xl font-bold mb-4 dark:text-white">Live MCQ Exam Platform</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        PDF আপলোড করো, অটোমেটিক Live MCQ পরীক্ষা তৈরি করো, শেয়ারযোগ্য লিংক দাও — শিক্ষার্থীরা রিয়েল-টাইমে পরীক্ষা দেবে।
      </p>
      <div className="flex justify-center gap-4">
        <Link to="/teacher/login" className="bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700">
          শিক্ষক হিসেবে লগইন
        </Link>
        <Link to="/teacher/register" className="border border-primary-600 text-primary-600 px-6 py-3 rounded-xl font-medium">
          নতুন একাউন্ট
        </Link>
      </div>
      <p className="text-sm text-gray-400 mt-8">শিক্ষার্থীরা শিক্ষকের দেয়া লিংক থেকে সরাসরি পরীক্ষায় জয়েন করবে — আলাদা লগইনের দরকার নেই।</p>
    </div>
  );
}
