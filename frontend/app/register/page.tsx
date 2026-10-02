'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import API from '@/lib/api';
import { siteConfig } from '@/config/site';
import { maskEmail } from '@/lib/utils';
import { ToastContainer, FieldError, useToast, validators } from '@/lib/toast';
import {
  CheckCircle, Clock, RefreshCw, ShieldAlert,
  User, Mail, Lock, Phone, MapPin, Calendar,
  Eye, EyeOff,
} from 'lucide-react';

interface ClassInfo { name: string; minAge: number; maxAge: number; }

function useDeadlineCountdown(deadline: string | null) {
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired]   = useState(false);

  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setExpired(true); setTimeLeft(''); return; }
      const months  = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
      const days    = Math.floor((diff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));
      const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const parts = [];
      if (months > 0)  parts.push(`${months}M`);
      if (days > 0)    parts.push(`${days}d`);
      parts.push(`${hours}h ${minutes}m ${seconds}s`);
      setTimeLeft(parts.join(' '));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return { timeLeft, expired };
}

export default function RegisterPage() {
  const { toasts, toast, remove } = useToast();

  const [classes,    setClasses]    = useState<ClassInfo[]>([]);
  const [form,       setForm]       = useState({
    name: '', email: '', password: '', confirmPassword: '', mobile: '',
    className: '', fatherName: '', dob: '', city: 'Kasganj',
    state: 'Uttar Pradesh', pincode: '', address: '',
  });
  const [showPassword,  setShowPassword]  = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [otpValue,      setOtpValue]      = useState('');
  const [otpSent,       setOtpSent]       = useState(false);
  const [otpTimer,      setOtpTimer]      = useState(0);
  const [demoOtp,       setDemoOtp]       = useState('');
  const [success,       setSuccess]       = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [regId,         setRegId]         = useState('');
  const [regOpen,       setRegOpen]       = useState<boolean | null>(null);
  const [regMessage,    setRegMessage]    = useState('');
  const [deadline,      setDeadline]      = useState<string | null>(null);
  const [touched,       setTouched]       = useState<Record<string, boolean>>({});
  const [otpSending,    setOtpSending]    = useState(false);

  const { timeLeft, expired } = useDeadlineCountdown(deadline);

  // Derived validation
  const selectedClass = classes.find(c => c.name === form.className);
  const errors = {
    name:            validators.name(form.name),
    email:           validators.email(form.email),
    password:        validators.password(form.password),
    confirmPassword: validators.confirmPassword(form.confirmPassword, form.password),
    mobile:          validators.mobile(form.mobile),
    pincode:         validators.pincode(form.pincode),
    dob:             validators.dob(form.dob, selectedClass?.minAge, selectedClass?.maxAge, form.className),
    otp:             validators.otp(otpValue),
    className:       !form.className ? 'Please select a class' : '',
  };
  const hasErrors = Object.values(errors).some(Boolean);

  function touch(field: string) {
    setTouched(p => ({ ...p, [field]: true }));
  }
  function set(k: string, v: string) {
    setForm(p => ({ ...p, [k]: v }));
    setTouched(p => ({ ...p, [k]: true }));
  }

  useEffect(() => {
    API.get('/classes').then(r => {
      setClasses(r.data.classes);
      if (r.data.classes.length > 0)
        setForm(f => ({ ...f, className: r.data.classes[0].name }));
    }).catch(() => {});
    API.get('/auth/registration-status').then(r => {
      setRegOpen(r.data.isOpen);
      setDeadline(r.data.deadline || null);
      if (!r.data.isOpen) setRegMessage(r.data.message || 'Registration is currently closed.');
    }).catch(() => setRegOpen(true));
  }, []);

  useEffect(() => { if (expired && regOpen) setRegOpen(false); }, [expired]);
  useEffect(() => {
    if (otpTimer <= 0) return;
    const id = setInterval(() => setOtpTimer(p => { if (p <= 1) { setOtpSent(false); return 0; } return p - 1; }), 1000);
    return () => clearInterval(id);
  }, [otpTimer]);

async function sendOtp() {
  touch("email");
  if (errors.email) {
    toast.error("Please enter a valid email before sending OTP.");
    return;
  }
  setOtpSending(true);
  try {
    const { data } = await API.post("/auth/send-otp", { email: form.email });
    setDemoOtp(data.otp || "");
    setOtpSent(true);

    // Dynamically use the seconds sent by your backend, fallback to 60 if missing
    setOtpTimer(data.expiresIn || 60);

    // Show appropriate message based on mode
    const displayEmail = data.maskedEmail || maskEmail(form.email);
    toast.success(
      data.otp
        ? `OTP generated! Demo OTP: ${data.otp}`
        : `OTP sent to ${displayEmail}!`,
    );
  } catch (err: any) {
    toast.error(
      err.response?.data?.message || "Failed to send OTP. Please try again.",
    );
  } finally {
    setOtpSending(false);
  }
}

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Touch all fields to show errors
    const allFields = ['name','email','password','confirmPassword','mobile','className','dob','pincode','otp'];
    setTouched(Object.fromEntries(allFields.map(k => [k, true])));

    if (hasErrors) {
      toast.error('Please fix all errors before submitting.');
      return;
    }
    if (!otpValue) { toast.error('Please enter the OTP to verify your email.'); return; }

    setLoading(true);
    try {
      const payload: any = { ...form, otp: otpValue };
      if (!payload.dob) delete payload.dob;
      const { data } = await API.post('/auth/register', payload);
      setSuccess(true); setRegId(data.user.registrationId);
      toast.success('Registration successful!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  }

  /* ─── Registration Closed ─── */
  if (regOpen === false) return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <ToastContainer toasts={toasts} onRemove={remove} />
      <div className="card p-8 md:p-10 w-full max-w-md text-center animate-scale-in">
        <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Registration Closed</h1>
        <p className="text-slate-500 mt-3">{regMessage}</p>
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
          Please check back later or contact the institute.
        </div>
        <Link href="/login" className="btn btn-primary w-full mt-6">Already Registered? Login</Link>
      </div>
    </main>
  );

  /* ─── Success Screen ─── */
  if (success) return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="card p-8 md:p-10 w-full max-w-md text-center animate-scale-in">
        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Registration Successful!</h1>
        <p className="text-slate-500 mt-2">Your Registration ID has been generated</p>
        <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
          <p className="text-sm text-slate-600">Your Registration ID</p>
          <p className="text-2xl font-black text-blue-700 mt-1">{regId}</p>
        </div>
        <p className="text-xs text-slate-500 mt-4">Use this ID or your email to login. Save it safely.</p>
        <Link href="/login" className="btn btn-primary w-full mt-6">Go to Login</Link>
      </div>
    </main>
  );

  /* ─── Loading ─── */
  if (regOpen === null) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500">Checking registration status...</span>
      </div>
    </main>
  );

  /* ─── Main Form ─── */
  return (
    <main className="min-h-screen flex items-center justify-center p-4 py-12">
      <ToastContainer toasts={toasts} onRemove={remove} />
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/2 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl" />
      </div>

      <form onSubmit={handleSubmit} className="card p-6 md:p-8 w-full max-w-4xl animate-scale-in" noValidate>
        <div className="flex justify-center mb-6">
          <img src="/logo.webp" alt="Lucky Tech Academy" className="h-20 w-auto object-contain" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 text-center mb-1">Student Registration</h1>
        <p className="text-sm text-slate-500 text-center mb-4">{siteConfig.name} Exam Portal</p>

        {deadline && timeLeft && (
          <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800 text-sm">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>Registration closes in: <strong>{timeLeft}</strong></span>
          </div>
        )}

        {/* ── Personal Info ── */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <User className="h-4 w-4" /> Personal Information
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Name */}
            <div>
              <label className="label">Full Name <span className="text-red-500">*</span></label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input className={`input pl-9 ${touched.name && errors.name ? 'border-red-400 bg-red-50' : ''}`}
                  type="text" placeholder="Student full name"
                  value={form.name} onChange={e => set('name', e.target.value)} onBlur={() => touch('name')} />
              </div>
              {touched.name && <FieldError msg={errors.name} />}
            </div>

            {/* Email */}
            <div>
              <label className="label">Email <span className="text-red-500">*</span></label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input className={`input pl-9 ${touched.email && errors.email ? 'border-red-400 bg-red-50' : ''}`}
                  type="email" placeholder="email@example.com"
                  value={form.email} onChange={e => set('email', e.target.value)} onBlur={() => touch('email')} />
              </div>
              {touched.email && <FieldError msg={errors.email} />}
            </div>

            {/* Mobile */}
            <div>
              <label className="label">Mobile</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input className={`input pl-9 ${touched.mobile && errors.mobile ? 'border-red-400 bg-red-50' : ''}`}
                  type="tel" placeholder="10-digit mobile"
                  value={form.mobile} onChange={e => set('mobile', e.target.value)} onBlur={() => touch('mobile')} />
              </div>
              {touched.mobile && <FieldError msg={errors.mobile} />}
            </div>

            {/* Password */}
            <div>
              <label className="label">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input className={`input pl-9 pr-10 ${touched.password && errors.password ? 'border-red-400 bg-red-50' : ''}`}
                  type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters"
                  value={form.password} onChange={e => set('password', e.target.value)} onBlur={() => touch('password')} />
                <button type="button" tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {touched.password && <FieldError msg={errors.password} />}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label">Confirm Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input className={`input pl-9 pr-10 ${touched.confirmPassword && errors.confirmPassword ? 'border-red-400 bg-red-50' : ''}`}
                  type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password"
                  value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} onBlur={() => touch('confirmPassword')} />
                <button type="button" tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {touched.confirmPassword && <FieldError msg={errors.confirmPassword} />}
            </div>

            {/* Class */}
            <div>
              <label className="label">Class / Course <span className="text-red-500">*</span></label>
              <select className={`select ${touched.className && errors.className ? 'border-red-400 bg-red-50' : ''}`}
                value={form.className} onChange={e => set('className', e.target.value)} onBlur={() => touch('className')}>
                {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              {selectedClass && <p className="text-xs text-slate-400 mt-1">Age: {selectedClass.minAge}–{selectedClass.maxAge} yrs</p>}
              {touched.className && <FieldError msg={errors.className} />}
            </div>

            {/* Father's Name */}
            <div>
              <label className="label">Father's Name</label>
              <input className="input" placeholder="Father name"
                value={form.fatherName} onChange={e => set('fatherName', e.target.value)} />
            </div>

            {/* DOB */}
            <div>
              <label className="label">Date of Birth</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input className={`input pl-9 ${touched.dob && errors.dob ? 'border-red-400 bg-red-50' : ''}`}
                  type="date" value={form.dob} onChange={e => set('dob', e.target.value)} onBlur={() => touch('dob')} />
              </div>
              {touched.dob && <FieldError msg={errors.dob} />}
            </div>
          </div>
        </div>

        {/* ── Address ── */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Address
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="label">City</label>
              <input className="input" placeholder="City" value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div>
              <label className="label">State</label>
              <input className="input" placeholder="State" value={form.state} onChange={e => set('state', e.target.value)} />
            </div>
            <div>
              <label className="label">Pincode</label>
              <input className={`input ${touched.pincode && errors.pincode ? 'border-red-400 bg-red-50' : ''}`}
                placeholder="6-digit pincode" value={form.pincode}
                onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                onBlur={() => touch('pincode')} />
              {touched.pincode && <FieldError msg={errors.pincode} />}
            </div>
            <div className="md:col-span-3">
              <label className="label">Address</label>
              <textarea className="input min-h-[70px]" placeholder="Full address"
                value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── OTP Verification ── */}
        <div className="p-4 bg-blue-50 rounded-xl mb-6 border border-blue-200">
          <h3 className="font-semibold text-sm text-blue-800 mb-3 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" /> Email Verification (OTP) <span className="text-red-500">*</span>
          </h3>
          <div className="flex flex-wrap gap-3 items-start">
            <div>
              <button type="button" onClick={sendOtp}
                className={`btn ${otpSent && otpTimer > 0 ? 'btn-ghost' : 'btn-outline'}`}
                disabled={otpSent && otpTimer > 0 || otpSending}>
                {otpSending ? <><div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />Sending...</>
                  : otpSent && otpTimer > 0 ? <><Clock className="h-4 w-4" /> Resend in {Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, '0')}</>
                  : otpSent ? <><RefreshCw className="h-4 w-4" /> Resend OTP</> : 'Send OTP'}
              </button>
            </div>
            <div className="flex-1 min-w-[160px]">
              <input className={`input tracking-widest text-center font-bold ${touched.otp && errors.otp && otpValue ? 'border-red-400 bg-red-50' : ''}`}
                placeholder="Enter 6-digit OTP" value={otpValue}
                onChange={e => { setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6)); touch('otp'); }}
                maxLength={6} />
              {touched.otp && otpValue && <FieldError msg={errors.otp} />}
            </div>
          </div>
          {demoOtp && otpTimer > 0 && (
            <p className="text-xs text-slate-500 mt-2 bg-white p-2 rounded-lg border border-blue-200">
              Demo OTP: <span className="font-bold text-blue-700">{demoOtp}</span>
            </p>
          )}
        </div>

        {/* ── Submit ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/login" className="text-sm text-slate-500 hover:text-blue-700">
            Already registered? Login here
          </Link>
          <button className="btn btn-primary" disabled={loading}>
            {loading
              ? <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Registering...</>
              : 'Complete Registration'}
          </button>
        </div>
      </form>
    </main>
  );
}
