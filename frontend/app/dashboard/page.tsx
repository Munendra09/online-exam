'use client';

import { useEffect, useState } from 'react';
import API, { getUser } from '@/lib/api';
import Guard from '@/components/Guard';
import Shell from '@/components/Shell';
import Link from 'next/link';
import {
  GraduationCap, User as UserIcon, Mail, Phone, MapPin, CreditCard,
  BookOpen, Trophy, KeyRound, ArrowRight, Activity, Calendar
} from 'lucide-react';

export default function StudentDashboard() {
  const [results, setResults] = useState<any[]>([]);
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

    Promise.all([
      API.get('/exams').then(r => setExams(r.data.exams || [])),
      API.get('/results/me').then(r => setResults(r.data.results || []))
    ])
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const completedExams = results.length;
  const avgScore = results.length > 0
    ? Math.round(results.reduce((s: number, r: any) => s + r.percentage, 0) / results.length)
    : 0;

  const admitCardsCount = exams.filter(e => e.admitCardReleased).length;
  const answerKeysCount = exams.filter(e => e.answerKeyReleased).length;

  return (
    <Guard role="STUDENT">
      <Shell>
        <div className="w-full space-y-6">
          {/* Welcome Hero Card */}
          <div className="card p-0 overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white relative rounded-2xl shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
            
            <div className="relative p-6 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="h-5 w-5 text-blue-400" />
                    <span className="text-blue-400 font-semibold text-xs uppercase tracking-wider">Student Dashboard</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                    Welcome back, {user?.name?.split(' ')[0] || 'Student'} 👋
                  </h1>
                  <p className="text-slate-400 mt-1 text-sm">
                    Registration ID: <span className="text-blue-400 font-bold">{user?.registrationId}</span>
                  </p>
                </div>
                <div className="flex gap-2 self-start sm:self-center">
                  <span className="badge bg-white/10 text-white border border-white/5 py-1.5 px-3 text-xs rounded-xl">
                    📚 Class {user?.className}
                  </span>
                </div>
              </div>

              {/* Basic Overview Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                {[
                  { label: 'Exams Taken', val: completedExams, bg: 'bg-white/5' },
                  { label: 'Avg Percentage', val: `${avgScore}%`, bg: 'bg-white/5 text-blue-400' },
                  { label: 'Active Admit Cards', val: admitCardsCount, bg: 'bg-white/5 text-cyan-400' },
                  { label: 'Answer Keys', val: answerKeysCount, bg: 'bg-white/5 text-purple-400' },
                ].map((s, idx) => (
                  <div key={idx} className={`${s.bg} backdrop-blur-sm rounded-xl p-4 border border-white/5`}>
                    <p className="text-xl md:text-2xl font-black">{s.val}</p>
                    <p className="text-xs text-slate-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* My Profile Column (2/3 width on desktop) */}
            <div className="md:col-span-2 space-y-6">
              {/* Profile Card */}
              <div className="card p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2 border-b border-slate-50 pb-3">
                  <UserIcon className="h-5 w-5 text-blue-600" /> 
                  Academic Profile
                </h3>

                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
                  {[
                    { icon: UserIcon, label: 'Full Name', val: user?.name },
                    { icon: Mail, label: 'Email Address', val: user?.email },
                    { icon: CreditCard, label: 'Registration ID', val: user?.registrationId, isHighlight: true },
                    { icon: BookOpen, label: 'Enrolled Class', val: `Class ${user?.className}` },
                    { icon: Phone, label: 'Mobile Number', val: user?.mobile || 'Not provided' },
                    { icon: MapPin, label: 'City / Center Locality', val: user?.city || 'Not specified' },
                  ].map(({ icon: Icon, label, val, isHighlight }, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                      <div className="h-8 w-8 rounded-lg bg-blue-50/50 flex items-center justify-center border border-blue-50/20 flex-shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-blue-600/70" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{label}</p>
                        <p className={`font-semibold text-sm mt-0.5 ${isHighlight ? 'text-blue-700 font-bold' : 'text-slate-800'}`}>
                          {val}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Navigation / Routes Panel */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex-1 flex flex-col justify-center min-h-[160px]">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4.5 w-4.5 text-blue-600" />
                  <span className="font-bold text-slate-700 text-sm">Portal Navigation</span>
                </div>
                <p className="text-xs text-slate-400">
                  Quickly navigate to your exam portal modules using the shortcuts below or via the sidebar menu.
                </p>
              </div>

              {/* Link Cards */}
              {[
                {
                  href: '/dashboard/results',
                  title: 'View My Results',
                  desc: 'Check marks and download report cards',
                  icon: Trophy,
                  color: 'from-blue-600 to-blue-500',
                  shadow: 'shadow-blue-500/10'
                },
                {
                  href: '/dashboard/admit-card',
                  title: 'Download Admit Cards',
                  desc: 'Get hall tickets for scheduled exams',
                  icon: CreditCard,
                  color: 'from-cyan-600 to-cyan-500',
                  shadow: 'shadow-cyan-500/10'
                },
                {
                  href: '/dashboard/answer-keys',
                  title: 'View Answer Keys',
                  desc: 'Check published keys for completed papers',
                  icon: KeyRound,
                  color: 'from-purple-600 to-purple-500',
                  shadow: 'shadow-purple-500/10'
                }
              ].map((link, idx) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={idx}
                    href={link.href}
                    className="group flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl transition shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${link.color} text-white flex items-center justify-center shadow-lg ${link.shadow}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition">
                          {link.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">{link.desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </Shell>
    </Guard>
  );
}
