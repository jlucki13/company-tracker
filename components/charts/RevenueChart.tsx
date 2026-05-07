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

  if (loading) return <div className="h-64 bg-[#0a1628] animate-pulse rounded-xl" />
  if (error) return <div className="h-64 flex items-center justify-center text-sm text-red-400 bg-red-900/20 rounded-xl">{error}</div>
  if (!data.length) return <div className="h-64 flex items-center justify-center text-sm text-[#4a7fa5]">No financial data available</div>

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
        <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#4a7fa5' }} axisLine={{ stroke: '#1e3a5f' }} tickLine={false} />
        <YAxis tickFormatter={fmtBig} tick={{ fontSize: 11, fill: '#4a7fa5' }} width={70} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(v: unknown, name: unknown) => [fmtBig(v as number), name === 'revenue' ? 'Revenue' : 'Net Income']}
          labelFormatter={y => String(y)}
          contentStyle={{ fontSize: 12, borderRadius: 8, background: '#0d1b2e', border: '1px solid #1e3a5f', color: '#e2e8f0' }}
        />
        <Legend formatter={n => n === 'revenue' ? 'Revenue' : 'Net Income'} wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="netIncome" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.netIncome >= 0 ? '#00ff88' : '#ff4757'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
