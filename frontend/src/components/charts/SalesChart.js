'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export default function SalesChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="convGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--accent-emerald)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="var(--accent-emerald)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
        <YAxis stroke="var(--text-muted)" fontSize={12} />
        <Tooltip
          contentStyle={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Area type="monotone" dataKey="leads" stroke="var(--accent-blue)" fill="url(#leadsGradient)" />
        <Area type="monotone" dataKey="conversions" stroke="var(--accent-emerald)" fill="url(#convGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
