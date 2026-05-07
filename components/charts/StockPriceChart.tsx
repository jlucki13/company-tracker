'use client'

import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface PricePoint { date: string; close: number }

const DARK = { bg: '#0a1628', border: '#1e3a5f', text: '#4a7fa5', tooltip: '#0d1b2e' }

function fmt(v: number) { return `$${v.toFixed(2)}` }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
function fmtAxis(d: string) { return new Date(d).toLocaleDateString('en-US', { month: 'short' }) }

export default function StockPriceChart({ ticker }: { ticker: string }) {
  const [data, setData] = useState<PricePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/price-history?ticker=${ticker}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setData(d) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [ticker])

  if (loading) return <div className="h-64 bg-[#0a1628] animate-pulse rounded-xl" />
  if (error) return <div className="h-64 flex items-center justify-center text-sm text-red-400 bg-red-900/20 rounded-xl">{error}</div>
  if (!data.length) return <div className="h-64 flex items-center justify-center text-sm text-[#4a7fa5]">No price data available</div>

  const prices = data.map(d => d.close)
  const minP = Math.min(...prices)
  const maxP = Math.max(...prices)
  const pad = (maxP - minP) * 0.05

  const ticks: string[] = []
  let lastMonth = ''
  for (const d of data) {
    const month = d.date.substring(0, 7)
    if (month !== lastMonth) { ticks.push(d.date); lastMonth = month }
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={DARK.border} />
        <XAxis dataKey="date" ticks={ticks} tickFormatter={fmtAxis} tick={{ fontSize: 11, fill: DARK.text }} axisLine={{ stroke: DARK.border }} tickLine={false} />
        <YAxis domain={[minP - pad, maxP + pad]} tickFormatter={fmt} tick={{ fontSize: 11, fill: DARK.text }} width={62} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v: unknown) => [fmt(v as number), 'Close']} labelFormatter={(d: unknown) => fmtDate(d as string)}
          contentStyle={{ fontSize: 12, borderRadius: 8, background: DARK.tooltip, border: `1px solid ${DARK.border}`, color: '#e2e8f0' }} />
        <Area type="monotone" dataKey="close" stroke="#00d4ff" strokeWidth={2.5} fill="url(#priceGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
