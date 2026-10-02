'use client';

import { useEffect, useState } from 'react';
import API from '@/lib/api';
import Guard from '@/components/Guard';
import Shell from '@/components/Shell';
import { Save, Calendar, ToggleLeft, ToggleRight, Settings } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <Guard role="ADMIN">
      <Shell>
        <Inner />
      </Shell>
    </Guard>
  );
}

function Inner() {
  const [open, setOpen] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    API.get('/auth/registration-status').then((r) => {
      setOpen(!!r.data.registrationOpen);
      const d = r.data.deadline;
      if (d) {
        const dt = new Date(d);
        if (!isNaN(dt.getTime())) {
          const tz = dt.getTime() - dt.getTimezoneOffset() * 60000;
          setDeadline(new Date(tz).toISOString().slice(0, 16));
        }
      }
      setMessage(r.data.message || '');
    });
  }, []);

  async function save() {
    setBusy(true);
    try {
      const payload: any = { open, message };
      payload.deadline = deadline ? new Date(deadline).toISOString() : '';
      await API.post('/auth/toggle-registration', payload);
      setSaved('Settings saved ✓');
      setTimeout(() => setSaved(''), 2500);
    } catch (e: any) {
      setSaved(e.response?.data?.message || 'Save failed');
      setTimeout(() => setSaved(''), 3000);
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-600" /> Portal Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">Global registration control for all students</p>
      </div>

      <div className="card p-6 space-y-5">
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="font-semibold text-slate-800">Registration Status</div>
            <div className="text-xs text-slate-500 mt-0.5">Toggle student registration on / off globally</div>
          </div>
          <button onClick={() => setOpen(!open)} className="flex items-center gap-2">
            {open ? <ToggleRight className="h-9 w-9 text-emerald-600" /> : <ToggleLeft className="h-9 w-9 text-slate-300" />}
            <span className={`text-sm font-bold ${open ? 'text-emerald-700' : 'text-slate-400'}`}>{open ? 'OPEN' : 'CLOSED'}</span>
          </button>
        </div>

        <div>
          <label className="label flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-500" /> Global Registration Deadline</label>
          <input type="datetime-local" className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          <p className="text-xs text-slate-500 mt-1.5">Students cannot register after this deadline. Leave empty for no deadline.</p>
        </div>

        <div>
          <label className="label">Message when Registration is CLOSED</label>
          <textarea className="input resize-none" rows={3} value={message}
            placeholder="Registration is currently closed. Please wait for admin to open registration."
            onChange={(e) => setMessage(e.target.value)} />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={save} disabled={busy} className="btn btn-primary">
            <Save className="h-4 w-4" /> {busy ? 'Saving…' : 'Save Settings'}
          </button>
          {saved && <span className={`text-sm font-medium ${saved.includes('✓') ? 'text-emerald-600' : 'text-red-600'}`}>{saved}</span>}
        </div>
      </div>
    </div>
  );
}
