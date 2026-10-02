'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import API from '@/lib/api';
import Guard from '@/components/Guard';
import Shell from '@/components/Shell';
import { siteConfig } from '@/config/site';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Printer, ShieldCheck, QrCode, MapPin, Clock } from 'lucide-react';

function formatFullDate(date?: string) {
  if (!date) return '—';
  return new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}
function formatAMPM(time?: string) {
  if (!time) return '—';
  const [hour, minute] = String(time).split(':').map(Number);
  const d = new Date();
  d.setHours(hour || 0, minute || 0, 0, 0);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/* ─── Watermark ─── */
function AdmitWatermark() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center overflow-hidden z-0" aria-hidden>
      <img src="/logo.webp" alt="LTA Watermark" className="w-[320px] h-auto opacity-[0.06] rotate-[-15deg]" />
    </div>
  );
}

/* ─── Info Row Component ─── */
function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-dashed border-slate-200 last:border-0">
      <span className="text-slate-500 text-sm flex-shrink-0">{label}</span>
      <span className={`font-semibold text-right text-sm ${highlight ? 'text-blue-700 font-black' : 'text-slate-800'}`}>
        {value || '—'}
      </span>
    </div>
  );
}

export default function AdmitCardPage() {
  const { id }  = useParams();
  const router  = useRouter();
  const [card,  setCard]  = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get(`/admit-cards/${id}`)
      .then(r => setCard(r.data.admitCard))
      .catch(e => setError(e.response?.data?.message || 'Admit card not available'));
  }, [id]);

  if (error) return (
    <Guard role="STUDENT"><Shell>
      <div className="card p-8 text-center max-w-md mx-auto">
        <p className="text-slate-500">{error}</p>
        <button onClick={() => router.push('/dashboard')} className="btn btn-outline mt-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>
    </Shell></Guard>
  );

  if (!card) return (
    <Guard role="STUDENT"><Shell>
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </Shell></Guard>
  );

  const examDate = card.assignedDate || card.exam?.date;
  const shiftName = card.shiftName || card.exam?.shiftName || '—';
  const startTime = card.startTime  || card.exam?.startTime;
  const endTime   = card.endTime    || card.exam?.endTime;

  return (
    <Guard role="STUDENT">
      <Shell>
        {/* Top Controls */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <button onClick={() => router.push('/dashboard')} className="btn btn-ghost">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button onClick={() => window.print()} className="btn btn-primary">
            <Printer className="h-4 w-4" /> Print Admit Card
          </button>
        </div>

        {/* ── Admit Card ── */}
        <div id="admit-card" className="card max-w-3xl mx-auto overflow-hidden relative print:shadow-none print:border-2 print:border-blue-800">
          <AdmitWatermark />

          {/* ── Header Band ── */}
          <div className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-slate-800 text-white px-6 py-5 z-10">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-blue-600/20 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="relative flex items-center justify-between flex-wrap gap-4">
              {/* Logo & Name */}
              <div className="flex items-center gap-4">
                <div className="bg-white/10 rounded-xl p-1.5 backdrop-blur-sm">
                  <img src="/logo.webp" alt="LTA" className="h-14 w-auto object-contain" />
                </div>
                <div>
                  <h1 className="text-lg font-black leading-tight">{siteConfig.name}</h1>
                  <p className="text-blue-300 text-sm flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" /> {siteConfig.location}
                  </p>
                </div>
              </div>
              {/* Admit Card Label + Roll No */}
              <div className="text-right">
                <div className="inline-block bg-blue-500/30 border border-blue-400/40 rounded-lg px-3 py-1 mb-2">
                  <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">Admit Card</p>
                </div>
                <p className="text-2xl font-black text-white">{card.rollNumber}</p>
                <p className="text-blue-300 text-xs mt-0.5">Roll Number</p>
              </div>
            </div>
          </div>

          {/* ── Exam Title Banner ── */}
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 text-center relative z-10">
            <h2 className="text-base font-black text-blue-900">{card.exam?.title}</h2>
            <p className="text-xs text-blue-600 mt-0.5 flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" />
              {formatAMPM(startTime)} – {formatAMPM(endTime)} &nbsp;|&nbsp; {card.exam?.duration} minutes
            </p>
          </div>

          {/* ── Body ── */}
          <div className="relative p-6 z-10">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Student Details */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" /> Student Details
                </h3>
                <div className="space-y-0">
                  <InfoRow label="Student Name"    value={card.student?.name}           highlight />
                  <InfoRow label="Registration ID" value={card.student?.registrationId} highlight />
                  <InfoRow label="Father's Name"   value={card.student?.fatherName} />
                  <InfoRow label="Class / Course"  value={card.student?.className} />
                  <InfoRow label="Date of Birth"   value={card.student?.dob ? formatDate(card.student.dob) : '—'} />
                  <InfoRow label="Email"           value={card.student?.email} />
                  <InfoRow label="Mobile"          value={card.student?.mobile} />
                </div>
              </div>

              {/* Exam Details */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <QrCode className="h-3.5 w-3.5 text-blue-500" /> Exam Details
                </h3>
                <div className="space-y-0">
                  <InfoRow label="Exam Date"       value={formatFullDate(examDate)} />
                  <InfoRow label="Shift"           value={shiftName} />
                  <InfoRow label="Timing"          value={`${formatAMPM(startTime)} – ${formatAMPM(endTime)}`} />
                  <InfoRow label="Duration"        value={`${card.exam?.duration || '—'} minutes`} />
                  <InfoRow label="Total Questions" value={String(card.exam?.totalQuestions || '—')} />
                  <InfoRow label="Exam Center"     value={card.exam?.examCenter} />
                  <InfoRow label="Roll Number"     value={card.rollNumber} highlight />
                </div>
              </div>
            </div>

            {/* ── Instructions ── */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <h3 className="font-bold text-sm text-amber-800 mb-2 flex items-center gap-1.5">
                ⚠️ Important Instructions
              </h3>
              <ul className="text-xs text-amber-700 space-y-1.5 grid md:grid-cols-2 gap-x-4">
                {[
                  'Bring this admit card (printed or digital) to the exam center',
                  'Arrive at least 30 minutes before the exam starts',
                  'Carry a valid photo ID along with this admit card',
                  'Electronic devices (except exam device) are not allowed',
                  'Tab switching during the exam will be tracked & reported',
                  'Do not share your roll number or login credentials',
                ].map((inst, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-500 font-bold flex-shrink-0">•</span> {inst}
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Footer ── */}
            <div className="mt-5 pt-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400">
              <span className="font-medium text-slate-500">{siteConfig.fullName}</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-blue-400" />
                Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Print hint */}
        <p className="text-center text-xs text-slate-400 mt-4 print:hidden">
          Use the Print button above or Ctrl+P / Cmd+P to print / save as PDF
        </p>
      </Shell>
    </Guard>
  );
}
