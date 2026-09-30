// Service Worker — ডিভাইসের নোটিফিকেশন bar-এ পুশ নোটিফিকেশন দেখায়
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { body: event.data && event.data.text() }; }
  const title = data.title || 'MCQ Exam Platform';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/favicon-192x192.png',
      badge: '/favicon-192x192.png',
      image: data.image || undefined,
      tag: data.tag || undefined, // একই tag হলে আগের নোটিফিকেশন বদলে যায়
      renotify: !!data.tag,
      data: { url: data.url || '/notifications' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/notifications';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) { c.navigate(url).catch(() => {}); return c.focus(); }
      }
      return self.clients.openWindow(url);
    })
  );
});

// অফলাইনে পেজ খুললে ব্রাউজারের এরর পেজের বদলে সহজ বার্তা দেখায় (API ও অন্য রিকোয়েস্টে হাত দেয় না)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.mode !== 'navigate') return;
  event.respondWith(
    fetch(req).catch(() =>
      new Response(
        '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<body style="font-family:sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px">' +
        '<div><div style="font-size:48px">📡</div><h2>ইন্টারনেট সংযোগ নেই</h2><p>সংযোগ ফিরলে পেজটি আবার লোড করো।<br>No internet connection — reload when you are back online.</p>' +
        '<button onclick="location.reload()" style="padding:10px 20px;border:0;border-radius:12px;background:#4f46e5;color:#fff;font-size:16px">Reload</button></div>',
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    )
  );
});
