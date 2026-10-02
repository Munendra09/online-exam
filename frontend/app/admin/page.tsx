'use client';

import { useEffect, useState } from 'react';
import API from '@/lib/api';
import Guard from '@/components/Guard';
import Shell from '@/components/Shell';
import { BarBox, PieBox } from '@/components/Charts';
import {
  Users, BookOpen, HelpCircle, FileCheck, UserCheck,
  TrendingUp, Award, Star,
} from 'lucide-react';

/* ─── Enhanced Stat Card ─── */
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;           // Tailwind gradient classes
  textColor: string;
  bgLight: string;
  change?: string;         // e.g. "+12%"
  changeLabel?: string;
}

function StatCard({ title, value, icon, color, textColor, bgLight, change, changeLabel }: StatCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 shadow-lg text-white ${color}`}>
      {/* Decorative circle */}
      <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute -bottom-6 -right-2 h-16 w-16 rounded-full bg-white/10 pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/80 mb-1">{title}</p>
          <h3 className="text-3xl font-black tracking-tight">{value ?? 0}</h3>
          {change && (
            <p className="text-xs text-white/70 mt-1.5 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> {change} {changeLabel}
            </p>
          )}
        </div>
        <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ─── Top Students Badge ─── */
function RankBadge({ rank }: { rank: number }) {
  if (rank === 0) return (
    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-white text-xs font-black shadow-md shadow-yellow-200">
      🥇
    </span>
  );
  if (rank === 1) return (
    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 text-white text-xs font-black shadow">
      🥈
    </span>
  );
  if (rank === 2) return (
    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-600 text-white text-xs font-black shadow">
      🥉
    </span>
  );
  return (
    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
      #{rank + 1}
    </span>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = {
    'A+': 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    'A':  'bg-emerald-100 text-emerald-700',
    'B':  'bg-blue-100    text-blue-700',
    'C':  'bg-yellow-100  text-yellow-700',
    'D':  'bg-orange-100  text-orange-700',
    'F':  'bg-red-100     text-red-700',
  };
  return (
    <span className={`badge font-bold ${colors[grade] || 'bg-slate-100 text-slate-600'}`}>
      Grade {grade}
    </span>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<any>({
    stats: {}, topStudents: [], resultDistribution: [],
    cityDistribution: [], classDistribution: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/dashboard')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const s = data.stats;

  const statCards: StatCardProps[] = [
    {
      title: 'Total Students',
      value: s.students ?? '—',
      icon: <Users className="h-5 w-5 text-white" />,
      color: 'bg-gradient-to-br from-blue-600 to-blue-400',
      textColor: 'text-blue-700', bgLight: 'bg-blue-50',
    },
    {
      title: 'Active Students',
      value: s.activeStudents ?? '—',
      icon: <UserCheck className="h-5 w-5 text-white" />,
      color: 'bg-gradient-to-br from-emerald-600 to-teal-400',
      textColor: 'text-emerald-700', bgLight: 'bg-emerald-50',
    },
    {
      title: 'Total Exams',
      value: s.exams ?? '—',
      icon: <BookOpen className="h-5 w-5 text-white" />,
      color: 'bg-gradient-to-br from-purple-600 to-violet-400',
      textColor: 'text-purple-700', bgLight: 'bg-purple-50',
    },
    {
      title: 'Questions Bank',
      value: s.questions ?? '—',
      icon: <HelpCircle className="h-5 w-5 text-white" />,
      color: 'bg-gradient-to-br from-amber-500 to-orange-400',
      textColor: 'text-amber-700', bgLight: 'bg-amber-50',
    },
    {
      title: 'Submissions',
      value: s.attempts ?? '—',
      icon: <FileCheck className="h-5 w-5 text-white" />,
      color: 'bg-gradient-to-br from-rose-600 to-pink-400',
      textColor: 'text-rose-700', bgLight: 'bg-rose-50',
    },
  ];

  const cityData  = (data.cityDistribution  || []).map((r: any) => ({ city: r.city || 'Unknown', count: Number(r.count ?? 0) }));
  const classData = (data.classDistribution || []).map((r: any) => ({ className: r.className || 'Unknown', count: Number(r.count ?? 0) }));
  const gradeData = (data.resultDistribution || []).map((r: any) => ({ grade: r.grade || 'N/A', count: Number(r.count ?? 0) }));

  return (
    <Guard role="ADMIN">
      <Shell>
        {/* ── Header ── */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Admin Dashboard</h1>
            <p className="text-sm text-slate-500 mt-0.5">Overview of all portal activity</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 font-medium">
            <Star className="h-4 w-4" />
            Lucky Tech Academy
          </div>
        </div>

        {/* ── Stat Cards ── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {statCards.map((card, i) => (
              <StatCard key={card.title} {...card} />
            ))}
          </div>
        )}

        {/* ── Charts Row 1 ── */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <BarBox
            data={data.topStudents.map((s: any) => ({
              name: s.User?.name ?? '—',
              score: s.score ?? 0,
            }))}
            title="Top 10 Students by Score"
            nameKey="name"
            dataKey="score"
          />
          <PieBox
            data={gradeData}
            title="Result Grade Distribution"
            nameKey="grade"
            dataKey="count"
          />
        </div>

        {/* ── Charts Row 2 ── */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <BarBox
            data={cityData}
            title="Students by City"
            nameKey="city"
            dataKey="count"
            emptyMsg="No city data yet."
          />
          <PieBox
            data={classData}
            title="Students by Class"
            nameKey="className"
            dataKey="count"
          />
        </div>

        {/* ── Top Students Table ── */}
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Award className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Top Students</h2>
                <p className="text-xs text-slate-500">Ranked by exam score</p>
              </div>
            </div>
          </div>

          {data.topStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <FileCheck className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">No results yet. Results will appear here once exams are completed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student</th>
                    <th>Class</th>
                    <th>City</th>
                    <th>Score</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topStudents.map((r: any, i: number) => (
                    <tr key={r.id} className={i < 3 ? 'bg-amber-50/40' : ''}>
                      <td className="w-12"><RankBadge rank={i} /></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(r.User?.name?.[0] || '?').toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{r.User?.name ?? '—'}</p>
                            <p className="text-xs text-slate-400">{r.User?.registrationId ?? ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-slate-600 text-sm">{r.User?.className ?? '—'}</td>
                      <td className="text-slate-600 text-sm">{r.User?.city ?? '—'}</td>
                      <td>
                        <span className="font-black text-slate-800 text-lg">{r.score}</span>
                      </td>
                      <td><GradeBadge grade={r.grade} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Shell>
    </Guard>
  );
}
