'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import API from '@/lib/api';
import Guard from '@/components/Guard';
import { cn } from '@/lib/utils';
import {
  Clock, AlertTriangle, Send, ChevronLeft, ChevronRight,
  Flag, Shield, ShieldAlert, Lock, Monitor, Eye, Play,
} from 'lucide-react';

export default function ExamPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [reviews, setReviews] = useState<Record<number, boolean>>({});
  const [err, setErr] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [current, setCurrent] = useState(0);
  const [tabWarnings, setTabWarnings] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');
  const [examStarted, setExamStarted] = useState(false);
  const [showFsOverlay, setShowFsOverlay] = useState(false);
  const [disqualified, setDisqualified] = useState(false);
  const attemptIdRef = useRef<number | null>(null);
  const submittedRef = useRef(false);

  /* ---- Load Exam Data ---- */
  useEffect(() => {
    API.post(`/exams/${id}/start`)
      .then((res) => {
        setData(res.data);
        setTimeLeft((res.data.exam.duration || 60) * 60);
        attemptIdRef.current = res.data.attemptId;
      })
      .catch((e) => setErr(e.response?.data?.message || 'Exam not available'));
  }, [id]);

  /* ---- Timer (only after user clicks Enter Exam) ---- */
  useEffect(() => {
    if (!examStarted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          submitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [examStarted]);

  /* ---- Go Fullscreen (safe — only call from user gesture) ---- */
  function goFullscreen() {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      }
    } catch {}
  }

  /* ---- Enter Exam Button Click ---- */
  function handleEnterExam() {
    goFullscreen();
    setExamStarted(true);
    setShowFsOverlay(false);
  }

  /* ---- Lockdown (only after examStarted) ---- */
  useEffect(() => {
    if (!examStarted) return;

    // Prevent right-click
    const preventContext = (e: Event) => {
      e.preventDefault();
      showSecurityWarning('Right-click is disabled during exam');
    };
    document.addEventListener('contextmenu', preventContext);

    // Prevent keyboard shortcuts
    const preventKeys = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && ['t', 'w', 'n', 'r', 'l', 'u', 'p', 'j'].includes(e.key.toLowerCase())) ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) ||
        e.key === 'F5' || e.key === 'F11' || e.key === 'F12' ||
        (e.altKey && e.key === 'F4') ||
        (e.altKey && e.key === 'Tab') ||
        e.key === 'Escape'
      ) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityWarning('Keyboard shortcuts are disabled during exam');
      }
    };
    document.addEventListener('keydown', preventKeys, true);

    // Report security event and check for disqualification
    async function reportViolation() {
      if (!attemptIdRef.current || submittedRef.current) return;
      try {
        const { data } = await API.post('/exams/security-event', {
          attemptId: attemptIdRef.current,
          type: 'TAB_SWITCH',
        });
        setTabWarnings(data.tabSwitchCount);
        if (data.disqualified) {
          setDisqualified(true);
          submittedRef.current = true;
          if (document.fullscreenElement) {
            document.exitFullscreen?.().catch(() => {});
          }
        } else {
          showSecurityWarning(`⚠️ Warning ${data.tabSwitchCount}/3! ${data.remainingWarnings} more = EXAM TERMINATED.`);
        }
      } catch {}
    }

    // Tab switch detection
    const handleVisibility = () => {
      if (document.hidden && attemptIdRef.current && !submittedRef.current) {
        reportViolation();
      }
    };

    const handleBlur = () => {
      if (attemptIdRef.current && !submittedRef.current) {
        reportViolation();
      }
    };

    // Fullscreen exit detection — show overlay to re-enter
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !submittedRef.current) {
        setShowFsOverlay(true);
        reportViolation();
      } else {
        setShowFsOverlay(false);
      }
    };

    const preventCopyCut = (e: Event) => {
      e.preventDefault();
      showSecurityWarning('Copy/Paste is disabled during exam');
    };
    const preventSelect = (e: Event) => e.preventDefault();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', preventCopyCut);
    document.addEventListener('paste', preventCopyCut);
    document.addEventListener('cut', preventCopyCut);
    document.addEventListener('selectstart', preventSelect);

    // Prevent back button
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      showSecurityWarning('Back navigation is disabled during exam');
    };
    window.addEventListener('popstate', handlePopState);

    // Disable print
    const style = document.createElement('style');
    style.textContent = '@media print { body { display: none !important; } }';
    document.head.appendChild(style);

    return () => {
      document.removeEventListener('contextmenu', preventContext);
      document.removeEventListener('keydown', preventKeys, true);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', preventCopyCut);
      document.removeEventListener('paste', preventCopyCut);
      document.removeEventListener('cut', preventCopyCut);
      document.removeEventListener('selectstart', preventSelect);
      window.removeEventListener('popstate', handlePopState);
      if (style.parentNode) document.head.removeChild(style);
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
  }, [examStarted]);

  /* ---- Show Security Warning ---- */
  function showSecurityWarning(msg: string) {
    setWarningMsg(msg);
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 4000);
  }

  /* ---- Select Answer ---- */
  const selectAnswer = useCallback(async (questionId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    if (attemptIdRef.current) {
      await API.post('/exams/answers/save', {
        attemptId: attemptIdRef.current,
        questionId,
        selectedAnswer: answer,
      }).catch(() => {});
    }
  }, []);

  /* ---- Toggle Review ---- */
  const toggleReview = useCallback((questionId: number) => {
    setReviews((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  }, []);

  /* ---- Submit ---- */
  const submitExam = useCallback(async (auto = false) => {
    if (!attemptIdRef.current || submittedRef.current) return;
    submittedRef.current = true;

    const answerArray = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
      questionId: Number(questionId),
      selectedAnswer,
    }));

    try {
      await API.post('/exams/submit', {
        attemptId: attemptIdRef.current,
        answers: answerArray,
        auto,
      });
    } catch {}

    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }

    router.push('/dashboard');
  }, [answers, router]);

  /* ---- Error Screen ---- */
  if (err) {
    return (
      <Guard role="STUDENT">
        <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
          <div className="card p-8 max-w-md text-center animate-scale-in">
            <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-7 w-7 text-red-600" />
            </div>
            <h1 className="text-xl font-black text-red-600">Exam Not Available</h1>
            <p className="text-slate-600 mt-2">{err}</p>
            <button onClick={() => router.push('/dashboard')} className="btn btn-secondary mt-6">
              Back to Dashboard
            </button>
          </div>
        </main>
      </Guard>
    );
  }

  /* ---- Loading ---- */
  if (!data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg font-semibold text-white mt-4 flex items-center gap-2 justify-center">
            <Shield className="h-5 w-5 text-blue-500" />
            Loading exam...
          </p>
        </div>
      </div>
    );
  }

  /* ---- Disqualified Screen ---- */
  if (disqualified) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center animate-scale-in">
          <div className="h-20 w-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6 border-4 border-red-500">
            <ShieldAlert className="h-10 w-10 text-red-400 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">❌ EXAM TERMINATED</h1>
          <p className="text-red-300 text-lg mb-2">Your exam has been terminated due to security violations.</p>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-red-500/30">
            <p className="text-slate-300 text-sm">You switched tabs <span className="text-red-400 font-bold text-xl">{tabWarnings}</span> times.</p>
            <p className="text-slate-400 text-sm mt-2">Maximum allowed: <span className="font-bold text-white">3</span></p>
            <p className="text-red-400 font-bold mt-4">Admin has been notified about this violation.</p>
          </div>
          <p className="text-slate-500 text-sm mb-6">
            Contact admin to re-enable your exam access if this was a mistake.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-4 bg-white/10 text-white font-bold text-lg rounded-2xl border border-white/20 hover:bg-white/20 transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </main>
    );
  }

  /* ---- "Enter Exam" Screen (user must click to start + go fullscreen) ---- */
  if (!examStarted) {
    return (
      <Guard role="STUDENT">
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-lg w-full text-center animate-scale-in">
            {/* Shield Icon */}
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-600/30">
              <Shield className="h-10 w-10 text-white" />
            </div>

            <h1 className="text-3xl font-black text-white mb-2">{data.exam.title}</h1>
            <p className="text-slate-400 mb-8">Secure Exam Mode</p>

            {/* Exam Info */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/10 text-left">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">Duration</span><p className="text-white font-bold">{data.exam.duration} minutes</p></div>
                <div><span className="text-slate-500">Questions</span><p className="text-white font-bold">{data.exam.totalQuestions}</p></div>
                <div><span className="text-slate-500">Negative Marking</span><p className="text-white font-bold">{data.exam.negativeMarkingEnabled ? `Yes (-${data.exam.negativeMarksPerQuestion})` : 'No'}</p></div>
                <div><span className="text-slate-500">Time Left</span><p className="text-blue-500 font-bold">{Math.floor(timeLeft / 60)} min {timeLeft % 60}s</p></div>
              </div>
            </div>

            {/* Rules */}
            <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl p-5 mb-8 border border-red-500/20 text-left">
              <h3 className="text-red-400 font-bold text-sm mb-3 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> Exam Rules
              </h3>
              <ul className="text-sm text-slate-400 space-y-1.5">
                <li>🔒 Exam will open in <strong className="text-white">full-screen mode</strong></li>
                <li>⚠️ Tab switching will be <strong className="text-white">detected & reported</strong> to admin</li>
                <li>🚫 Right-click, copy, paste and keyboard shortcuts are <strong className="text-white">disabled</strong></li>
                <li>⏰ Exam will <strong className="text-white">auto-submit</strong> when time ends</li>
                <li>🔙 You <strong className="text-white">cannot go back</strong> once you start</li>
              </ul>
            </div>

            {/* Enter Button */}
            <button
              onClick={handleEnterExam}
              className="w-full py-4 px-8 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-600/30 transition-all duration-300 flex items-center justify-center gap-3 hover:scale-[1.02]"
            >
              <Play className="h-6 w-6" />
              Enter Secure Exam
            </button>

            <p className="text-xs text-slate-600 mt-4">
              Clicking this will activate full-screen lockdown mode
            </p>
          </div>
        </main>
      </Guard>
    );
  }

  const questions = data.questions || [];
  const currentQ = questions[current];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const answeredCount = Object.keys(answers).length;
  const reviewCount = Object.values(reviews).filter(Boolean).length;

  return (
    <Guard role="STUDENT">
      <main className="exam-lock min-h-screen bg-slate-50 select-none" style={{ userSelect: 'none' }}>

        {/* ---- Fullscreen Exit Overlay ---- */}
        {showFsOverlay && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
            <div className="text-center max-w-md animate-scale-in">
              <div className="h-20 w-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="h-10 w-10 text-red-500 animate-pulse" />
              </div>
              <h1 className="text-2xl font-black text-white mb-3">⚠️ Fullscreen Required!</h1>
              <p className="text-slate-400 mb-2">You exited fullscreen mode. This has been reported to admin.</p>
              <p className="text-red-400 font-bold mb-6">Violations: {tabWarnings}</p>
              <button
                onClick={() => { goFullscreen(); setShowFsOverlay(false); }}
                className="w-full py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-lg rounded-2xl shadow-lg hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center gap-2"
              >
                <Monitor className="h-5 w-5" />
                Return to Fullscreen
              </button>
            </div>
          </div>
        )}

        {/* ---- Security Warning Banner ---- */}
        {showWarning && (
          <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
            <div className="bg-red-600 text-white px-4 py-3 text-center font-bold flex items-center justify-center gap-2 shadow-xl">
              <ShieldAlert className="h-5 w-5 animate-pulse" />
              {warningMsg}
            </div>
          </div>
        )}

        {/* ---- Security Lock Bar ---- */}
        <div className="bg-slate-900 text-white px-4 py-1.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-blue-500" />
            <span className="font-medium">🔒 SECURE EXAM MODE</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> Monitored</span>
            {tabWarnings > 0 && (
              <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">
                ⚠ {tabWarnings} violations
              </span>
            )}
          </div>
        </div>

        {/* ---- Top Bar ---- */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <h1 className="font-bold text-slate-800 flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                {data.exam.title}
              </h1>
              <p className="text-xs text-slate-500">
                {answeredCount}/{questions.length} answered
                {reviewCount > 0 && <span className="text-blue-500 ml-2">• {reviewCount} review</span>}
                {tabWarnings > 0 && <span className="text-red-500 ml-2 font-bold">⚠ {tabWarnings} warnings</span>}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-lg',
                timeLeft <= 300 ? 'bg-red-100 text-red-700 animate-pulse' :
                timeLeft <= 600 ? 'bg-blue-100 text-blue-700' :
                'bg-slate-100 text-slate-700'
              )}>
                <Clock className="h-5 w-5" />
                {minutes}:{String(seconds).padStart(2, '0')}
              </div>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to submit?')) submitExam(false);
                }}
                className="btn btn-primary"
              >
                <Send className="h-4 w-4" /> Submit
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 md:p-8 grid lg:grid-cols-[1fr_280px] gap-6">
          {/* ---- Question Panel ---- */}
          <div>
            {currentQ && (
              <div className="card p-6 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-700">
                    Question {current + 1} of {questions.length}
                  </h2>
                  <button
                    onClick={() => toggleReview(currentQ.id)}
                    className={cn('btn btn-sm', reviews[currentQ.id] ? 'bg-blue-100 text-blue-700' : 'btn-ghost')}
                  >
                    <Flag className="h-3.5 w-3.5" /> {reviews[currentQ.id] ? 'Marked' : 'Review'}
                  </button>
                </div>
                <p className="text-lg text-slate-800 font-medium mb-6">{currentQ.question}</p>
                <div className="grid gap-3">
                  {['A', 'B', 'C', 'D'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => selectAnswer(currentQ.id, opt)}
                      className={cn(
                        'text-left p-4 rounded-xl border-2 transition-all duration-200 font-medium',
                        answers[currentQ.id] === opt
                          ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-blue-50/30'
                      )}
                    >
                      <span className={cn(
                        'inline-flex items-center justify-center h-7 w-7 rounded-full text-sm font-bold mr-3',
                        answers[currentQ.id] === opt ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      )}>{opt}</span>
                      {currentQ[`option${opt}`]}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                  <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0} className="btn btn-outline">
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>
                  <span className="text-sm text-slate-400">{current + 1}/{questions.length}</span>
                  <button onClick={() => setCurrent(Math.min(questions.length - 1, current + 1))} disabled={current === questions.length - 1} className="btn btn-primary">
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ---- Question Navigator ---- */}
          <div className="card p-5 h-fit sticky top-20">
            <h3 className="font-bold text-sm text-slate-700 mb-3">Navigator</h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q: any, i: number) => (
                <button
                  key={q.id}
                  onClick={() => setCurrent(i)}
                  className={cn(
                    'h-10 w-10 rounded-xl text-sm font-bold transition-all',
                    i === current ? 'bg-blue-500 text-white shadow-md' :
                    answers[q.id] ? 'bg-emerald-100 text-emerald-700' :
                    reviews[q.id] ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  )}
                >{i + 1}</button>
              ))}
            </div>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center gap-2"><div className="h-4 w-4 rounded bg-blue-500" /> Current</div>
              <div className="flex items-center gap-2"><div className="h-4 w-4 rounded bg-emerald-100" /> Answered ({answeredCount})</div>
              <div className="flex items-center gap-2"><div className="h-4 w-4 rounded bg-blue-100" /> Review ({reviewCount})</div>
              <div className="flex items-center gap-2"><div className="h-4 w-4 rounded bg-slate-100" /> Unanswered ({questions.length - answeredCount})</div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-1 text-xs text-slate-500">
              <p>Duration: {data.exam.duration} min</p>
              {data.exam.negativeMarkingEnabled && (
                <p className="text-red-500">⚠ Negative: -{data.exam.negativeMarksPerQuestion}</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </Guard>
  );
}
