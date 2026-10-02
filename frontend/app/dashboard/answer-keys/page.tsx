'use client';

import { useEffect, useState } from 'react';
import API from '@/lib/api';
import Guard from '@/components/Guard';
import Shell from '@/components/Shell';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { KeyRound, Calendar, FileText, ArrowRight } from 'lucide-react';

export default function StudentAnswerKeys() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/exams')
      .then((r) => {
        setExams(r.data.exams || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const answerKeyExams = exams.filter((e) => e.answerKeyReleased);

  return (
    <Guard role="STUDENT">
      <Shell>
        <div className="w-full space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
              <KeyRound className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Answer Keys</h1>
              <p className="text-xs text-slate-500">View answer keys for completed exams to check your answers</p>
            </div>
          </div>

          {/* List Card */}
          <div className="card p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-400">Loading answer keys...</p>
              </div>
            ) : answerKeyExams.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700 text-sm">No Answer Keys Released</h3>
                <p className="text-xs text-slate-400 mt-1">Answer keys will be published here after examinations conclude.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {answerKeyExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-gradient-to-r from-purple-50/50 to-white rounded-2xl border border-purple-100 hover:shadow-sm transition gap-4"
                  >
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-850 text-base">{exam.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(exam.date)}
                      </div>
                    </div>
                    <Link
                      href={`/answer-key/${exam.id}`}
                      className="btn bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/10 flex items-center justify-center gap-1.5 self-start sm:self-center"
                    >
                      View Answer Key
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Shell>
    </Guard>
  );
}
