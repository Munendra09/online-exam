'use client';

import { useEffect, useState } from 'react';
import API from '@/lib/api';
import Guard from '@/components/Guard';
import Shell from '@/components/Shell';
import { Upload, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { statusColor } from '@/lib/utils';

export default function AdminQuestions() {
  const [exams, setExams] = useState<any[]>([]);
  const [examId, setExamId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get('/exams').then((r) => {
      setExams(r.data.exams);
      if (r.data.exams.length) setExamId(String(r.data.exams[0].id));
    });
  }, []);

  useEffect(() => {
    if (examId) {
      API.get('/questions', { params: { examId } }).then((r) => setQuestions(r.data.questions));
      API.get(`/questions/stats/${examId}`).then((r) => setStats(r.data.stats));
    }
  }, [examId]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !examId) return;

    setLoading(true);
    setMessage('');

    const fd = new FormData();
    fd.append('file', file);

    try {
      const { data } = await API.post(`/questions/upload/${examId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(`${data.inserted} questions uploaded successfully`);
      setIsError(false);
      setFile(null);

      // Reload questions and stats
      API.get('/questions', { params: { examId } }).then((r) => setQuestions(r.data.questions));
      API.get(`/questions/stats/${examId}`).then((r) => setStats(r.data.stats));
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Upload failed');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  async function deleteAllQuestions() {
    if (!confirm('Delete ALL questions for this exam?')) return;
    await API.delete(`/questions/exam/${examId}`);
    setQuestions([]);
    API.get(`/questions/stats/${examId}`).then((r) => setStats(r.data.stats));
    setMessage('All questions deleted');
    setIsError(false);
  }

  async function deleteQuestion(id: number) {
    await API.delete(`/questions/${id}`);
    setQuestions(questions.filter((q) => q.id !== id));
    API.get(`/questions/stats/${examId}`).then((r) => setStats(r.data.stats));
  }

  return (
    <Guard role="ADMIN">
      <Shell>
        <div className="max-w-5xl">
          <h1 className="text-2xl font-black text-slate-900 mb-1">Question Management</h1>
          <p className="text-sm text-slate-500 mb-6">Upload questions via CSV file for each exam</p>

          {/* Upload Card */}
          <div className="card p-6 mb-6">
            <h2 className="font-bold text-slate-800 mb-4">Upload CSV Questions</h2>
            <p className="text-sm text-slate-500 mb-4">
              CSV columns: <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">question, optionA, optionB, optionC, optionD, correctAnswer</code>
            </p>

            {message && (
              <div className={`p-3 rounded-xl text-sm mb-4 flex items-center gap-2 ${
                isError ? 'bg-red-50 border border-red-100 text-red-700' : 'bg-emerald-50 border border-emerald-100 text-emerald-700'
              }`}>
                {isError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                {message}
              </div>
            )}

            <form onSubmit={handleUpload} className="grid md:grid-cols-4 gap-4">
              <select className="select" value={examId} onChange={(e) => setExamId(e.target.value)}>
                {exams.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
              <input
                className="input"
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <button className="btn btn-primary" disabled={loading || !file}>
                <Upload className="h-4 w-4" /> {loading ? 'Uploading...' : 'Upload'}
              </button>
              <button type="button" onClick={deleteAllQuestions} className="btn btn-danger" disabled={!questions.length}>
                <Trash2 className="h-4 w-4" /> Delete All
              </button>
            </form>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div className="card p-4 text-center">
                <p className="text-2xl font-black text-slate-800">{stats.total}</p>
                <p className="text-xs text-slate-500">Total Questions</p>
              </div>
            </div>
          )}

          {/* Questions Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Question</th>
                    <th>Answer</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q, i) => (
                    <tr key={q.id}>
                      <td className="text-slate-400">{i + 1}</td>
                      <td className="max-w-sm">
                        <p className="font-medium text-slate-800 truncate">{q.question}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          A: {q.optionA} • B: {q.optionB} • C: {q.optionC} • D: {q.optionD}
                        </p>
                      </td>
                      <td><span className="badge bg-emerald-100 text-emerald-700 font-bold">{q.correctAnswer}</span></td>
                      <td>
                        <button onClick={() => deleteQuestion(q.id)} className="btn btn-ghost btn-sm text-red-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {questions.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-12 text-slate-400">No questions uploaded for this exam</td></tr>
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
