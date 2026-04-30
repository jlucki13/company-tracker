'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

interface FinancialRow { year: string; revenue: number; netIncome: number }

function fmtBig(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1e12) return `$${(v / 1e12).toFixed(1)}T`
  if (abs >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (abs >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
  return `$${v.toLocaleString()}`
}

export default function RevenueChart({ ticker }: { ticker: string }) {
  const [data, setData] = useState<FinancialRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/financials?ticker=${ticker}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setData(d) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [ticker])

  if (loading) return <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
  if (error) return <div className="h-64 flex items-center justify-center text-sm text-red-500 bg-red-50 rounded-xl">{error}</div>
  if (!data.length) return <div className="h-64 flex items-center justify-center text-sm text-gray-400">No financial data available</div>

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} tickFormatter={y => `FY${y}`} />
        <YAxis tickFormatter={fmtBig} tick={{ fontSize: 11 }} width={70} />
        <Tooltip
          formatter={(v: unknown, name: unknown) => [fmtBig(v as number), name === 'revenue' ? 'Revenue' : 'Net Income']}
          labelFormatter={y => `FY${y}`}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Legend formatter={n => n === 'revenue' ? 'Revenue' : 'Net Income'} wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="revenue" fill="#6366f1" radius={[3, 3, 0, 0]} />
        <Bar dataKey="netIncome" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.netIncome >= 0 ? '#10b981' : '#ef4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
