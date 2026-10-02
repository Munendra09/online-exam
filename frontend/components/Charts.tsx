'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend,
} from 'recharts';

const COLORS = ['#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#eab308', '#ec4899'];

const tooltipStyle = {
  contentStyle: {
    borderRadius: '12px',
    border: 'none',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    fontSize: '13px',
  },
};

/* ===== Bar Chart ===== */
export function BarBox({
  data, title, dataKey = 'count', nameKey = 'name', emptyMsg,
}: {
  data: any[];
  title: string;
  dataKey?: string;
  nameKey?: string;
  emptyMsg?: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="card p-5">
        <h3 className="font-bold text-slate-700 mb-4">{title}</h3>
        <div className="h-72 flex items-center justify-center text-slate-400 text-sm">
          {emptyMsg || 'No data available yet.'}
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="font-bold text-slate-700 mb-4">{title}</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey={nameKey}
              tick={{ fontSize: 11 }}
              interval={0}
              angle={data.length > 6 ? -30 : 0}
              textAnchor={data.length > 6 ? 'end' : 'middle'}
              height={data.length > 6 ? 50 : 30}
            />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} maxBarSize={50}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ===== Pie / Donut Chart ===== */
export function PieBox({
  data, title, nameKey = 'grade', dataKey = 'count',
}: {
  data: any[];
  title: string;
  nameKey?: string;
  dataKey?: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="card p-5">
        <h3 className="font-bold text-slate-700 mb-4">{title}</h3>
        <div className="h-72 flex items-center justify-center text-slate-400 text-sm">
          No data available yet.
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="font-bold text-slate-700 mb-4">{title}</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={4}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ===== Area Chart ===== */
export function AreaBox({
  data, title, dataKey = 'count', nameKey = 'date',
}: {
  data: any[];
  title: string;
  dataKey?: string;
  nameKey?: string;
}) {
  return (
    <div className="card p-5">
      <h3 className="font-bold text-slate-700 mb-4">{title}</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey={nameKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip {...tooltipStyle} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke="#2563eb"
              fill="url(#blueGradient)"
              strokeWidth={2}
            />
            <defs>
              <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
