// ================== components/shellNav.js ==================
// DashboardShell-এর সাইডবার মেনু — role অনুযায়ী (admin / teacher / student)।
// প্রতিটা আইটেম: { key, label, icon, to, badge?, extra? }  (extra = আরও যেসব path-এ এই আইটেম "সক্রিয়" ধরা হবে)

export function buildNav(role, t, badges = {}) {
  if (role === 'admin') {
    const q = (k) => `/admin/dashboard?tab=${k}`;
    return {
      roleLabel: t('a.title'),
      pinned: { key: 'overview', label: t('a.tab.overview'), sub: t('shell.dashOverview'), icon: 'home', to: '/admin/dashboard' },
      groups: [
        { key: 'people', label: t('a.grp.people'), items: [
          { key: 'teachers', label: t('a.tab.teachers'), icon: 'teacher', to: q('teachers') },
          { key: 'users', label: t('a.tab.users'), icon: 'users', to: q('users') },
        ] },
        { key: 'money', label: t('a.grp.money'), items: [
          { key: 'payments', label: t('a.tab.payments'), icon: 'card', to: q('payments'), badge: badges.payments },
          { key: 'plans', label: t('a.tab.plans'), icon: 'tag', to: q('plans') },
        ] },
        { key: 'platform', label: t('a.grp.platform'), items: [
          { key: 'trial', label: t('a.tab.trial'), icon: 'clock', to: q('trial') },
          { key: 'messages', label: t('a.tab.messages'), icon: 'chat', to: q('messages'), badge: badges.messages },
          { key: 'contact', label: t('a.tab.contact'), icon: 'phone', to: q('contact') },
          { key: 'customize', label: t('a.tab.customize'), icon: 'brush', to: q('customize') },
        ] },
      ],
    };
  }

  if (role === 'teacher') {
    const q = (k) => `/teacher/dashboard?tab=${k}`;
    return {
      roleLabel: t('t.panel'),
      pinned: { key: 'overview', label: t('t.tab.overview'), sub: t('shell.dashOverview'), icon: 'home', to: '/teacher/dashboard' },
      groups: [
        { key: 'exams', label: t('t.grp.exams'), items: [
          { key: 'exams', label: t('t.tab.exams'), icon: 'file', to: q('exams'), extra: /^\/teacher\/exam\// },
          { key: 'pending', label: t('t.tab.pending'), icon: 'clock', to: q('pending'), badge: badges.pending },
          { key: 'create', label: t('dash.newExamOnline'), icon: 'plus', to: '/teacher/create' },
          { key: 'upload', label: t('dash.newExam'), icon: 'upload', to: '/teacher/upload' },
        ] },
        { key: 'people', label: t('t.grp.people'), items: [
          { key: 'classes', label: t('t.tab.classes'), icon: 'tag', to: q('classes') },
          { key: 'students', label: t('t.tab.students'), icon: 'users', to: q('students') },
        ] },
        { key: 'talk', label: t('t.grp.talk'), items: [
          { key: 'messages', label: t('t.tab.messages'), icon: 'chat', to: q('messages') },
        ] },
        { key: 'account', label: t('shell.grp.account'), items: [
          { key: 'subscribe', label: t('nav.subscription'), icon: 'card', to: '/teacher/subscribe' },
        ] },
      ],
    };
  }

  // student
  return {
    roleLabel: t('shell.studentPanel'),
    pinned: { key: 'home', label: t('common.exams'), sub: t('shell.studentSub'), icon: 'home', to: '/exams', extra: /^\/exams\/[^/]+\/leaderboard/ },
    groups: [
      { key: 'exams', label: t('shell.grp.learn'), items: [
        { key: 'past', label: t('pastExams.title'), icon: 'clock', to: '/exams/past' },
      ] },
      { key: 'account', label: t('shell.grp.account'), items: [
        { key: 'notifications', label: t('msg.notifications'), icon: 'bell', to: '/notifications' },
      ] },
    ],
  };
}

// আইটেমটা এই লোকেশনে সক্রিয় কিনা
export function isItemActive(item, location) {
  const [path, query] = item.to.split('?');
  if (item.extra && item.extra.test(location.pathname)) return true;
  if (location.pathname !== path) return false;
  const tab = new URLSearchParams(location.search).get('tab');
  if (query) return tab === new URLSearchParams(query).get('tab');
  // কোয়েরিহীন আইটেম (ওভারভিউ): tab না থাকলে বা 'overview' হলে সক্রিয়
  if (path.endsWith('/dashboard')) return !tab || tab === 'overview';
  return true;
}
