'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface MarginRow { period: string; grossMargin: number | null; operatingMargin: number | null; netMargin: number | null }

export default function MarginsChart({ ticker }: { ticker: string }) {
  const [data, setData] = useState<MarginRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/margins?ticker=${ticker}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setData(d) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [ticker])

  if (loading) return <div className="h-64 bg-[#0a1628] animate-pulse rounded-xl" />
  if (error) return <div className="h-64 flex items-center justify-center text-sm text-red-400 bg-red-900/20 rounded-xl">{error}</div>
  if (!data.length) return <div className="h-64 flex items-center justify-center text-sm text-[#4a7fa5]">No margin data available</div>

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
        <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#4a7fa5' }} axisLine={{ stroke: '#1e3a5f' }} tickLine={false} />
        <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#4a7fa5' }} width={48} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(v: unknown, name: unknown) => {
            const n = v as number | null
            const label = name === 'grossMargin' ? 'Gross Margin' : name === 'operatingMargin' ? 'Operating Margin' : 'Net Margin'
            return [n != null ? `${n.toFixed(1)}%` : 'N/A', label]
          }}
          contentStyle={{ fontSize: 12, borderRadius: 8, background: '#0d1b2e', border: '1px solid #1e3a5f', color: '#e2e8f0' }}
        />
        <Legend
          formatter={n => n === 'grossMargin' ? 'Gross Margin' : n === 'operatingMargin' ? 'Operating Margin' : 'Net Margin'}
          wrapperStyle={{ fontSize: 12, color: '#94a3b8' }}
        />
        <Line type="monotone" dataKey="grossMargin" stroke="#2dd4bf" strokeWidth={2.5} dot={{ r: 3, fill: '#2dd4bf', strokeWidth: 0 }} connectNulls={false} />
        <Line type="monotone" dataKey="operatingMargin" stroke="#ffd700" strokeWidth={2.5} dot={{ r: 3, fill: '#ffd700', strokeWidth: 0 }} connectNulls={false} />
        <Line type="monotone" dataKey="netMargin" stroke="#00ff88" strokeWidth={2.5} dot={{ r: 3, fill: '#00ff88', strokeWidth: 0 }} connectNulls={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
