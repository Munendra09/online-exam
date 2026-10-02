'use client';

import { useEffect, useState } from 'react';
import API from '@/lib/api';
import Guard from '@/components/Guard';
import Shell from '@/components/Shell';
import { siteConfig } from '@/config/site';
import {
  Plus, Edit2, Trash2, X, Upload, Users, CheckCircle, ShieldAlert,
  Eye, Lock, Unlock, IdCard, Settings2, Calendar, Clock, FileText,
} from 'lucide-react';
import { formatDate, formatTime, statusColor } from '@/lib/utils';

export default function AdminExams() {
  return (
    <Guard role="ADMIN">
      <Shell>
        <Inner />
      </Shell>
    </Guard>
  );
}

function Inner() {
  const today = new Date().toISOString().slice(0, 10);
  const [exams, setExams] = useState<any[]>([]);
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [csvExamId, setCsvExamId] = useState<number | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok');
  const [securityReport, setSecurityReport] = useState<any>(null);
  const [securityExamId, setSecurityExamId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const emptyForm = {
    title: "Lucky Tech Academy Scholarship Exam",
    date: today,
    startTime: "10:00",
    endTime: "12:00",
    duration: "120",
    totalQuestions: "50",
    status: "DRAFT",
    shiftName: "Morning Shift",
    studentsPerShift: "25",
    examCenter: siteConfig.defaultCenter,
    centerLatitude: "",
    centerLongitude: "",
    allowedRadiusMeters: "500",
    geoCheckEnabled: false,
    negativeMarkingEnabled: false,
    negativeMarksPerQuestion: "0.25",
    targetClasses: [] as string[],
  };
  const [form, setForm] = useState<any>(emptyForm);

  useEffect(() => {
    API.get('/classes').then((r) => setClassOptions(r.data.classes.map((c: any) => c.name))).catch(() => {});
  }, []);

  function load() { API.get('/exams').then((r) => setExams(r.data.exams || [])); }
  useEffect(() => { load(); }, []);

  function flash(m: string, type: 'ok' | 'err' = 'ok') {
    setMessage(m); setMsgType(type);
    setTimeout(() => setMessage(''), 4000);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.targetClasses?.length) {
      flash('Please select at least one target class', 'err');
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await API.put(`/exams/${editing.id}`, form);
        flash('Exam updated');
      } else {
        const { data } = await API.post('/exams', form);
        flash(data.message || 'Exam created');
      }
      setShowForm(false); setEditing(null); setForm(emptyForm); load();
    } catch (err: any) {
      flash(err.response?.data?.message || 'Failed to save exam', 'err');
    } finally { setBusy(false); }
  }

  function startEdit(exam: any) {
    setEditing(exam);
    setForm({
      title: exam.title, date: exam.date,
      startTime: exam.startTime?.slice(0, 5), endTime: exam.endTime?.slice(0, 5),
      duration: String(exam.duration), totalQuestions: String(exam.totalQuestions),
      status: exam.status, shiftName: exam.shiftName || 'Morning Shift',
      studentsPerShift: String(exam.studentsPerShift || 25),
      examCenter: exam.examCenter,
      centerLatitude: String(exam.centerLatitude || ''),
      centerLongitude: String(exam.centerLongitude || ''),
      allowedRadiusMeters: String(exam.allowedRadiusMeters),
      geoCheckEnabled: exam.geoCheckEnabled,
      negativeMarkingEnabled: exam.negativeMarkingEnabled,
      negativeMarksPerQuestion: String(exam.negativeMarksPerQuestion),
      targetClasses: exam.targetClasses ? exam.targetClasses.split(',').map((c: string) => c.trim()) : [],
    });
    setShowForm(true);
  }

  async function deleteExam(id: number) {
    if (!confirm('Delete this exam? All questions and assignments will be removed.')) return;
    await API.delete(`/exams/${id}`);
    flash('Exam deleted'); load();
  }

  async function changeStatus(id: number, status: string) {
    await API.patch(`/exams/${id}/status`, { status }); load();
    flash(`Status changed to ${status}`);
  }

  async function toggleAccess(id: number, enabled: boolean) {
    await API.patch(`/exams/${id}/toggle-access`, { enabled }); load();
    flash(`Exam access ${enabled ? 'enabled' : 'disabled'}`);
  }

  async function releaseAdmit(id: number) {
    if (!confirm('Release admit cards now? This will auto-assign shifts.')) return;
    setBusy(true);
    try {
      const { data } = await API.post(`/admin/exams/${id}/release-admit`);
      flash(data.message); load();
    } catch (e: any) {
      flash(e.response?.data?.message || 'Release failed', 'err');
    } finally { setBusy(false); }
  }

  async function toggleAnswerKey(exam: any) {
    await API.patch(`/admin/exams/${exam.id}/release-answer-key`, { value: !exam.answerKeyReleased });
    flash(`Answer key ${!exam.answerKeyReleased ? 'released' : 'hidden'}`); load();
  }

  async function toggleResult(exam: any) {
    await API.patch(`/admin/exams/${exam.id}/release-result`, { value: !exam.resultReleased });
    flash(`Result ${!exam.resultReleased ? 'released' : 'hidden'}`); load();
  }

  async function syncAssignments(id: number) {
    const { data } = await API.post(`/admin/exams/${id}/sync-assignments`);
    flash(data.message); load();
  }

  async function uploadCsv(examId: number) {
    if (!csvFile) return;
    const fd = new FormData(); fd.append('file', csvFile);
    setBusy(true);
    try {
      const { data } = await API.post(`/questions/upload/${examId}`, fd);
      flash(`${data.inserted} questions uploaded`);
      setCsvExamId(null); setCsvFile(null); load();
    } catch (err: any) {
      flash(err.response?.data?.message || 'CSV upload failed', 'err');
    } finally { setBusy(false); }
  }

  async function viewSecurity(examId: number) {
    const { data } = await API.get(`/exams/${examId}/security-report`);
    setSecurityReport(data.attempts);
    setSecurityExamId(examId);
  }

  async function enableStudent(examId: number, userId: number) {
    await API.patch(`/admin/exams/${examId}/enable-student/${userId}`);
    flash('Student re-enabled');
    viewSecurity(examId);
  }

  async function resetStudent(examId: number, userId: number) {
    if (!confirm('Delete attempt & result? Student can re-take. Continue?')) return;
    await API.patch(`/admin/exams/${examId}/reset-student/${userId}`);
    flash('Student exam reset');
    viewSecurity(examId);
  }

  function toggleClass(cls: string) {
    setForm((prev: any) => ({
      ...prev,
      targetClasses: prev.targetClasses.includes(cls)
        ? prev.targetClasses.filter((c: string) => c !== cls)
        : [...prev.targetClasses, cls],
    }));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Exam Management</h1>
          <p className="text-sm text-slate-500 mt-1">{exams.length} exams created</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true); }}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4" /> Create Exam
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-xl border text-sm mb-4 flex items-center gap-2 animate-slide-down ${
          msgType === 'ok'
            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
            : 'bg-red-50 border-red-100 text-red-700'
        }`}>
          <CheckCircle className="h-4 w-4" /> {message}
        </div>
      )}

      {/* Exam Cards */}
      <div className="space-y-4">
        {exams.length === 0 && (
          <div className="card p-12 text-center text-slate-400">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
            No exams yet. Click <strong className="text-slate-600">Create Exam</strong> to get started.
          </div>
        )}
        {exams.map((exam) => (
          <ExamCard
            key={exam.id}
            exam={exam}
            onEdit={() => startEdit(exam)}
            onDelete={() => deleteExam(exam.id)}
            onPublish={() => changeStatus(exam.id, exam.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')}
            onToggleAccess={() => toggleAccess(exam.id, !exam.examAccessEnabled)}
            onReleaseAdmit={() => releaseAdmit(exam.id)}
            onSync={() => syncAssignments(exam.id)}
            onToggleAnswerKey={() => toggleAnswerKey(exam)}
            onToggleResult={() => toggleResult(exam)}
            onUploadCsv={() => setCsvExamId(exam.id)}
            onSecurity={() => viewSecurity(exam.id)}
            busy={busy}
          />
        ))}
      </div>

      {/* CSV Upload Modal */}
      {csvExamId && (
        <Modal onClose={() => { setCsvExamId(null); setCsvFile(null); }} title="Upload Questions CSV">
          <div className="space-y-3">
            <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
              Required columns: <code className="bg-white px-1 rounded border border-slate-200">question, optionA, optionB, optionC, optionD, correctAnswer</code>
            </div>
            <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} className="input" />
            <div className="flex gap-2">
              <button onClick={() => { setCsvExamId(null); setCsvFile(null); }} className="btn btn-outline flex-1">Cancel</button>
              <button onClick={() => uploadCsv(csvExamId)} disabled={!csvFile || busy} className="btn btn-primary flex-1">
                <Upload className="h-4 w-4" /> {busy ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Security Modal */}
      {securityReport && securityExamId && (
        <Modal onClose={() => { setSecurityReport(null); setSecurityExamId(null); }} title="Security Report" wide>
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>Student</th><th>Reg ID</th><th>Class</th>
                  <th>Status</th><th>Tab Switches</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {securityReport.map((a: any) => (
                  <tr key={a.studentId}>
                    <td className="font-medium">{a.studentName}</td>
                    <td className="text-slate-500">{a.registrationId}</td>
                    <td>{a.className}</td>
                    <td>
                      <span className={`badge text-xs ${
                        a.status === 'DISQUALIFIED' ? 'bg-red-100 text-red-700' :
                        a.status === 'SUBMITTED' ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{a.status}</span>
                    </td>
                    <td className={a.tabSwitchCount >= 3 ? 'text-red-600 font-bold' : ''}>
                      {a.tabSwitchCount}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {a.status === 'DISQUALIFIED' && (
                          <button onClick={() => enableStudent(securityExamId, a.studentId)}
                            className="btn btn-sm bg-green-600 text-white text-xs">Re-enable</button>
                        )}
                        <button onClick={() => resetStudent(securityExamId, a.studentId)}
                          className="btn btn-sm bg-red-100 text-red-600 text-xs">Reset</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <Modal
          onClose={() => { setShowForm(false); setEditing(null); }}
          title={editing ? 'Edit Exam' : 'Create New Exam'}
          wide
        >
          <ExamForm
            form={form}
            setForm={setForm}
            classOptions={classOptions}
            toggleClass={toggleClass}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null); }}
            busy={busy}
            isEdit={!!editing}
          />
        </Modal>
      )}
    </div>
  );
}

