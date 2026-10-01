// ================== api/pendingExams.js ==================
// পেন্ডিং (অসম্পূর্ণ) পরীক্ষার API। Redux-এর বাইরে রাখা হয়েছে, যাতে নীরব অটো-সেভে
// পুরো অ্যাপের loading স্ট্যাটাস না নড়ে।
import axios from './axiosClient';

export const savePendingExam = (payload) => axios.post('/exams/pending', payload);
export const fetchPendingExam = (id) => axios.get(`/exams/pending/${id}`);
export const finalizePendingExam = (id, payload) => axios.post(`/exams/pending/${id}/finalize`, payload);
