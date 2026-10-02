/**
 * Shared Utilities
 */

/**
 * Combine CSS classes, filtering out falsy values
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format time (HH:MM)
 */
export function formatTime(time: string): string {
  if (!time) return '';
  const parts = time.split(':');
  const hours = parseInt(parts[0]);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

/**
 * Get status color class
 */
export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: 'bg-amber-100 text-amber-700',
    PUBLISHED: 'bg-emerald-100 text-emerald-700',
    CLOSED: 'bg-slate-100 text-slate-600',
    SUBMITTED: 'bg-blue-100 text-blue-700',
    AUTO_SUBMITTED: 'bg-orange-100 text-orange-700',
    IN_PROGRESS: 'bg-cyan-100 text-cyan-700',
    EASY: 'bg-green-100 text-green-700',
    MEDIUM: 'bg-amber-100 text-amber-700',
    HARD: 'bg-red-100 text-red-700',
    A: 'bg-emerald-100 text-emerald-700',
    B: 'bg-blue-100 text-blue-700',
    C: 'bg-amber-100 text-amber-700',
    D: 'bg-red-100 text-red-700',
    Active: 'bg-emerald-100 text-emerald-700',
    Blocked: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-slate-100 text-slate-600';
}

/**
 * Truncate text
 */
export function truncate(text: string, max: number = 50): string {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '...' : text;
}

/**
 * Mask an email for safe display: m*****1@gmail.com
 * Use backend `maskedEmail` field when available; this is a client-side fallback.
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***.***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 5))}${local[local.length - 1]}@${domain}`;
}
