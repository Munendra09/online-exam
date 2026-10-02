'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import API from '@/lib/api';
import Guard from '@/components/Guard';
import Shell from '@/components/Shell';
import { cn, formatDate } from '@/lib/utils';
import {
  Trophy, CheckCircle, XCircle, MinusCircle, ArrowLeft,
  Printer, Award, Star, BookOpen, Clock,
} from 'lucide-react';
import { siteConfig } from '@/config/site';

/* ─── Grade Config ─── */
const gradeConfig: Record<string, { color: string; bg: string; ring: string; label: string; emoji: string }> = {
  'A+': { color: 'text-emerald-700', bg: 'bg-emerald-500', ring: 'ring-emerald-200', label: 'Excellent', emoji: '🌟' },
  'A':  { color: 'text-emerald-700', bg: 'bg-emerald-500', ring: 'ring-emerald-200', label: 'Excellent', emoji: '⭐' },
  'B':  { color: 'text-blue-700',    bg: 'bg-blue-500',    ring: 'ring-blue-200',    label: 'Good',      emoji: '👍' },
  'C':  { color: 'text-yellow-700',  bg: 'bg-yellow-500',  ring: 'ring-yellow-200',  label: 'Average',   emoji: '📘' },
  'D':  { color: 'text-orange-700',  bg: 'bg-orange-500',  ring: 'ring-orange-200',  label: 'Below Avg', emoji: '📚' },
  'F':  { color: 'text-red-700',     bg: 'bg-red-500',     ring: 'ring-red-200',     label: 'Fail',      emoji: '❌' },
};

