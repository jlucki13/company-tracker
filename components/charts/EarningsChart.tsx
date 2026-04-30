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

  if (loading) return <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
  if (error) return <div className="h-64 flex items-center justify-center text-sm text-red-500 bg-red-50 rounded-xl">{error}</div>
  if (!data.length) return <div className="h-64 flex items-center justify-center text-sm text-gray-400">No earnings data available</div>

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="quarter" tick={{ fontSize: 10 }} />
        <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 11 }} width={50} />
        <Tooltip
          formatter={(v: unknown, name: unknown) => {
            const n = v as number | null
            const label = name === 'estimated' ? 'Estimated EPS' : name === 'actual' ? 'Actual EPS' : String(name)
            return [n != null ? `$${n.toFixed(2)}` : 'N/A', label]
          }}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Legend formatter={n => n === 'estimated' ? 'Estimated EPS' : 'Actual EPS'} wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="estimated" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => {
            const beat = entry.actual != null && entry.estimated != null && entry.actual >= entry.estimated
            return <Cell key={i} fill={beat ? '#bbf7d0' : '#fecaca'} />
          })}
        </Bar>
        <Line
          type="monotone"
          dataKey="actual"
          stroke="#6366f1"
          strokeWidth={2}
          dot={{ fill: '#6366f1', r: 4 }}
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
