'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import API from '@/lib/api';
import { siteConfig } from '@/config/site';
import { maskEmail } from '@/lib/utils';
import { GraduationCap, CheckCircle, AlertCircle, Lock, Mail, ShieldCheck, Clock, RefreshCw } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'verify' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [maskedEmailDisplay, setMaskedEmailDisplay] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');
  const [loading, setLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // OTP countdown
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  function showMsg(text: string, type: 'success' | 'error') {
    setMessage(text);
    setMessageType(type);
  }

  async function sendOtp() {
    if (!email) { showMsg('Please enter your email or Registration ID', 'error'); return; }
    setLoading(true);
    try {
      const { data } = await API.post('/auth/forgot-password/send-otp', { email });
      // Only show OTP in client/demo mode
      setDemoOtp(data.otp || '');
      setMaskedEmailDisplay(data.maskedEmail || maskEmail(email));
      setOtpTimer(data.expiresIn || 60);
      setStep('verify');
      showMsg(
        data.otp
          ? `OTP generated! Demo OTP: ${data.otp}`
          : `OTP sent to your registered email!`,
        'success'
      );
    } catch (err: any) {
      showMsg(err.response?.data?.message || 'Failed to send OTP', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) { showMsg('Passwords do not match', 'error'); return; }
    if (password.length < 6) { showMsg('Password must be at least 6 characters', 'error'); return; }
    if (!otp) { showMsg('Please enter the OTP', 'error'); return; }

    setLoading(true);
    try {
      await API.post('/auth/forgot-password/reset', { email, otp, newPassword: password, confirmNewPassword: confirmPassword });
      setStep('success');
      showMsg('Password reset successful!', 'success');
    } catch (err: any) {
      showMsg(err.response?.data?.message || 'Reset failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'success') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-0 left-1/2 w-96 h-96 bg-green-200/20 rounded-full blur-3xl" />
        </div>
        <div className="card p-8 w-full max-w-md text-center animate-scale-in">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Password Reset!</h1>
          <p className="text-slate-500 mt-2">Your password has been changed successfully. You can now login with your new password.</p>
          <Link href="/login" className="btn btn-primary w-full mt-6">
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/2 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl" />
      </div>

      <div className="card p-6 md:p-8 w-full max-w-md animate-scale-in">
        <div className="flex items-center gap-3 mb-6">
          <img src="/logo.webp" alt="Lucky Tech Academy" className="h-12 w-auto object-contain" />
          <div>
            <h1 className="text-xl font-black text-slate-900">Forgot Password</h1>
            <p className="text-sm text-slate-500">{siteConfig.name}</p>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-xl text-sm mb-4 flex items-center gap-2 animate-slide-down ${
            messageType === 'success' ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
              : 'bg-red-50 border border-red-100 text-red-700'
          }`}>
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {message}
          </div>
        )}

        {step === 'email' && (
          <div>
            <p className="text-sm text-slate-500 mb-4">Enter your email or Registration ID. We will send an OTP to reset your password.</p>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email or Registration ID</label>
            <input className="input mb-4" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email or Reg ID" />
            <button onClick={sendOtp} className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        )}

        {step === 'verify' && (
          <form onSubmit={resetPassword}>
            <p className="text-sm text-slate-500 mb-4">
              OTP sent to <strong>{maskedEmailDisplay || maskEmail(email)}</strong>
              {demoOtp && <span className="text-blue-700"> (Demo: {demoOtp})</span>}
            </p>

            <label className="block text-xs font-medium text-slate-600 mb-1">OTP Code</label>
            <div className="flex gap-2 mb-4">
              <input className="input flex-1" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit OTP" maxLength={6} required />
              <button type="button" onClick={sendOtp} disabled={otpTimer > 0 || loading} className="btn btn-outline text-sm whitespace-nowrap">
                {otpTimer > 0 ? <><Clock className="h-3.5 w-3.5" /> {otpTimer}s</> : <><RefreshCw className="h-3.5 w-3.5" /> Resend</>}
              </button>
            </div>

            <label className="block text-xs font-medium text-slate-600 mb-1">New Password</label>
            <input className="input mb-3" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required />

            <label className="block text-xs font-medium text-slate-600 mb-1">Confirm New Password</label>
            <input className={`input mb-4 ${confirmPassword && password !== confirmPassword ? 'border-red-400 bg-red-50' : ''}`}
              type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500 -mt-3 mb-4">Passwords do not match</p>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <Link href="/login" className="block text-center text-sm text-slate-500 hover:text-blue-700 mt-4">
          ← Back to Login
        </Link>
      </div>
    </main>
  );
}
