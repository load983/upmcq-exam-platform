// ================== components/BackgroundWallpaper.jsx ==================
// পুরো সাইট জুড়ে ফিক্সড ব্যাকগ্রাউন্ড ওয়ালপেপার — ইউজারের বাছাই করা স্টাইল অনুযায়ী রেন্ডার হয়।
// এটা App.jsx এ সবার নিচে (z-index -10) বসানো থাকে, তাই সব পেজেই একইভাবে দেখা যায়।
import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function BackgroundWallpaper() {
  const { bgStyle } = useTheme();

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {bgStyle === 'minimal' && <MinimalTint />}
      {bgStyle === 'blobs' && <GradientBlobs />}
      {bgStyle === 'dots' && <DotGrid />}
      {bgStyle === 'mesh' && <MeshWash />}
    </div>
  );
}

function MinimalTint() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-primary-50/60 via-transparent to-transparent dark:from-primary-500/[0.06]" />
  );
}

function GradientBlobs() {
  return (
    <>
      <div className="absolute -left-24 -top-24 h-96 w-96 animate-float-slow rounded-full bg-primary-300/30 blur-3xl dark:bg-primary-600/20" />
      <div
        className="absolute -right-24 top-1/4 h-[28rem] w-[28rem] animate-float-slow rounded-full bg-sky-300/25 blur-3xl dark:bg-sky-600/15"
        style={{ animationDelay: '1.5s' }}
      />
      <div
        className="absolute bottom-[-6rem] left-1/3 h-96 w-96 animate-float-slow rounded-full bg-violet-300/25 blur-3xl dark:bg-violet-600/15"
        style={{ animationDelay: '3s' }}
      />
    </>
  );
}

function DotGrid() {
  return (
    <div
      className="absolute inset-0 opacity-[0.35] dark:opacity-[0.18]"
      style={{
        backgroundImage: 'radial-gradient(rgb(var(--color-primary-500) / 0.6) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
      }}
    />
  );
}

function MeshWash() {
  return (
    <div
      className="absolute inset-0 opacity-70 dark:opacity-40"
      style={{
        backgroundImage: `
          radial-gradient(at 15% 10%, rgb(var(--color-primary-400) / 0.35) 0px, transparent 55%),
          radial-gradient(at 85% 20%, rgb(56 189 248 / 0.30) 0px, transparent 55%),
          radial-gradient(at 20% 85%, rgb(167 139 250 / 0.28) 0px, transparent 55%),
          radial-gradient(at 90% 90%, rgb(var(--color-primary-500) / 0.25) 0px, transparent 55%)
        `,
      }}
    />
  );
}