/* ─── Watermark SVG ─── */
function Watermark() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden" aria-hidden>
      <div className="relative w-full h-full flex items-center justify-center opacity-[0.04]">
        {/* Repeat diagonal pattern */}
        {Array.from({ length: 6 }).map((_, row) =>
          Array.from({ length: 4 }).map((_, col) => (
            <div key={`${row}-${col}`}
              className="absolute font-black text-slate-900 whitespace-nowrap"
              style={{
                top: `${row * 18 - 5}%`,
                left: `${col * 28 - 5}%`,
                transform: 'rotate(-35deg)',
                fontSize: '22px',
                letterSpacing: '0.05em',
              }}>
              LUCKY TECH ACADEMY
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─── Certificate Component (printable) ─── */
function ResultCertificate({ result, attempt, studentName }: { result: any; attempt: any; studentName: string }) {
  const grade = result.grade || 'F';
  const gc    = gradeConfig[grade] || gradeConfig['F'];
  const passed = !['D', 'F'].includes(grade);

  return (
    <div
      id="result-certificate"
      className="relative bg-white overflow-hidden print:shadow-none"
      style={{ minHeight: 480 }}
    >
      <Watermark />

      {/* ── Certificate Header ── */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white px-8 py-6">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-blue-600/20 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-blue-600/10 translate-y-1/2 -translate-x-1/4" />

        <div className="relative flex flex-wrap items-center justify-between gap-6">
          {/* Logo + Title */}
          <div className="flex items-center gap-4">
            <img src="/logo.webp" alt="LTA Logo" className="h-14 w-auto object-contain bg-white/10 rounded-lg p-1" />
            <div>
              <h1 className="text-xl font-black tracking-tight">{siteConfig.name}</h1>
              <p className="text-sm text-blue-300">{siteConfig.location}</p>
              <p className="text-xs text-slate-400 mt-0.5">RESULT CERTIFICATE</p>
            </div>
          </div>

          {/* Grade Circle */}
          <div className="flex flex-col items-center">
            <div className={`h-20 w-20 rounded-2xl ${gc.bg} flex items-center justify-center text-3xl font-black text-white shadow-lg ring-4 ring-white/20`}>
              {grade}
            </div>
            <p className="text-sm text-slate-300 mt-1.5">{gc.emoji} {gc.label}</p>
          </div>
        </div>
      </div>

      {/* ── Student + Exam Info ── */}
      <div className="relative px-8 py-6">
        {/* Result Summary Strip */}
        <div className={`mb-6 p-4 rounded-2xl border-2 ${passed ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'} flex flex-wrap items-center justify-between gap-4`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">Student</p>
            <p className="text-xl font-black text-slate-900">{studentName}</p>
            <p className="text-sm text-slate-500 mt-0.5">{result.Exam?.title}</p>
          </div>
          <div className={`text-center px-6 py-3 rounded-xl ${passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} font-black text-lg border ${passed ? 'border-emerald-200' : 'border-red-200'}`}>
            {passed ? '✅ PASSED' : '❌ FAILED'}
          </div>
        </div>

        {/* Score Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Score',  value: result.score,          icon: <Trophy      className="h-5 w-5 text-amber-500" />,   accent: 'border-amber-200   bg-amber-50' },
            { label: 'Percentage',   value: `${result.percentage}%`, icon: <Star      className="h-5 w-5 text-blue-500" />,    accent: 'border-blue-200    bg-blue-50' },
            { label: 'Correct',      value: result.correctCount,   icon: <CheckCircle className="h-5 w-5 text-emerald-500" />, accent: 'border-emerald-200 bg-emerald-50' },
            { label: 'Wrong',        value: result.wrongCount,     icon: <XCircle     className="h-5 w-5 text-red-500" />,    accent: 'border-red-200     bg-red-50' },
          ].map(item => (
            <div key={item.label} className={`rounded-xl border-2 ${item.accent} p-4 text-center`}>
              <div className="flex justify-center mb-1">{item.icon}</div>
              <p className="text-2xl font-black text-slate-800">{item.value}</p>
              <p className="text-xs text-slate-500 font-medium">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Exam Details */}
        <div className="grid md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          {[
            { label: 'Exam Date',       value: formatDate(result.Exam?.date) },
            { label: 'Total Questions', value: String(result.correctCount + result.wrongCount + (result.unattemptedCount || 0)) },
            { label: 'Unattempted',     value: String(result.unattemptedCount || 0) },
          ].map(item => (
            <div key={item.label} className="text-center">
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">{item.label}</p>
              <p className="text-base font-bold text-slate-800 mt-0.5">{item.value || '—'}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-200 pt-4">
          <span>{siteConfig.fullName}</span>
          <span>Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          <span>{siteConfig.phone}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function ResultPage() {
  const { id }   = useParams();
  const router   = useRouter();
  const [result,  setResult]   = useState<any>(null);
  const [attempt, setAttempt]  = useState<any>(null);
  const [error,   setError]    = useState('');
  const [tab,     setTab]      = useState<'certificate' | 'answers'>('certificate');

  useEffect(() => {
    API.get(`/results/${id}`)
      .then(r => { setResult(r.data.result); setAttempt(r.data.attempt); })
      .catch(e => setError(e.response?.data?.message || 'Result not available'));
  }, [id]);

  if (error) return (
    <Guard role="STUDENT"><Shell>
      <div className="card p-8 text-center max-w-md mx-auto">
        <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <p className="text-slate-700 font-semibold">{error}</p>
        <button onClick={() => router.push('/dashboard')} className="btn btn-outline mt-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>
    </Shell></Guard>
  );

  if (!result) return (
    <Guard role="STUDENT"><Shell>
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </Shell></Guard>
  );

  const studentName = result.User?.name || attempt?.User?.name || 'Student';

  return (
    <Guard role="STUDENT">
      <Shell>
        {/* ── Top Bar ── */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <button onClick={() => router.push('/dashboard')} className="btn btn-ghost">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setTab('certificate')}
              className={`btn btn-sm ${tab === 'certificate' ? 'btn-primary' : 'btn-outline'}`}>
              <Award className="h-4 w-4" /> Certificate
            </button>
            {attempt?.Answers?.length > 0 && (
              <button onClick={() => setTab('answers')}
                className={`btn btn-sm ${tab === 'answers' ? 'btn-primary' : 'btn-outline'}`}>
                <BookOpen className="h-4 w-4" /> Answer Sheet
              </button>
            )}
            <button onClick={() => window.print()} className="btn btn-sm btn-outline">
              <Printer className="h-4 w-4" /> Print
            </button>
          </div>
        </div>

        {/* ── Certificate Tab ── */}
        {tab === 'certificate' && (
          <div className="card overflow-hidden max-w-3xl mx-auto">
            <ResultCertificate result={result} attempt={attempt} studentName={studentName} />
          </div>
        )}

        {/* ── Answer Sheet Tab ── */}
        {tab === 'answers' && attempt?.Answers?.length > 0 && (
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-800">Answer Sheet</h2>
                <p className="text-sm text-slate-500">Compare your answers with the correct answers</p>
              </div>
              <div className="flex gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="h-3.5 w-3.5" /> Correct</span>
                <span className="flex items-center gap-1 text-red-600"><XCircle className="h-3.5 w-3.5" /> Wrong</span>
                <span className="flex items-center gap-1 text-slate-400"><MinusCircle className="h-3.5 w-3.5" /> Skipped</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th className="w-10">#</th>
                    <th>Question</th>
                    <th className="w-32">Your Answer</th>
                    <th className="w-32">Correct</th>
                    <th className="w-28">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attempt.Answers.map((a: any, i: number) => {
                    const isCorrect     = a.selectedAnswer === a.Question?.correctAnswer;
                    const isUnattempted = !a.selectedAnswer;
                    return (
                      <tr key={a.id} className={cn(
                        isUnattempted ? '' :
                        isCorrect ? 'bg-emerald-50/40' : 'bg-red-50/30'
                      )}>
                        <td className="text-slate-400 text-center">{i + 1}</td>
                        <td className="max-w-sm text-sm text-slate-700">{a.Question?.question}</td>
                        <td>
                          <span className={cn('badge font-bold',
                            isUnattempted ? 'bg-slate-100 text-slate-400' :
                            isCorrect     ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-red-100 text-red-700'
                          )}>
                            {a.selectedAnswer || '—'}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-emerald-100 text-emerald-700 font-bold">
                            {a.Question?.correctAnswer}
                          </span>
                        </td>
                        <td>
                          {isUnattempted ? (
                            <span className="flex items-center gap-1 text-sm text-slate-400">
                              <MinusCircle className="h-4 w-4" /> Skipped
                            </span>
                          ) : isCorrect ? (
                            <span className="flex items-center gap-1 text-sm text-emerald-600">
                              <CheckCircle className="h-4 w-4" /> Correct
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-sm text-red-600">
                              <XCircle className="h-4 w-4" /> Wrong
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Shell>
    </Guard>
  );
}
