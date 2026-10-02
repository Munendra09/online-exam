'use client';

import { useEffect, useState } from 'react';
import API, { getUser } from '@/lib/api';
import Guard from '@/components/Guard';
import Shell from '@/components/Shell';
import { formatDate } from '@/lib/utils';
import { CreditCard, Download, Clock, MapPin, Calendar, FileText } from 'lucide-react';

export default function StudentAdmitCards() {
  const [exams, setExams] = useState<any[]>([]);
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

    API.get('/exams')
      .then((r) => {
        setExams(r.data.exams || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  function downloadAdmitCard(exam: any) {
    const w = window.open('', '_blank');
    if (!w) return;

    w.document.write(`
      <html>
        <head>
          <title>Admit Card - ${exam.title}</title>
          <style>
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print { display: none; }
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
            .grid-info, .center-box, .instructions {
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
            .admit-title {
              text-align: center;
              font-size: 20px;
              font-weight: 800;
              color: #1e293b;
              letter-spacing: 2px;
              margin-bottom: 25px;
              text-transform: uppercase;
            }
            .grid-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 25px;
            }
            .info-item {
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 8px;
            }
            .label {
              font-size: 11px;
              text-transform: uppercase;
              color: #64748b;
              font-weight: 700;
              margin-bottom: 3px;
            }
            .value {
              font-size: 15px;
              font-weight: 700;
              color: #0f172a;
            }
            .center-box {
              background: #f0f7ff;
              border: 1px solid #bfdbfe;
              border-radius: 12px;
              padding: 20px;
              margin-bottom: 25px;
              text-align: center;
            }
            .center-box strong {
              display: block;
              color: #1e40af;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 6px;
            }
            .center-box span {
              font-size: 16px;
              font-weight: 800;
              color: #1e3a8a;
            }
            .instructions {
              background: #fffbeb;
              border: 1px solid #fef3c7;
              border-radius: 12px;
              padding: 20px;
              font-size: 13px;
              color: #78350f;
            }
            .instructions-title {
              font-weight: 800;
              margin-bottom: 8px;
              text-transform: uppercase;
              font-size: 12px;
              color: #92400e;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .instructions ul {
              margin: 0;
              padding-left: 20px;
            }
            .instructions li {
              margin-bottom: 6px;
            }
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

          <div class="admit-title">Official Admit Card</div>

          <div class="card-container">
            <img src="/logo.webp" class="watermark" alt="Watermark Logo" />
            <div class="grid-info">
              <div class="info-item">
                <div class="label">Student Name</div>
                <div class="value">${user?.name}</div>
              </div>
              <div class="info-item">
                <div class="label">Registration ID</div>
                <div class="value" style="color: #2563eb;">${user?.registrationId}</div>
              </div>
              <div class="info-item">
                <div class="label">Father's Name</div>
                <div class="value">${user?.fatherName || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="label">Class / Grade</div>
                <div class="value">${user?.className}</div>
              </div>
              <div class="info-item">
                <div class="label">Exam Name</div>
                <div class="value">${exam.title}</div>
              </div>
              <div class="info-item">
                <div class="label">Exam Date</div>
                <div class="value">${formatDate(exam.date)}</div>
              </div>
              <div class="info-item">
                <div class="label">Exam Time</div>
                <div class="value">${exam.startTime} - ${exam.endTime}</div>
              </div>
              <div class="info-item">
                <div class="label">Duration</div>
                <div class="value">${exam.duration} Minutes</div>
              </div>
            </div>

            <div class="center-box">
              <strong>📍 Exam Center Allocation</strong>
              <span>${exam.examCenter || 'Lucky Tech Academy Campus, Kasganj'}</span>
            </div>

            <div class="instructions">
              <div class="instructions-title">⚠️ Important Candidate Instructions</div>
              <ul>
                <li>It is mandatory to bring this printed Admit Card to the exam center.</li>
                <li>Please report to the examination hall at least 30 minutes before the scheduled time.</li>
                <li>Your Registration ID (${user?.registrationId}) will serve as your login credential for the portal.</li>
                <li>No calculators, smartwatches, mobile phones, or other electronic gadgets are allowed inside the exam hall.</li>
              </ul>
            </div>
          </div>

          <div class="footer">
            Generated via Lucky Tech Academy Exam Portal • For support, contact admin@luckytech.in
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

  const admitCardExams = exams.filter((e) => e.admitCardReleased);

  return (
    <Guard role="STUDENT">
      <Shell>
        <div className="w-full space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="h-10 w-10 rounded-xl bg-cyan-50 flex items-center justify-center border border-cyan-100">
              <CreditCard className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">My Admit Cards</h1>
              <p className="text-xs text-slate-500">Download admit cards for your scheduled scholarship exams</p>
            </div>
          </div>

          {/* List Card */}
          <div className="card p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-400">Loading admit cards...</p>
              </div>
            ) : admitCardExams.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700 text-sm">No Admit Cards Released</h3>
                <p className="text-xs text-slate-400 mt-1">When the admin releases your admit card, it will appear here.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {admitCardExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-gradient-to-r from-cyan-50/50 to-white rounded-2xl border border-cyan-100 hover:shadow-sm transition gap-4"
                  >
                    <div className="space-y-2">
                      <h3 className="font-bold text-slate-800 text-base">{exam.title}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {formatDate(exam.date)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {exam.startTime} - {exam.endTime}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {exam.examCenter}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadAdmitCard(exam)}
                      className="btn bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-600/10 flex items-center justify-center gap-2 self-start sm:self-center"
                    >
                      <Download className="h-4 w-4" />
                      Download Print PDF
                    </button>
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
