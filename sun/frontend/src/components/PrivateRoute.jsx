// ================== components/PrivateRoute.jsx ==================
// শুধু নির্দিষ্ট role লগইন থাকলে চাইল্ড রুট দেখাবে, নাহলে লগইন পেজে রিডাইরেক্ট করবে
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function PrivateRoute({ role, children }) {
  const { user, token } = useSelector((s) => s.auth);
  if (!token || !user || user.role !== role) {
    const to = role === 'teacher' ? '/teacher/login' : role === 'admin' ? '/admin/login' : '/';
    return <Navigate to={to} replace />;
  }
  return children;
}
