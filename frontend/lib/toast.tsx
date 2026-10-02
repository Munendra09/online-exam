'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

/* ─────────────────────────────────────────
   Toast Types & Hook
───────────────────────────────────────── */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let _nextId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function add(message: string, type: ToastType = 'info', duration = 4500) {
    const id = ++_nextId;
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration);
  }

  function remove(id: number) {
    setToasts(p => p.filter(t => t.id !== id));
  }

  const toast = {
    success: (m: string) => add(m, 'success'),
    error:   (m: string) => add(m, 'error'),
    info:    (m: string) => add(m, 'info'),
    warning: (m: string) => add(m, 'warning'),
  };

  return { toasts, toast, remove };
}

/* ─────────────────────────────────────────
   Toast Container Component
───────────────────────────────────────── */
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

export function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: number) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-start gap-3 p-4 rounded-xl border shadow-xl pointer-events-auto
            animate-slide-down transition-all duration-300 ${colors[t.type]}`}
        >
          {icons[t.type]}
          <span className="text-sm font-medium flex-1 leading-snug">{t.message}</span>
          <button
            onClick={() => onRemove(t.id)}
            className="opacity-50 hover:opacity-100 transition mt-0.5 flex-shrink-0"
            aria-label="Dismiss"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   Field Error Component
───────────────────────────────────────── */
export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 animate-slide-down">
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      {msg}
    </p>
  );
}

/* ─────────────────────────────────────────
   Validation Helpers
───────────────────────────────────────── */
export const validators = {
  required: (v: string, label = 'This field') =>
    !v?.trim() ? `${label} is required` : '',

  email: (v: string) => {
    if (!v?.trim()) return 'Email is required';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(v) ? '' : 'Enter a valid email address';
  },

  emailOrRegId: (v: string) => {
    if (!v?.trim()) return 'Email or Registration ID is required';
    return '';
  },

  password: (v: string) => {
    if (!v) return 'Password is required';
    if (v.length < 6) return 'Password must be at least 6 characters';
    return '';
  },

  passwordStrong: (v: string) => {
    if (!v) return 'Password is required';
    if (v.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(v)) return 'Must contain at least one uppercase letter';
    if (!/[0-9]/.test(v)) return 'Must contain at least one number';
    return '';
  },

  confirmPassword: (v: string, original: string) => {
    if (!v) return 'Please confirm your password';
    return v !== original ? 'Passwords do not match' : '';
  },

  mobile: (v: string) => {
    if (!v?.trim()) return '';          // optional
    const re = /^[6-9]\d{9}$/;
    return re.test(v.replace(/\s/g, '')) ? '' : 'Enter a valid 10-digit mobile number';
  },

  pincode: (v: string) => {
    if (!v?.trim()) return '';          // optional
    return /^\d{6}$/.test(v) ? '' : 'Pincode must be 6 digits';
  },

  otp: (v: string) => {
    if (!v) return 'OTP is required';
    return /^\d{6}$/.test(v) ? '' : 'OTP must be exactly 6 digits';
  },

  name: (v: string) => {
    if (!v?.trim()) return 'Name is required';
    if (v.trim().length < 2) return 'Name must be at least 2 characters';
    return '';
  },

  dob: (v: string, minAge?: number, maxAge?: number, className?: string) => {
    if (!v) return '';
    const birth = new Date(v);
    if (isNaN(birth.getTime())) return 'Enter a valid date of birth';
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (
      today.getMonth() - birth.getMonth() < 0 ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
    ) age--;
    if (age < 5)  return 'Age seems too young';
    if (age > 80) return 'Please enter a valid date of birth';
    if (minAge !== undefined && age < minAge)
      return `Age ${age} is below minimum (${minAge}) for ${className || 'this class'}`;
    if (maxAge !== undefined && age > maxAge)
      return `Age ${age} exceeds maximum (${maxAge}) for ${className || 'this class'}`;
    return '';
  },
};
