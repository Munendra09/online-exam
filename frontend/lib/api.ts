
import axios from 'axios';
import type { User } from '@/types';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'https://api.luckytechacademy.in/api';

const API = axios.create({
  baseURL: API_BASE,
  timeout: 300000, // 5 minutes
  withCredentials: true,
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error?.response?.status === 401) {
      const path = window.location.pathname;

      const publicPages = ['/login', '/register', '/forgot-password', '/'];

      const isAuthCheck = error?.config?.url?.includes('/auth/me');

      if (!isAuthCheck && !publicPages.some((p) => path === p || path.startsWith(p + '/'))) {
        localStorage.removeItem('lta_user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default API;

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem('lta_user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    localStorage.removeItem('lta_user');
    return null;
  }
}

export function saveSession(_token: string | null, user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('lta_user', JSON.stringify(user));
}

export async function logout(): Promise<void> {
  try {
    await API.post('/auth/logout');
  } catch {
    // ignore
  }

  localStorage.removeItem('lta_user');

  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}