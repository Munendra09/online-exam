'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import API, { saveSession } from '@/lib/api';
import { siteConfig } from '@/config/site';
import {
  Eye, EyeOff, KeyRound, ArrowLeft, Clock, RefreshCw,
  CheckCircle, ShieldCheck, AlertCircle, XCircle, Info,
  Mail, Lock,
} from 'lucide-react';
import { maskEmail } from '@/lib/utils';

/* ─── Toast Component ─── */
type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: number; message: string; type: ToastType; }

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />,
    error:   <XCircle     className="h-5 w-5 text-red-500     flex-shrink-0" />,
    info:    <Info        className="h-5 w-5 text-blue-500    flex-shrink-0" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-500  flex-shrink-0" />,
  };
  const colors: Record<ToastType, string> = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    error:   'border-red-200    bg-red-50    text-red-800',
    info:    'border-blue-200   bg-blue-50   text-blue-800',
    warning: 'border-amber-200  bg-amber-50  text-amber-800',
  };
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(t => (
        <div key={t.id}
          className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg pointer-events-auto
            animate-slide-down transition-all duration-300 ${colors[t.type]}`}>
          {icons[t.type]}
          <span className="text-sm font-medium flex-1">{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="opacity-60 hover:opacity-100 transition ml-1 mt-0.5">
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let nextId = 0;
  function add(message: string, type: ToastType = 'info', duration = 4000) {
    const id = ++nextId + Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration);
  }
  function remove(id: number) { setToasts(p => p.filter(t => t.id !== id)); }
  return { toasts, toast: { success: (m: string) => add(m, 'success'), error: (m: string) => add(m, 'error'), info: (m: string) => add(m, 'info'), warning: (m: string) => add(m, 'warning') }, remove };
}

/* ─── Validation ─── */
function validateEmail(v: string) {
  if (!v.trim()) return 'Email or Registration ID is required';
  return '';
}
function validatePassword(v: string) {
  if (!v) return 'Password is required';
  if (v.length < 6) return 'Password must be at least 6 characters';
  return '';
}

/* ─── Field Error Component ─── */
function FieldError({ msg }: { msg: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{msg}</p>;
}

export default function LoginPage() {
  const router = useRouter();
  const { toasts, toast, remove } = useToast();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [touched, setTouched]   = useState({ email: false, password: false });

  // Field errors (real-time after touch)
  const emailErr    = touched.email    ? validateEmail(email)    : '';
  const passwordErr = touched.password ? validatePassword(password) : '';

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'reset' | 'done'>('email');
  const [forgotEmail, setForgotEmail]       = useState('');
  const [forgotOtp, setForgotOtp]           = useState('');
  const [newPassword, setNewPassword]       = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotLoading, setForgotLoading]   = useState(false);
  const [otpTimer, setOtpTimer]             = useState(0);
  const [forgotTouched, setForgotTouched]   = useState({ email: false, otp: false, password: false, confirm: false });

  // Forgot validation
  const forgotEmailErr    = forgotTouched.email    ? validateEmail(forgotEmail) : '';
  const forgotOtpErr      = forgotTouched.otp      ? (!forgotOtp ? 'OTP is required' : forgotOtp.length !== 6 ? 'OTP must be 6 digits' : '') : '';
  const forgotPasswordErr = forgotTouched.password ? validatePassword(newPassword) : '';
  const forgotConfirmErr  = forgotTouched.confirm  ? (newPassword !== confirmNewPassword ? 'Passwords do not match' : '') : '';

  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => setOtpTimer(p => p <= 1 ? 0 : p - 1), 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (validateEmail(email) || validatePassword(password)) {
      toast.error('Please fix the errors before submitting.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', { email, password });
      saveSession(null, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      setTimeout(() => router.push(data.user.role === 'ADMIN' ? '/admin' : '/dashboard'), 500);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(msg);
    } finally { setLoading(false); }
  }

  async function handleForgotSendOtp() {
    setForgotTouched(p => ({ ...p, email: true }));
    if (validateEmail(forgotEmail)) { toast.error('Please enter a valid email or Registration ID.'); return; }
    setForgotLoading(true);
    try {
      const { data } = await API.post('/auth/forgot-password/send-otp', { email: forgotEmail });
      setOtpTimer(data.expiresIn || 60);
      setForgotStep('otp');
      // Use masked email from backend; never show full email
      const displayEmail = data.maskedEmail || maskEmail(forgotEmail);
      toast.success(`OTP sent to ${displayEmail}. Valid for 1 minute.`);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setOtpTimer(err.response.data.remainingSeconds || 30);
        setForgotStep('otp');
      }
      toast.error(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally { setForgotLoading(false); }
  }

  async function handleResetPassword() {
    setForgotTouched({ email: true, otp: true, password: true, confirm: true });
    if (forgotOtpErr || forgotPasswordErr || forgotConfirmErr) {
      toast.error("Please fix the errors above before resetting.");
      return;
    }
    setForgotLoading(true);
    try {
      const { data } = await API.post("/auth/forgot-password/reset", {
        email: forgotEmail,
        otp: forgotOtp,
        newPassword: newPassword,
        confirmNewPassword: confirmNewPassword,
      });
      setForgotStep("done");
      toast.success(data.message || "Password reset successfully!");
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Reset failed. Please try again.",
      );
    } finally {
      setForgotLoading(false);
    }
  }

  function resetForgot() {
    setShowForgot(false); setForgotStep('email'); setForgotEmail('');
    setForgotOtp(''); setNewPassword(''); setConfirmNewPassword('');
    setOtpTimer(0); setForgotTouched({ email: false, otp: false, password: false, confirm: false });
  }

  /* ─── Forgot Password Modal ─── */
  if (showForgot) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <ToastContainer toasts={toasts} onRemove={remove} />
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
        </div>
        <div className="card p-8 md:p-10 w-full max-w-md animate-scale-in">
          <button onClick={resetForgot} className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-700 mb-6 transition">
            <ArrowLeft className="h-4 w-4" /> Back to Login
          </button>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <KeyRound className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Reset Password</h1>
              <p className="text-xs text-slate-500">OTP-based password recovery</p>
            </div>
          </div>

          {forgotStep === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email or Registration ID <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input className={`input pl-9 ${forgotEmailErr ? 'border-red-400 bg-red-50 focus:ring-red-100' : ''}`}
                    type="text" value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    onBlur={() => setForgotTouched(p => ({ ...p, email: true }))}
                    placeholder="Enter your email or Registration ID" autoFocus />
                </div>
                <FieldError msg={forgotEmailErr} />
              </div>
              <button onClick={handleForgotSendOtp} className="btn btn-primary w-full" disabled={forgotLoading}>
                {forgotLoading ? <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending OTP...</> : 'Send OTP'}
              </button>
            </div>
          )}

          {forgotStep === 'otp' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Enter OTP <span className="text-red-500">*</span></label>
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input className={`input tracking-widest text-center text-lg font-bold ${forgotOtpErr ? 'border-red-400 bg-red-50' : ''}`}
                      type="text" value={forgotOtp}
                      onChange={e => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onBlur={() => setForgotTouched(p => ({ ...p, otp: true }))}
                      placeholder="• • • • • •" maxLength={6} autoFocus />
                    <FieldError msg={forgotOtpErr} />
                  </div>
                  {otpTimer > 0 && (
                    <span className="text-xs text-blue-600 flex items-center gap-1 whitespace-nowrap mt-3">
                      <Clock className="h-3 w-3" /> {otpTimer}s
                    </span>
                  )}
                </div>
                {otpTimer === 0 && (
                  <button onClick={handleForgotSendOtp} className="text-xs text-blue-700 hover:underline mt-1 flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" /> Resend OTP
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input className={`input pl-9 ${forgotPasswordErr ? 'border-red-400 bg-red-50' : ''}`}
                    type="password" value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    onBlur={() => setForgotTouched(p => ({ ...p, password: true }))}
                    placeholder="Min 6 characters" />
                </div>
                <FieldError msg={forgotPasswordErr} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input className={`input pl-9 ${forgotConfirmErr ? 'border-red-400 bg-red-50' : ''}`}
                    type="password" value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    onBlur={() => setForgotTouched(p => ({ ...p, confirm: true }))}
                    placeholder="Re-enter new password" />
                </div>
                <FieldError msg={forgotConfirmErr} />
              </div>
              <button onClick={handleResetPassword} className="btn btn-primary w-full" disabled={forgotLoading}>
                {forgotLoading ? <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Resetting...</> : 'Reset Password'}
              </button>
            </div>
          )}

          {forgotStep === 'done' && (
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Password Reset Successful!</h2>
              <p className="text-slate-500 mt-2 text-sm">You can now login with your new password.</p>
              <button onClick={resetForgot} className="btn btn-primary w-full mt-6">Go to Login</button>
            </div>
          )}
        </div>
      </main>
    );
  }

  /* ─── Login Form ─── */
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <ToastContainer toasts={toasts} onRemove={remove} />
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
      </div>

      <form onSubmit={handleSubmit} className="card p-8 md:p-10 w-full max-w-md animate-scale-in" noValidate>
        <div className="flex justify-center mb-6">
          <img src="/logo.webp" alt="Lucky Tech Academy" className="h-20 w-auto object-contain" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Welcome Back</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">Login with your email or Registration ID</p>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Email or Registration ID <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className={`input pl-9 ${emailErr ? 'border-red-400 bg-red-50 focus:ring-red-100' : ''}`}
              type="text" value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => setTouched(p => ({ ...p, email: true }))}
              placeholder="admin@exam.com or LTA202600001"
              autoFocus />
          </div>
          <FieldError msg={emailErr} />
        </div>

        {/* Password */}
        <div className="mb-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className={`input pl-9 pr-12 ${passwordErr ? 'border-red-400 bg-red-50 focus:ring-red-100' : ''}`}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onBlur={() => setTouched(p => ({ ...p, password: true }))}
              placeholder="Enter your password" />
            <button type="button" tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <FieldError msg={passwordErr} />
        </div>

        <div className="text-right mb-6">
          <button type="button" onClick={() => setShowForgot(true)}
            className="text-sm text-blue-700 hover:text-blue-800 font-medium hover:underline">
            Forgot Password?
          </button>
        </div>

        <button className="btn btn-primary w-full" disabled={loading}>
          {loading
            ? <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Please wait...</>
            : 'Login'}
        </button>

        <p className="text-center text-sm text-slate-500 mt-6">
          New student?{' '}
          <Link href="/register" className="text-blue-700 font-semibold hover:underline">Register here</Link>
        </p>
      </form>
    </main>
  );
}