/* ----- Exam Card ----- */
function ExamCard({
  exam, onEdit, onDelete, onPublish, onToggleAccess, onReleaseAdmit,
  onSync, onToggleAnswerKey, onToggleResult, onUploadCsv, onSecurity, busy,
}: any) {
  const questionCount = exam.Questions?.length || 0;
  const targetClasses = exam.targetClasses ? exam.targetClasses.split(',').map((c: string) => c.trim()) : [];

  return (
    <div className="card p-5 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-bold text-lg text-slate-800 truncate">{exam.title}</h3>
            <span className={`badge ${statusColor(exam.status)}`}>{exam.status}</span>
            {exam.examAccessEnabled
              ? <span className="badge bg-green-100 text-green-700">🟢 Access ON</span>
              : <span className="badge bg-red-100 text-red-600">🔴 Access OFF</span>
            }
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-2">
            <span>📅 {formatDate(exam.date)}</span>
            <span>🕐 {formatTime(exam.startTime)} - {formatTime(exam.endTime)}</span>
            <span>⏱ {exam.duration} min</span>
            <span>📝 {exam.totalQuestions} Q</span>
            {questionCount > 0 && <span>📚 {questionCount} uploaded</span>}
            <span>👥 {exam.studentsPerShift || 25}/shift</span>
          </div>
          {targetClasses.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              <span className="text-xs text-slate-400 mr-1">Classes:</span>
              {targetClasses.map((c: string) => (
                <span key={c} className="badge bg-blue-50 text-blue-700 text-xs">{c}</span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {exam.examCenter && <span className="badge bg-slate-100 text-slate-600 text-xs">📍 {exam.examCenter}</span>}
            {exam.geoCheckEnabled && <span className="badge bg-blue-100 text-blue-700 text-xs">🗺️ Geo-Fenced ({exam.allowedRadiusMeters}m)</span>}
            {exam.negativeMarkingEnabled && <span className="badge bg-orange-100 text-orange-700 text-xs">➖ Negative Marking</span>}
          </div>
        </div>

        <div className="flex gap-1 flex-shrink-0">
          <button onClick={onEdit} title="Edit" className="p-2 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-blue-600">
            <Edit2 className="h-4 w-4" />
          </button>
          <button onClick={onDelete} title="Delete" className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
          <button onClick={onSecurity} title="Security Report" className="p-2 rounded-xl hover:bg-orange-50 text-slate-400 hover:text-orange-600">
            <ShieldAlert className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
        <button onClick={onPublish} className={`btn btn-sm ${exam.status === 'PUBLISHED' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
          {exam.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
        </button>
        <button onClick={onToggleAccess} className={`btn btn-sm ${exam.examAccessEnabled ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
          {exam.examAccessEnabled ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
          {exam.examAccessEnabled ? 'Access ON' : 'Access OFF'}
        </button>
        <button onClick={onUploadCsv} className="btn btn-sm btn-outline">
          <Upload className="h-3 w-3" /> Upload CSV
        </button>
        <button onClick={onSync} className="btn btn-sm btn-outline">
          <Users className="h-3 w-3" /> Sync Students
        </button>
      </div>

      {/* Release Controls */}
      <div className="border-t border-slate-100 pt-3 mt-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Manual Releases</p>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={onReleaseAdmit} disabled={busy} className={`btn btn-sm ${exam.admitCardReleased ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            <IdCard className="h-3 w-3" />
            {exam.admitCardReleased ? 'Admit ✓' : 'Admit Cards'}
          </button>
          <button onClick={onToggleAnswerKey} className={`btn btn-sm ${exam.answerKeyReleased ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-violet-600 text-white hover:bg-violet-700'}`}>
            {exam.answerKeyReleased ? 'Ans Key ✓' : 'Ans Key'}
          </button>
          <button onClick={onToggleResult} className={`btn btn-sm ${exam.resultReleased ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-600 text-white hover:bg-amber-700'}`}>
            {exam.resultReleased ? 'Result ✓' : 'Result'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----- Exam Form ----- */
function ExamForm({ form, setForm, classOptions, toggleClass, onSave, onCancel, busy, isEdit }: any) {
  function set(k: string, v: any) { setForm((p: any) => ({ ...p, [k]: v })); }

  return (
    <form onSubmit={onSave} className="space-y-5">
      {/* Basic Info */}
      <Section title="Basic Information" icon={<FileText className="h-4 w-4" />}>
        <div>
          <label className="label">Exam Title *</label>
          <input required className="input" value={form.title} onChange={(e) => set('title', e.target.value)} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="select" value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>
      </Section>

      {/* Target Classes — multi-select */}
      <Section title="Target Classes *" icon={<Users className="h-4 w-4" />}>
        <p className="text-xs text-slate-500 mb-2">Select one or more classes. Students from all selected classes will be assigned this exam.</p>
        {classOptions.length === 0 && (
          <p className="text-sm text-slate-400 italic">No classes found. Add classes from Classes menu first.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {classOptions.map((cls: string) => (
            <button
              key={cls}
              type="button"
              onClick={() => toggleClass(cls)}
              className={`btn btn-sm rounded-full ${form.targetClasses?.includes(cls)
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {form.targetClasses?.includes(cls) && '✓ '}{cls}
            </button>
          ))}
        </div>
        {form.targetClasses?.length > 0 && (
          <p className="text-xs text-emerald-600 mt-1">Selected: {form.targetClasses.join(', ')}</p>
        )}
      </Section>

      {/* Schedule */}
      <Section title="Schedule" icon={<Calendar className="h-4 w-4" />}>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Date *</label>
            <input type="date" required className="input" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </div>
          <div>
            <label className="label">Start Time *</label>
            <input type="time" required className="input" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} />
          </div>
          <div>
            <label className="label">End Time *</label>
            <input type="time" required className="input" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Duration (minutes) *</label>
            <input type="number" required min="1" className="input" value={form.duration} onChange={(e) => set('duration', e.target.value)} />
          </div>
          <div>
            <label className="label">Total Questions *</label>
            <input type="number" required min="1" className="input" value={form.totalQuestions} onChange={(e) => set('totalQuestions', e.target.value)} />
          </div>
        </div>
      </Section>

      {/* Shift Config */}
      <Section title="Shift Configuration" icon={<Clock className="h-4 w-4" />}>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Students Per Shift</label>
            <input type="number" min="1" className="input" value={form.studentsPerShift} onChange={(e) => set('studentsPerShift', e.target.value)} />
            <p className="text-xs text-slate-500 mt-1">Students auto-grouped in shifts when admit cards released. 3 shifts/day, then rolls to next day.</p>
          </div>
          <div>
            <label className="label">Default Shift Name</label>
            <input className="input" value={form.shiftName} onChange={(e) => set('shiftName', e.target.value)} />
          </div>
        </div>
      </Section>

      {/* Marking */}
      <Section title="Marking Scheme" icon={<CheckCircle className="h-4 w-4" />}>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.negativeMarkingEnabled} onChange={(e) => set('negativeMarkingEnabled', e.target.checked)} className="w-4 h-4" />
          Enable negative marking
        </label>
        {form.negativeMarkingEnabled && (
          <div>
            <label className="label">Negative marks per wrong answer</label>
            <input type="number" step="0.01" min="0" className="input" value={form.negativeMarksPerQuestion} onChange={(e) => set('negativeMarksPerQuestion', e.target.value)} />
          </div>
        )}
      </Section>

      {/* Center & Geo */}
      <Section title="Center & Geo (optional)" icon={<Settings2 className="h-4 w-4" />}>
        <div>
          <label className="label">Exam Center</label>
          <input className="input" value={form.examCenter} onChange={(e) => set('examCenter', e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div><label className="label">Latitude</label><input className="input" value={form.centerLatitude} onChange={(e) => set('centerLatitude', e.target.value)} /></div>
          <div><label className="label">Longitude</label><input className="input" value={form.centerLongitude} onChange={(e) => set('centerLongitude', e.target.value)} /></div>
          <div><label className="label">Radius (m)</label><input type="number" className="input" value={form.allowedRadiusMeters} onChange={(e) => set('allowedRadiusMeters', e.target.value)} /></div>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.geoCheckEnabled} onChange={(e) => set('geoCheckEnabled', e.target.checked)} className="w-4 h-4" />
          Require students to be inside center radius to start exam
        </label>
      </Section>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn btn-outline flex-1">Cancel</button>
        <button type="submit" disabled={busy} className="btn btn-primary flex-1">
          {busy ? 'Saving…' : isEdit ? 'Update Exam' : 'Create Exam'}
        </button>
      </div>
    </form>
  );
}

function Section({ title, icon, children }: any) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40">
      <div className="font-semibold text-sm text-slate-700 mb-3 flex items-center gap-2">{icon} {title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Modal({ children, onClose, title, wide }: any) {
  return (
    <div className="modal-overlay">
      <div
        className={`modal-content ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
