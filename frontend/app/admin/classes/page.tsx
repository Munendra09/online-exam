'use client';

import { useEffect, useState } from 'react';
import API from '@/lib/api';
import Guard from '@/components/Guard';
import Shell from '@/components/Shell';
import { Plus, Edit2, Trash2, X, CheckCircle, AlertCircle, GraduationCap, Users } from 'lucide-react';

interface ClassInfo {
  name: string;
  minAge: number;
  maxAge: number;
}

export default function AdminClasses() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', minAge: '0', maxAge: '100' });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});

  function load() {
    API.get('/classes').then((r) => setClasses(r.data.classes)).catch(() => {});
    // Load student count per class
    API.get('/admin/filter-options').then((r) => {
      // Load class distribution from dashboard
      API.get('/admin/dashboard').then((d) => {
        const counts: Record<string, number> = {};
        d.data.classDistribution?.forEach((c: any) => {
          counts[c.className] = Number(c.dataValues?.count || c.count || 0);
        });
        setStudentCounts(counts);
      }).catch(() => {});
    }).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  function showMsg(text: string, type: 'success' | 'error' = 'success') {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await API.put(`/classes/${encodeURIComponent(editing)}`, {
          newName: form.name,
          minAge: Number(form.minAge),
          maxAge: Number(form.maxAge),
        });
        showMsg(`Class "${form.name}" updated`);
      } else {
        await API.post('/classes', {
          name: form.name,
          minAge: Number(form.minAge),
          maxAge: Number(form.maxAge),
        });
        showMsg(`Class "${form.name}" added`);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', minAge: '0', maxAge: '100' });
      load();
    } catch (err: any) {
      showMsg(err.response?.data?.message || 'Failed to save class', 'error');
    }
  }

  async function deleteClass(name: string) {
    if (!confirm(`Delete class "${name}"? Students in this class won't be removed, but it won't appear in dropdowns.`)) return;
    try {
      await API.delete(`/classes/${encodeURIComponent(name)}`);
      showMsg(`Class "${name}" removed`);
      load();
    } catch (err: any) {
      showMsg(err.response?.data?.message || 'Failed to delete class', 'error');
    }
  }

  function startEdit(cls: ClassInfo) {
    setEditing(cls.name);
    setForm({ name: cls.name, minAge: String(cls.minAge), maxAge: String(cls.maxAge) });
    setShowForm(true);
  }

  function startAdd() {
    setEditing(null);
    setForm({ name: '', minAge: '15', maxAge: '40' });
    setShowForm(true);
  }

  return (
    <Guard role="ADMIN">
      <Shell>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Class Management</h1>
            <p className="text-sm text-slate-500 mt-1">
              {classes.length} classes configured — Add, edit, or remove classes dynamically
            </p>
          </div>
          <button onClick={startAdd} className="btn btn-primary">
            <Plus className="h-4 w-4" /> Add Class
          </button>
        </div>

        {message && (
          <div className={`p-3 rounded-xl text-sm mb-4 flex items-center gap-2 animate-slide-down ${
            messageType === 'success'
              ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
              : 'bg-red-50 border border-red-100 text-red-700'
          }`}>
            {messageType === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {message}
          </div>
        )}

        {/* Classes Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div key={cls.name} className="card p-5 animate-fade-in hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{cls.name}</h3>
                    <p className="text-xs text-slate-400">Class / Course</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(cls)} className="btn btn-ghost btn-sm" title="Edit">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteClass(cls.name)} className="btn btn-ghost btn-sm text-red-500" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                  <span className="text-xs text-blue-700 font-medium">Age Range</span>
                  <span className="text-sm font-bold text-blue-800">{cls.minAge} — {cls.maxAge} years</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Users className="h-3 w-3" /> Students
                  </span>
                  <span className="text-sm font-bold text-slate-700">{studentCounts[cls.name] || 0}</span>
                </div>
              </div>
            </div>
          ))}

          {classes.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 card p-12 text-center text-slate-400">
              No classes configured. Click &quot;Add Class&quot; to get started.
            </div>
          )}
        </div>

        {/* Add/Edit Class Modal */}
        {showForm && (
          <div className="modal-overlay">
            <div className="modal-content p-6 max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{editing ? 'Edit Class' : 'Add New Class'}</h2>
                <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-icon"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Class / Course Name *</label>
                  <input
                    className="input"
                    placeholder="e.g. BCA, 10th, Web Development"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Minimum Age</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      max="100"
                      value={form.minAge}
                      onChange={(e) => setForm({ ...form, minAge: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Maximum Age</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      max="100"
                      value={form.maxAge}
                      onChange={(e) => setForm({ ...form, maxAge: e.target.value })}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  💡 Age limits are validated during student registration. Students outside the age range cannot register for this class.
                </p>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">Cancel</button>
                  <button className="btn btn-primary">{editing ? 'Update' : 'Add'} Class</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Shell>
    </Guard>
  );
}
