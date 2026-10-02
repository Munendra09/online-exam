'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import API, { saveSession, getUser } from '@/lib/api';
import { siteConfig } from '@/config/site';
import { Shield, GraduationCap, Monitor, Lock, LogOut, Play, Clock, MapPin, AlertTriangle, MapPinOff, Loader2 } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';

/* ---- Haversine distance (meters) ---- */
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ExamCenterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'checking' | 'blocked' | 'login' | 'dashboard'>('checking');
  const [regId, setRegId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);
  const [geoError, setGeoError] = useState('');

  // Get user location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      setStep('blocked');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLon(pos.coords.longitude);
        // Check if already logged in
        const u = getUser();
        if (u && u.role === 'STUDENT') {
          setUser(u);
          setStep('dashboard');
          loadExams();
        } else {
          setStep('login');
        }
      },
      (err) => {
        setGeoError(
          err.code === 1
            ? 'Location access denied. Please allow location access and reload this page.'
            : 'Unable to detect your location. Please enable GPS/Location.'
        );
        setStep('blocked');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  async function loadExams() {
    try {
      const { data } = await API.get('/exams');
      setExams(data.exams || []);
    } catch {}
  }

  /* Check if student is near exam center */
  function isNearCenter(exam: any): { near: boolean; distance: number } {
    if (!exam.geoCheckEnabled || !exam.centerLatitude || !exam.centerLongitude) {
      return { near: true, distance: 0 }; // geo check disabled for this exam
    }
    if (userLat === null || userLon === null) {
      return { near: false, distance: Infinity };
    }
    const dist = getDistanceMeters(userLat, userLon, Number(exam.centerLatitude), Number(exam.centerLongitude));
    return { near: dist <= Number(exam.allowedRadiusMeters || 500), distance: Math.round(dist) };
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await API.post('/auth/login', { email: regId, password });
      if (data.user.role !== 'STUDENT') {
        setError('Only students can access the exam center');
        setLoading(false);
        return;
      }
      saveSession(null, data.user); // Token is in HTTP-only cookie
      setUser(data.user);
      setStep('dashboard');
      loadExams();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try { await API.post('/auth/logout'); } catch {}
    localStorage.removeItem('lta_user');
    setUser(null);
    setStep('login');
    setExams([]);
  }

  function startExam(examId: number) {
    router.push(`/exam/${examId}`);
  }

  /* ---- CHECKING LOCATION ---- */
  if (step === 'checking') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center animate-scale-in">
          <div className="h-20 w-20 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-6">
            <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Detecting Location...</h1>
          <p className="text-slate-400">Please allow location access when prompted</p>
        </div>
      </main>
    );
  }

  /* ---- LOCATION BLOCKED ---- */
  if (step === 'blocked') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-red-900 via-slate-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center animate-scale-in">
          <div className="h-20 w-20 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-6 border-2 border-red-500/30">
            <MapPinOff className="h-10 w-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">Location Access Required</h1>
          <p className="text-red-300 mb-4">{geoError}</p>
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 text-left text-sm text-slate-400 space-y-2 mb-6">
            <p>This exam portal requires location access to verify you are at the authorized exam center.</p>
            <p>📍 Please:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Enable GPS/Location on your device</li>
              <li>Allow location permission in browser</li>
              <li>Reload this page</li>
            </ul>
          </div>
          <button onClick={() => window.location.reload()} className="w-full py-3 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition">
            Reload Page
          </button>
        </div>
      </main>
    );
  }

  /* ---- LOGIN SCREEN ---- */
  if (step === 'login') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-0 left-1/2 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-md w-full animate-scale-in">
          <div className="text-center mb-8">
            <img src="/logo.webp" alt="Lucky Tech Academy" className="h-20 w-auto object-contain mx-auto mb-4" />
            <h1 className="text-3xl font-black text-white">Exam Center</h1>
            <p className="text-slate-400 mt-1">{siteConfig.name}</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <MapPin className="h-3.5 w-3.5 text-green-400" />
              <span className="text-xs text-green-400 font-medium">Location Verified ✓</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-500" />
              Student Login
            </h2>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                {error}
              </div>
            )}

            <label className="block text-sm text-slate-400 mb-1.5">Registration ID or Email</label>
            <input
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-600 mb-4"
              value={regId}
              onChange={(e) => setRegId(e.target.value)}
              placeholder="e.g. LTA202600001"
              required
              autoFocus
            />

            <label className="block text-sm text-slate-400 mb-1.5">Password</label>
            <input
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-600 mb-6"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Logging in...
                </span>
              ) : (
                'Login to Exam'
              )}
            </button>
          </form>

          <p className="text-xs text-slate-600 text-center mt-6">
            This portal is restricted to authorized exam centers only.
          </p>
        </div>
      </main>
    );
  }

  /* ---- EXAM DASHBOARD ---- */
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      {/* Top Bar */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.webp" alt="Lucky Tech Academy" className="h-10 w-auto object-contain" />
            <div>
              <h1 className="text-xl font-bold text-white">Exam Center</h1>
              <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="h-3 w-3 text-green-400" /> Location Verified</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-blue-500 font-mono">{user?.registrationId}</p>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-lg bg-white/10 text-slate-400 hover:text-white hover:bg-white/20 transition">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Student Info */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-slate-500">Name</span><p className="text-white font-medium">{user?.name}</p></div>
            <div><span className="text-slate-500">Reg. ID</span><p className="text-blue-500 font-bold">{user?.registrationId}</p></div>
            <div><span className="text-slate-500">Class</span><p className="text-white font-medium">{user?.className}</p></div>
            <div><span className="text-slate-500">City</span><p className="text-white font-medium">{user?.city || 'N/A'}</p></div>
          </div>
        </div>
      </div>

      {/* Available Exams */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          Your Exams
        </h2>

        {exams.length === 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-12 border border-white/10 text-center">
            <AlertTriangle className="h-10 w-10 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No exams available</p>
            <p className="text-sm text-slate-600 mt-1">Wait for admin to enable exam access</p>
          </div>
        )}

        {exams.map((exam) => {
          const now = new Date();
          const examStart = new Date(`${exam.date}T${exam.startTime}`);
          const examEnd = new Date(`${exam.date}T${exam.endTime}`);
          const isLive = now >= examStart && now <= examEnd;
          const isPast = now > examEnd;
          const geo = isNearCenter(exam);

          return (
            <div key={exam.id} className={`bg-white/5 backdrop-blur-sm rounded-2xl p-6 border mb-4 transition-all ${geo.near ? 'border-white/10 hover:bg-white/10' : 'border-red-500/30 opacity-70'}`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="text-lg font-bold text-white">{exam.title}</h3>
                    {isLive && geo.near && <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold animate-pulse">🟢 LIVE</span>}
                    {isPast && <span className="px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 text-xs">Ended</span>}
                    {!geo.near && <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">📍 Not at Center</span>}
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatDate(exam.date)}</span>
                    <span>{formatTime(exam.startTime)} - {formatTime(exam.endTime)}</span>
                    <span>{exam.duration} min</span>
                    <span>{exam.totalQuestions} Q</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {exam.examCenter}</span>
                  </div>
                  {!geo.near && (
                    <p className="text-xs text-red-400 mt-2">
                      ⚠ You are {geo.distance > 1000 ? `${(geo.distance / 1000).toFixed(1)} km` : `${geo.distance}m`} away from the exam center. Must be within {exam.allowedRadiusMeters || 500}m.
                    </p>
                  )}
                </div>

                {isLive && !isPast && geo.near ? (
                  <button
                    onClick={() => startExam(exam.id)}
                    className="py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 transition-all flex items-center gap-2"
                  >
                    <Play className="h-5 w-5" />
                    Start Exam
                  </button>
                ) : !geo.near ? (
                  <span className="py-3 px-6 bg-red-500/10 text-red-400 font-medium rounded-xl border border-red-500/20 flex items-center gap-2">
                    <MapPinOff className="h-4 w-4" /> Not at Center
                  </span>
                ) : isPast ? (
                  <span className="py-3 px-6 bg-white/5 text-slate-500 font-medium rounded-xl">Exam Ended</span>
                ) : (
                  <span className="py-3 px-6 bg-white/5 text-blue-400 font-medium rounded-xl">Not Started Yet</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
