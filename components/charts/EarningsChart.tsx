'use client'

import { useEffect, useState } from 'react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

interface EarningsRow {
  quarter: string
  estimated: number | null
  actual: number | null
  surprise: number | null
}

export default function EarningsChart({ ticker }: { ticker: string }) {
  const [data, setData] = useState<EarningsRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/earnings?ticker=${ticker}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setData(d) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [ticker])

  if (loading) return <div className="h-64 bg-[#0a1628] animate-pulse rounded-xl" />
  if (error) return <div className="h-64 flex items-center justify-center text-sm text-red-400 bg-red-900/20 rounded-xl">{error}</div>
  if (!data.length) return <div className="h-64 flex items-center justify-center text-sm text-[#4a7fa5]">No earnings data available</div>

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
        <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: '#4a7fa5' }} axisLine={{ stroke: '#1e3a5f' }} tickLine={false} />
        <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 11, fill: '#4a7fa5' }} width={50} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(v: unknown, name: unknown) => {
            const n = v as number | null
            const label = name === 'estimated' ? 'Estimated EPS' : name === 'actual' ? 'Actual EPS' : String(name)
            return [n != null ? `$${n.toFixed(2)}` : 'N/A', label]
          }}
          contentStyle={{ fontSize: 12, borderRadius: 8, background: '#0d1b2e', border: '1px solid #1e3a5f', color: '#e2e8f0' }}
        />
        <Legend formatter={n => n === 'estimated' ? 'Estimated EPS' : 'Actual EPS'} wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
        <Bar dataKey="estimated" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => {
            const beat = entry.actual != null && entry.estimated != null && entry.actual >= entry.estimated
            return <Cell key={i} fill={beat ? '#00ff8844' : '#ff475744'} stroke={beat ? '#00ff88' : '#ff4757'} strokeWidth={1} />
          })}
        </Bar>
        <Line type="monotone" dataKey="actual" stroke="#ffd700" strokeWidth={2.5} dot={{ fill: '#ffd700', r: 4, strokeWidth: 0 }} connectNulls={false} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
