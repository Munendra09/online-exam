'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import API, { getUser } from '@/lib/api';
import Guard from '@/components/Guard';
import Shell from '@/components/Shell';
import { KeyRound, ArrowLeft, CheckCircle, XCircle, Download } from 'lucide-react';

export default function AnswerKeyPage() {
  const { id } = useParams();
  const router = useRouter();
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/results/answer-key/${id}`)
      .then((r) => {
        setExam(r.data.exam);
        setQuestions(r.data.questions);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Answer key not available');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Only attempted questions
  const attempted = questions.filter(q => q.isAttempted);
  const correct = attempted.filter(q => q.isCorrect).length;
  const wrong = attempted.filter(q => !q.isCorrect).length;

  function downloadPDF() {
    const user = getUser();
    const w = window.open('', '_blank');
    if (!w) return;
    const rows = attempted.map((q: any, i: number) => `
      <div style="border:1px solid #e2e8f0;border-radius:8px;padding:15px;margin-bottom:12px;page-break-inside:avoid">
        <p style="font-weight:bold;margin-bottom:8px"><span style="background:${q.isCorrect ? '#ecfdf5' : '#fef2f2'};color:${q.isCorrect ? '#059669' : '#dc2626'};padding:2px 8px;border-radius:4px;margin-right:8px">${q.isCorrect ? '✓' : '✗'}</span>Q${i+1}. ${q.question}</p>
        ${['A','B','C','D'].map((opt: string) => {
          const isCorrect = q.correctAnswer === opt;
          const isStudent = q.studentAnswer === opt;
          const bg = isCorrect ? '#ecfdf5;border:1px solid #059669' : (isStudent && !isCorrect ? '#fef2f2;border:1px solid #dc2626' : '#f8fafc;border:1px solid #e2e8f0');
          return `<div style="padding:8px 12px;border-radius:6px;margin:4px 0;background:${bg}"><strong>${opt}.</strong> ${q['option'+opt]} ${isCorrect ? ' ✓ Correct' : ''} ${isStudent && !isCorrect ? ' ✗ Your Answer' : ''} ${isStudent && isCorrect ? ' ✓ Your Answer' : ''}</div>`;
        }).join('')}
      </div>
    `).join('');
    w.document.write(`<html><head><title>Answer Key - ${exam?.title}</title><style>body{font-family:Arial,sans-serif;padding:30px;max-width:800px;margin:0 auto}h1{color:#7c3aed;border-bottom:3px solid #7c3aed;padding-bottom:10px}.stats{display:flex;gap:20px;margin:15px 0}.stat{padding:12px 20px;border-radius:8px;text-align:center}.footer{text-align:center;color:#94a3b8;font-size:11px;margin-top:20px}</style></head><body>
    <h1>🔑 Answer Key</h1>
    <p><strong>${exam?.title}</strong></p>
    <p>Student: <strong>${user?.name}</strong> | Reg ID: <strong>${user?.registrationId}</strong></p>
    <div class="stats">
      <div class="stat" style="background:#ecfdf5"><strong style="font-size:24px;color:#059669">${correct}</strong><br><small>Correct</small></div>
      <div class="stat" style="background:#fef2f2"><strong style="font-size:24px;color:#dc2626">${wrong}</strong><br><small>Wrong</small></div>
      <div class="stat" style="background:#f8fafc"><strong style="font-size:24px;color:#334155">${attempted.length}</strong><br><small>Attempted</small></div>
    </div>
    ${rows}
    <div class="footer">Generated from Lucky Tech Academy Exam Portal</div>
    <script>setTimeout(()=>window.print(),500)</script></body></html>`);
    w.document.close();
  }

  if (loading) {
    return (
      <Guard role="STUDENT">
        <Shell>
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </Shell>
      </Guard>
    );
  }

  if (error) {
    return (
      <Guard role="STUDENT">
        <Shell>
          <div className="card p-10 text-center max-w-md mx-auto">
            <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <KeyRound className="h-7 w-7 text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Answer Key Not Available</h1>
            <p className="text-slate-500 mt-2">{error}</p>
            <button onClick={() => router.push('/dashboard')} className="btn btn-primary mt-6">
              Back to Dashboard
            </button>
          </div>
        </Shell>
      </Guard>
    );
  }

  return (
    <Guard role="STUDENT">
      <Shell>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push('/dashboard')} className="btn btn-ghost btn-sm">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <KeyRound className="h-6 w-6 text-purple-500" />
              Answer Key
            </h1>
            <p className="text-sm text-slate-500">{exam?.title} • {attempted.length} Attempted Questions</p>
          </div>
          <button onClick={downloadPDF} className="btn btn-sm bg-purple-100 text-purple-700 hover:bg-purple-200 ml-auto">
            <Download className="h-4 w-4" /> Download PDF
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card p-4 text-center bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
            <p className="text-2xl font-black text-emerald-700">{correct}</p>
            <p className="text-xs text-emerald-600 font-medium">✅ Correct</p>
          </div>
          <div className="card p-4 text-center bg-gradient-to-br from-red-50 to-pink-50 border border-red-200">
            <p className="text-2xl font-black text-red-700">{wrong}</p>
            <p className="text-xs text-red-600 font-medium">❌ Wrong</p>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {attempted.map((q, i) => (
            <div key={q.id} className={`card p-5 animate-fade-in border-l-4 ${
              q.isCorrect ? 'border-l-emerald-500' : 'border-l-red-500'
            }`}>
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <span className={`inline-flex items-center justify-center h-8 w-8 rounded-lg text-sm font-bold ${
                    q.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {i + 1}
                  </span>
                  {q.isCorrect ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-medium text-slate-800 mb-3">{q.question}</p>

                  {/* Options with highlight */}
                  <div className="grid gap-2">
                    {['A', 'B', 'C', 'D'].map((opt) => {
                      const isCorrectOpt = q.correctAnswer === opt;
                      const isStudentOpt = q.studentAnswer === opt;
                      const isWrongStudent = isStudentOpt && !isCorrectOpt;

                      let bgClass = 'bg-white border-slate-200 text-slate-600';
                      if (isCorrectOpt) {
                        bgClass = 'bg-emerald-50 border-emerald-400 text-emerald-800';
                      } else if (isWrongStudent) {
                        bgClass = 'bg-red-50 border-red-400 text-red-800';
                      }

                      return (
                        <div key={opt} className={`p-3 rounded-xl border-2 text-sm font-medium flex items-center gap-2 ${bgClass}`}>
                          <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                            isCorrectOpt ? 'bg-emerald-500 text-white' :
                            isWrongStudent ? 'bg-red-500 text-white' :
                            'bg-slate-100 text-slate-500'
                          }`}>{opt}</span>
                          <span className="flex-1">{q[`option${opt}`]}</span>
                          {isCorrectOpt && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">✓ Correct</span>}
                          {isWrongStudent && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">✗ Your Answer</span>}
                          {isStudentOpt && isCorrectOpt && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">✓ Your Answer</span>}
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>
      </Shell>
    </Guard>
  );
}
