'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, FileText, HelpCircle,
  Trophy, LogOut, Menu, X, GraduationCap, CreditCard, KeyRound,
  TrendingUp, BarChart2, Award, Target, Zap, Settings,
} from 'lucide-react';
import { getUser, logout } from '@/lib/api';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

const adminLinks = [
  { href: '/admin',           label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/students',  label: 'Students',  icon: Users           },
  { href: '/admin/classes',   label: 'Classes',   icon: GraduationCap   },
  { href: '/admin/exams',     label: 'Exams',     icon: FileText        },
  { href: '/admin/questions', label: 'Questions', icon: HelpCircle      },
  { href: '/admin/results',   label: 'Results',   icon: Trophy          },
  { href: '/admin/settings',  label: 'Settings',  icon: Settings        },
];

const studentLinks = [
  { href: '/dashboard',             label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/dashboard/results',     label: 'Results',     icon: Trophy          },
  { href: '/dashboard/admit-card',  label: 'Admit Card',  icon: CreditCard      },
  { href: '/dashboard/answer-keys', label: 'Answer Keys', icon: KeyRound        },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => { setUser(getUser()); }, []);

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="min-h-screen">
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={cn('sidebar transform transition-transform duration-300 lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="p-6 pb-4 flex justify-center">
          <img src="/logo.webp" alt="Lucky Tech Academy" className="h-14 w-auto object-contain" />
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-4">
          {isAdmin
            ? adminLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn('sidebar-link', pathname === link.href && 'sidebar-link-active')}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />{link.label}
                  </Link>
                );
              })
            : studentLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn('sidebar-link', pathname === link.href && 'sidebar-link-active')}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />{link.label}
                  </Link>
                );
              })
          }
        </nav>

        <div className="p-4 border-t border-slate-200">
          {user && (
            <div className="mb-3 px-3">
              <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.registrationId || user.email}</p>
            </div>
          )}
          <button onClick={logout} className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600">
            <LogOut className="h-5 w-5" />Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="lg:pl-72 min-h-screen flex flex-col">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
          <div className="flex items-center justify-between px-4 md:px-8 py-4">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 rounded-xl hover:bg-slate-100" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div>
                <h1 className="font-bold text-lg text-slate-900">{siteConfig.name}</h1>
                <p className="text-xs text-slate-500">{user?.name}{user?.registrationId ? ` • ${user.registrationId}` : ''}</p>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
