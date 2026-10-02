'use client';

import { useEffect, useState } from 'react';
import API from '@/lib/api';
import Guard from '@/components/Guard';
import Shell from '@/components/Shell';
import { Search } from 'lucide-react';
import { statusColor } from '@/lib/utils';

export default function AdminResults() {
  const [results, setResults] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [filters, setFilters] = useState<any>({ classes: [], cities: [] });

  useEffect(() => {
    API.get('/admin/results').then((r) => setResults(r.data.results));
    API.get('/admin/filter-options').then((r) => setFilters(r.data));
  }, []);

  function loadFiltered() {
    API.get('/admin/results', {
      params: { search, className: classFilter, city: cityFilter, grade: gradeFilter },
    }).then((r) => setResults(r.data.results));
  }

  const filtered = results.filter((r) => {
    const name = (r.User?.name || '').toLowerCase();
    const email = (r.User?.email || '').toLowerCase();
    const q = search.toLowerCase();
    const matchSearch = !q || name.includes(q) || email.includes(q);
    const matchClass = !classFilter || r.User?.className === classFilter;
    const matchCity = !cityFilter || r.User?.city === cityFilter;
    const matchGrade = !gradeFilter || r.grade === gradeFilter;
    return matchSearch && matchClass && matchCity && matchGrade;
  });

  return (
    <Guard role="ADMIN">
      <Shell>
        <div>
          <h1 className="text-2xl font-black text-slate-900 mb-1">All Results</h1>
          <p className="text-sm text-slate-500 mb-6">{results.length} results available</p>

          {/* Filters */}
          <div className="card p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="relative col-span-2 md:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input className="input pl-10" placeholder="Search student..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <select className="select" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                <option value="">All Classes</option>
                {filters.classes?.map((c: string) => <option key={c}>{c}</option>)}
              </select>
              <select className="select" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
                <option value="">All Cities</option>
                {filters.cities?.map((c: string) => <option key={c}>{c}</option>)}
              </select>
              <select className="select" value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
                <option value="">All Grades</option>
                <option>A</option><option>B</option><option>C</option><option>D</option>
              </select>
              <div className="text-sm text-slate-500 flex items-center">{filtered.length} of {results.length}</div>
            </div>
          </div>

          {/* Results Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Exam</th>
                    <th>Score</th>
                    <th>%</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={r.id}>
                      <td>
                        <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold ${
                          i === 0 ? 'bg-blue-100 text-blue-700' :
                          i === 1 ? 'bg-slate-200 text-slate-700' :
                          i === 2 ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-50 text-slate-500'
                        }`}>
                          {i + 1}
                        </span>
                      </td>
                      <td>
                        <p className="font-semibold text-slate-800">{r.User?.name}</p>
                        <p className="text-xs text-slate-500">{r.User?.registrationId || r.User?.email}</p>
                      </td>
                      <td className="text-slate-600">{r.User?.className}</td>
                      <td className="text-slate-600">{r.Exam?.title}</td>
                      <td className="font-bold text-slate-800">{r.score}</td>
                      <td className="text-slate-600">{r.percentage}%</td>
                      <td><span className={`badge ${statusColor(r.grade)}`}>Grade {r.grade}</span></td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-12 text-slate-400">No results found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Shell>
    </Guard>
  );
}
