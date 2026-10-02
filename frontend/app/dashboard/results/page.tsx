'use client';

import { useEffect, useState } from 'react';
import API, { getUser } from '@/lib/api';
import Guard from '@/components/Guard';
import Shell from '@/components/Shell';
import { formatDate } from '@/lib/utils';
import { Trophy, Download, CheckCircle, XCircle, MinusCircle, Award, Calendar, FileText } from 'lucide-react';

const GC: Record<string, string> = {
  A: '#10b981',
  B: '#3b82f6',
  C: '#f59e0b',
  D: '#ef4444',
};

export default function StudentResults() {
  const [results, setResults] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getUser());
    
    // Fetch fresh user profile to resolve fatherName, mobile, city, etc.
    API.get('/auth/me')
      .then((r) => {
        if (r.data.user) {
          setUser(r.data.user);
          localStorage.setItem('lta_user', JSON.stringify(r.data.user));
        }
      })
      .catch(() => {});

    API.get('/results/me')
      .then((r) => {
        setResults(r.data.results || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  function downloadResult(r: any) {
    const w = window.open('', '_blank');
    if (!w) return;

    w.document.write(`
      <html>
        <head>
          <title>Result Card - ${r.Exam?.title}</title>
          <style>
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              color: #1e293b;
              position: relative;
              min-height: 90vh;
            }
            .card-container {
              position: relative;
              border: 2px solid #cbd5e1;
              border-radius: 16px;
              padding: 30px;
              background: #ffffff;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
              overflow: hidden;
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-15deg);
              width: 350px;
              height: auto;
              opacity: 0.08;
              pointer-events: none;
              z-index: 1;
              user-select: none;
            }
            .student-info, .grade-section, .grid-stats {
              position: relative;
              z-index: 5;
            }
            .header {
              text-align: center;
              border-bottom: 3px double #3b82f6;
              padding-bottom: 15px;
              margin-bottom: 30px;
            }
            .header img.logo {
              height: 70px;
              width: auto;
              object-fit: contain;
              margin-bottom: 8px;
            }
            .header h1 {
              margin: 0;
              color: #1e3a8a;
              font-size: 28px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .header p {
              margin: 5px 0 0 0;
              color: #64748b;
              font-size: 14px;
              font-weight: 600;
            }
            .report-title {
              text-align: center;
              font-size: 20px;
              font-weight: 800;
              color: #1e293b;
              letter-spacing: 2px;
              margin-bottom: 25px;
              text-transform: uppercase;
            }
            .student-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 30px;
              border-bottom: 1px dashed #e2e8f0;
              padding-bottom: 20px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              font-size: 14px;
            }
            .info-label {
              color: #64748b;
              font-weight: 600;
            }
            .info-value {
              font-weight: 700;
              color: #0f172a;
            }
            .grade-section {
              text-align: center;
              margin-bottom: 30px;
            }
            .grade-badge {
              display: inline-block;
              font-size: 48px;
              font-weight: 900;
              padding: 10px 40px;
              border-radius: 20px;
              text-transform: uppercase;
            }
            .grade-A { color: #059669; background: #ecfdf5; border: 2px solid #a7f3d0; }
            .grade-B { color: #2563eb; background: #eff6ff; border: 2px solid #bfdbfe; }
            .grade-C { color: #d97706; background: #fffbeb; border: 2px solid #fde68a; }
            .grade-D { color: #dc2626; background: #fef2f2; border: 2px solid #fecaca; }
            
            .grid-stats {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-bottom: 30px;
            }
            .stat-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 15px;
              text-align: center;
            }
            .stat-label {
              font-size: 11px;
              text-transform: uppercase;
              color: #64748b;
              font-weight: 700;
              margin-bottom: 5px;
            }
            .stat-value {
              font-size: 20px;
              font-weight: 800;
              color: #0f172a;
            }
            .stat-success { color: #059669; }
            .stat-danger { color: #dc2626; }
            
            .footer {
              text-align: center;
              margin-top: 40px;
              color: #94a3b8;
              font-size: 11px;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/logo.webp" alt="Lucky Tech Academy Logo" class="logo" />
            <h1>Lucky Tech Academy</h1>
            <p>Empowering Minds, Shaping Futures</p>
          </div>

          <div class="report-title">Official Performance Report</div>

          <div class="card-container">
            <img src="/logo.webp" class="watermark" alt="Watermark Logo" />
            <div class="student-info">
              <div class="info-row">
                <span class="info-label">Student Name:</span>
                <span class="info-value">${user?.name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Registration ID:</span>
                <span class="info-value">${user?.registrationId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Class / Grade:</span>
                <span class="info-value">${user?.className}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Exam Name:</span>
                <span class="info-value">${r.Exam?.title || 'Exam'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Exam Date:</span>
                <span class="info-value">${formatDate(r.Exam?.date)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Total Questions:</span>
                <span class="info-value">${r.Exam?.totalQuestions || '-'}</span>
              </div>
            </div>

            <div class="grade-section">
              <div class="label" style="margin-bottom: 8px;">Final Awarded Grade</div>
              <div class="grade-badge grade-${r.grade}">Grade ${r.grade}</div>
            </div>

            <div class="grid-stats">
              <div class="stat-box">
                <div class="stat-label">Score Obtained</div>
                <div class="stat-value">${r.score}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Percentage</div>
                <div class="stat-value">${r.percentage}%</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Correct Answers</div>
                <div class="stat-value stat-success">${r.correctCount}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Wrong Answers</div>
                <div class="stat-value stat-danger">${r.wrongCount}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Skipped Questions</div>
                <div class="stat-value">${r.unattemptedCount}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Result Status</div>
                <div class="stat-value" style="color: #2563eb; font-size: 16px; padding-top: 4px;">PASS ✓</div>
              </div>
            </div>
          </div>

          <div class="footer">
            Generated via Lucky Tech Academy Exam Portal • Verified Digital Document
          </div>

          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    w.document.close();
  }

  return (
    <Guard role="STUDENT">
      <Shell>
        <div className="w-full space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
              <Trophy className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">My Exam Results</h1>
              <p className="text-xs text-slate-500">View and print your official result sheets and grade sheets</p>
            </div>
          </div>

          {/* Results List */}
          <div className="card p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-400">Loading your results...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700 text-sm">No Results Available</h3>
                <p className="text-xs text-slate-400 mt-1">Once you complete exams and grades are published, they will appear here.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {results.map((r: any) => (
                  <div
                    key={r.id}
                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-bold text-slate-850 text-base">{r.Exam?.title}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Attempted on {formatDate(r.Exam?.date)}</p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-slate-400 block">Marks Scored</span>
                          <span className="font-bold text-slate-700 text-sm">{r.score}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Percentage</span>
                          <span className="font-bold text-blue-600 text-sm">{r.percentage}%</span>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-slate-400 block">Grade</span>
                          <span className="font-black text-sm" style={{ color: GC[r.grade] || '#2563eb' }}>
                            {r.grade}
                          </span>
                        </div>
                      </div>

                      {/* Mini Breakdown Indicators */}
                      <div className="flex flex-wrap gap-4 text-[11px] font-semibold">
                        <span className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle className="h-3.5 w-3.5" />
                          {r.correctCount} Correct
                        </span>
                        <span className="flex items-center gap-1 text-red-500">
                          <XCircle className="h-3.5 w-3.5" />
                          {r.wrongCount} Incorrect
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <MinusCircle className="h-3.5 w-3.5" />
                          {r.unattemptedCount} Skipped
                        </span>
                      </div>
                    </div>

                    {/* Grade Circle & Button */}
                    <div className="flex flex-row md:flex-col items-center justify-between md:justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 gap-4 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 md:hidden">Grade:</span>
                        <span
                          className={`h-11 w-11 rounded-full flex items-center justify-center text-lg font-black ${
                            r.grade === 'A' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                            r.grade === 'B' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                            r.grade === 'C' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                            'bg-red-100 text-red-700 border border-red-200'
                          }`}
                        >
                          {r.grade}
                        </span>
                      </div>
                      <button
                        onClick={() => downloadResult(r)}
                        className="btn btn-sm bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-1.5 text-xs py-2 px-3 border border-slate-200 rounded-xl"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Shell>
    </Guard>
  );
}
