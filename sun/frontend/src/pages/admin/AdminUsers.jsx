// ================== pages/admin/AdminUsers.jsx ==================
// অ্যাডমিন > ইউজার্স: শিক্ষক ও শিক্ষার্থীর তালিকা, তথ্য এডিট, পাসওয়ার্ড রিসেট, শিক্ষক-শিক্ষার্থী সংযোগ ম্যানেজ
import React, { useCallback, useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminUsers({ say }) {
  const { t, locale } = useLanguage();
  const fmt = (d) => (d ? new Date(d).toLocaleDateString(locale) : '-');
  const [role, setRole] = useState('teacher');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null); // এক্সপ্যান্ড করা ইউজারের আইডি
  const [edit, setEdit] = useState(null); // { _id, name, email, phone, roll }
  const [pw, setPw] = useState({}); // { [id]: 'নতুন পাসওয়ার্ড' }
  const [shownPw, setShownPw] = useState({}); // রিসেটের পর একবার দেখানোর জন্য
  const [teacherStudents, setTeacherStudents] = useState({});
  const [allClasses, setAllClasses] = useState([]);
  const [pickClass, setPickClass] = useState({});

  const errMsg = (e) => say(e.response?.data?.message || t('a.error'));

  const load = useCallback(() => {
    setLoading(true);
    return axiosClient
      .get('/admin/users', { params: { role, search } })
      .then(({ data }) => setUsers(data.users))
      .catch(errMsg)
      .finally(() => setLoading(false));
  }, [role, search]);

  useEffect(() => { const id = setTimeout(load, 250); return () => clearTimeout(id); }, [load]);
  useEffect(() => { setOpen(null); setEdit(null); }, [role]);
  useEffect(() => {
    if (role === 'student') axiosClient.get('/admin/users/classes').then(({ data }) => setAllClasses(data.classes)).catch(() => {});
  }, [role]);

  const loadTeacherStudents = (id) =>
    axiosClient.get(`/admin/users/${id}/students`).then(({ data }) => setTeacherStudents((m) => ({ ...m, [id]: data.students }))).catch(errMsg);

  const toggle = (u) => {
    const next = open === u._id ? null : u._id;
    setOpen(next);
    if (next && role === 'teacher') loadTeacherStudents(u._id);
  };

  const run = async (fn, after) => {
    try {
      const { data } = await fn();
      say(data.message || t('a.done'));
      await load();
      if (after) after(data);
    } catch (e) { errMsg(e); }
  };

  const saveEdit = () => run(() => axiosClient.put(`/admin/users/${edit._id}`, edit), () => setEdit(null));

  const resetPw = (u, generate) => {
    const v = generate ? '' : (pw[u._id] || '').trim();
    if (!generate && v.length < 6) return say(t('a.u.pwShort'));
    run(
      () => axiosClient.post(`/admin/users/${u._id}/password`, generate ? {} : { password: v }),
      (data) => { setShownPw((m) => ({ ...m, [u._id]: data.password })); setPw((m) => ({ ...m, [u._id]: '' })); }
    );
  };

  const addClass = (u) => {
    const classId = pickClass[u._id];
    if (!classId) return;
    run(() => axiosClient.post(`/admin/users/${u._id}/classes`, { classId }), () => setPickClass((m) => ({ ...m, [u._id]: '' })));
  };

  const removeFromTeacherView = (teacherId, s, classId) =>
    run(() => axiosClient.delete(`/admin/users/${s._id}/classes/${classId}`), () => loadTeacherStudents(teacherId));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button className={role === 'teacher' ? 'btn-primary' : 'btn-secondary'} onClick={() => setRole('teacher')}>{t('a.u.teachers')}</button>
        <button className={role === 'student' ? 'btn-primary' : 'btn-secondary'} onClick={() => setRole('student')}>{t('a.u.students')}</button>
        <input className="input max-w-xs" placeholder={t('a.u.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
        <span className="text-sm text-gray-500">{t('a.u.count', { n: users.length })}</span>
      </div>

      <p className="mb-3 rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-800">{t('a.u.pwNote')}</p>

      {loading && <div className="text-sm text-gray-500">{t('a.loading')}</div>}

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u._id} className="card !p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium dark:text-white">{u.name}</div>
                <div className="text-xs text-gray-500">
                  {role === 'teacher'
                    ? `${u.email} · ${t('a.u.studentCount', { n: u.studentCount })}`
                    : `${u.phone || '-'}${u.roll ? ` · ${t('a.u.roll')}: ${u.roll}` : ''}`}
                </div>
              </div>
              <div className="flex gap-1">
                <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => toggle(u)}>{open === u._id ? t('a.u.close') : t('a.u.details')}</button>
              </div>
            </div>

            {open === u._id && (
              <div className="mt-3 space-y-4 border-t border-gray-100 pt-3 text-sm dark:border-white/10 dark:text-gray-200">
                {/* ---- বিস্তারিত / এডিট ---- */}
                {edit?._id === u._id ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input className="input" placeholder={t('a.u.name')} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                    {role === 'teacher' ? (
                      <input className="input" placeholder={t('a.u.email')} value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
                    ) : (
                      <>
                        <input className="input" placeholder={t('a.u.phone')} value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} />
                        <input className="input" placeholder={t('a.u.roll')} value={edit.roll} onChange={(e) => setEdit({ ...edit, roll: e.target.value })} />
                      </>
                    )}
                    <div className="flex gap-2">
                      <button className="btn-success !px-3 !py-1 text-xs" onClick={saveEdit}>{t('a.save')}</button>
                      <button className="btn-secondary !px-3 !py-1 text-xs" onClick={() => setEdit(null)}>{t('a.u.cancel')}</button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-1 sm:grid-cols-2">
                    <div><span className="text-gray-500">{t('a.u.name')}: </span>{u.name}</div>
                    {role === 'teacher' ? (
                      <>
                        <div><span className="text-gray-500">{t('a.u.email')}: </span>{u.email}</div>
                        <div><span className="text-gray-500">{t('a.u.accessCode')}: </span><span className="font-mono">{u.accessCode || '-'}</span></div>
                      </>
                    ) : (
                      <>
                        <div><span className="text-gray-500">{t('a.u.phone')}: </span>{u.phone || '-'}</div>
                        <div><span className="text-gray-500">{t('a.u.roll')}: </span>{u.roll || '-'}</div>
                      </>
                    )}
                    <div><span className="text-gray-500">{t('a.u.joined')}: </span>{fmt(u.createdAt)}</div>
                    <div className="sm:col-span-2">
                      <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => setEdit({ _id: u._id, name: u.name || '', email: u.email || '', phone: u.phone || '', roll: u.roll || '' })}>{t('a.u.edit')}</button>
                    </div>
                  </div>
                )}

                {/* ---- পাসওয়ার্ড ---- */}
                <div>
                  <div className="mb-1 font-semibold">{t('a.u.password')}</div>
                  <div className="mb-2 text-xs text-gray-500">{u.hasPassword ? t('a.u.pwHashed') : t('a.u.pwNone')}</div>
                  {shownPw[u._id] && (
                    <div className="mb-2 rounded-lg bg-green-50 px-3 py-2 text-green-900">
                      {t('a.u.newPw')}: <span className="font-mono font-bold select-all">{shownPw[u._id]}</span>
                      <span className="ml-2 text-xs">{t('a.u.pwOnce')}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <input className="input max-w-[14rem]" type="text" placeholder={t('a.u.newPwPh')} value={pw[u._id] || ''} onChange={(e) => setPw((m) => ({ ...m, [u._id]: e.target.value }))} />
                    <button className="btn-primary !px-3 !py-1 text-xs" onClick={() => resetPw(u, false)}>{t('a.u.setPw')}</button>
                    <button className="btn-secondary !px-3 !py-1 text-xs" onClick={() => resetPw(u, true)}>{t('a.u.genPw')}</button>
                  </div>
                </div>

                {/* ---- শিক্ষক: শ্রেণী ও শিক্ষার্থী ---- */}
                {role === 'teacher' && (
                  <div>
                    <div className="mb-1 font-semibold">{t('a.u.classes')}</div>
                    <div className="mb-3 flex flex-wrap gap-1">
                      {u.classes.length === 0 && <span className="text-xs text-gray-500">{t('a.u.noClasses')}</span>}
                      {u.classes.map((c) => (
                        <span key={c._id} className="badge bg-blue-100 text-blue-800">{c.name} · {c.studentCount} · <span className="font-mono">{c.accessCode}</span></span>
                      ))}
                    </div>
                    <div className="mb-1 font-semibold">{t('a.u.hisStudents')}</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-gray-500"><tr><th className="py-1">{t('a.u.name')}</th><th>{t('a.u.phone')}</th><th>{t('a.u.roll')}</th><th>{t('a.u.class')}</th><th></th></tr></thead>
                        <tbody>
                          {(teacherStudents[u._id] || []).map((s) => (
                            <tr key={s._id} className="border-t border-gray-100 dark:border-white/10">
                              <td className="py-1">{s.name}{s.banned && <span className="badge ml-1 bg-red-100 text-red-800">{t('a.u.banned')}</span>}</td>
                              <td>{s.phone || '-'}</td>
                              <td>{s.roll || '-'}</td>
                              <td>{s.classes.map((c) => c.name).join(', ') || (s.legacy ? t('a.u.legacy') : '-')}</td>
                              <td>
                                <div className="flex flex-wrap gap-1">
                                  {s.classes.map((c) => (
                                    <button key={c._id} className="btn-danger !px-2 !py-0.5 text-[11px]" onClick={() => window.confirm(t('a.u.confirmRemove')) && removeFromTeacherView(u._id, s, c._id)}>
                                      {t('a.u.removeFrom', { c: c.name })}
                                    </button>
                                  ))}
                                  {s.legacy && (
                                    <button className="btn-danger !px-2 !py-0.5 text-[11px]" onClick={() => window.confirm(t('a.u.confirmRemove')) && run(() => axiosClient.delete(`/admin/users/${s._id}/teachers/${u._id}`), () => loadTeacherStudents(u._id))}>
                                      {t('a.u.removeLegacy')}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {teacherStudents[u._id] && teacherStudents[u._id].length === 0 && <tr><td colSpan="5" className="py-2 text-gray-500">{t('a.u.noStudents')}</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ---- শিক্ষার্থী: শিক্ষক/শ্রেণী সংযোগ ---- */}
                {role === 'student' && (
                  <div>
                    <div className="mb-1 font-semibold">{t('a.u.connected')}</div>
                    <div className="mb-2 flex flex-wrap gap-1">
                      {u.classes.length === 0 && u.legacyTeachers.length === 0 && <span className="text-xs text-gray-500">{t('a.u.noTeachers')}</span>}
                      {u.classes.map((c) => (
                        <span key={c._id} className="badge bg-blue-100 text-blue-800">
                          {c.teacher?.name || '?'} — {c.name}
                          <button className="ml-2 font-bold text-red-600" title={t('a.u.remove')} onClick={() => window.confirm(t('a.u.confirmRemove')) && run(() => axiosClient.delete(`/admin/users/${u._id}/classes/${c._id}`))}>×</button>
                        </span>
                      ))}
                      {u.legacyTeachers.map((tc) => (
                        <span key={tc._id} className="badge bg-gray-200 text-gray-800">
                          {tc.name} ({t('a.u.legacy')})
                          <button className="ml-2 font-bold text-red-600" title={t('a.u.remove')} onClick={() => window.confirm(t('a.u.confirmRemove')) && run(() => axiosClient.delete(`/admin/users/${u._id}/teachers/${tc._id}`))}>×</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <select className="input max-w-xs" value={pickClass[u._id] || ''} onChange={(e) => setPickClass((m) => ({ ...m, [u._id]: e.target.value }))}>
                        <option value="">{t('a.u.pickClass')}</option>
                        {allClasses
                          .filter((c) => !u.classes.some((x) => String(x._id) === String(c._id)))
                          .map((c) => <option key={c._id} value={c._id}>{c.teacher.name} — {c.name}</option>)}
                      </select>
                      <button className="btn-primary !px-3 !py-1 text-xs" onClick={() => addClass(u)}>{t('a.u.assign')}</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {!loading && users.length === 0 && <div className="text-sm text-gray-500">{t('a.u.none')}</div>}
      </div>
    </div>
  );
}
