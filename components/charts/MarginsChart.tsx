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

  if (loading) return <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
  if (error) return <div className="h-64 flex items-center justify-center text-sm text-red-500 bg-red-50 rounded-xl">{error}</div>
  if (!data.length) return <div className="h-64 flex items-center justify-center text-sm text-gray-400">No margin data available</div>

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="period" tick={{ fontSize: 10 }} />
        <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} width={48} />
        <Tooltip
          formatter={(v: unknown, name: unknown) => {
            const n = v as number | null
            const label = name === 'grossMargin' ? 'Gross Margin' : name === 'operatingMargin' ? 'Operating Margin' : 'Net Margin'
            return [n != null ? `${n.toFixed(1)}%` : 'N/A', label]
          }}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Legend
          formatter={n => n === 'grossMargin' ? 'Gross Margin' : n === 'operatingMargin' ? 'Operating Margin' : 'Net Margin'}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Line type="monotone" dataKey="grossMargin" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
        <Line type="monotone" dataKey="operatingMargin" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
        <Line type="monotone" dataKey="netMargin" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
