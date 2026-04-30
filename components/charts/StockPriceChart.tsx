'use client'

import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface PricePoint { date: string; close: number }

function fmt(v: number) { return `$${v.toFixed(2)}` }
function fmtDate(d: string) {
  const dt = new Date(d)
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function fmtAxis(d: string) {
  const dt = new Date(d)
  return dt.toLocaleDateString('en-US', { month: 'short' })
}

export default function StockPriceChart({ ticker }: { ticker: string }) {
  const [data, setData] = useState<PricePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/price-history?ticker=${ticker}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [ticker])

  if (loading) return <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
  if (error) return <div className="h-64 flex items-center justify-center text-sm text-red-500 bg-red-50 rounded-xl">{error}</div>
  if (!data.length) return <div className="h-64 flex items-center justify-center text-sm text-gray-400">No price data available</div>

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
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" ticks={ticks} tickFormatter={fmtAxis} tick={{ fontSize: 11 }} />
        <YAxis domain={[minP - pad, maxP + pad]} tickFormatter={fmt} tick={{ fontSize: 11 }} width={62} />
        <Tooltip
          formatter={(v: unknown) => [fmt(v as number), 'Close']}
          labelFormatter={(d: unknown) => fmtDate(d as string)}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Area type="monotone" dataKey="close" stroke="#6366f1" strokeWidth={2} fill="url(#priceGradient)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
