'use client'

import { useEffect, useState } from 'react'

interface RatioData {
  pe: number | null; pb: number | null; roe: number | null
  roa: number | null; currentRatio: number | null; debtEquity: number | null; netMargin: number | null
}

const METRICS = [
  { key: 'pe' as const, label: 'P/E Ratio', cap: 60, fmt: (v: number) => `${v.toFixed(1)}x`, color: '#00d4ff' },
  { key: 'pb' as const, label: 'P/B Ratio', cap: 20, fmt: (v: number) => `${v.toFixed(1)}x`, color: '#a855f7' },
  { key: 'roe' as const, label: 'ROE', cap: 100, fmt: (v: number) => `${v.toFixed(1)}%`, color: '#00ff88' },
  { key: 'roa' as const, label: 'ROA', cap: 30, fmt: (v: number) => `${v.toFixed(1)}%`, color: '#ffd700' },
  { key: 'currentRatio' as const, label: 'Current Ratio', cap: 5, fmt: (v: number) => v.toFixed(2), color: '#ff6b35' },
]

function Gauge({ label, raw, pct, color }: { label: string; raw: string; pct: number; color: string }) {
  const r = 34
  const circ = 2 * Math.PI * r
  const arc = circ * 0.75
  const offset = arc * (1 - Math.min(Math.max(pct, 0), 1))
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={90} height={72} viewBox="0 0 90 72">
        <circle cx={45} cy={48} r={r} fill="none" stroke="#1e3a5f" strokeWidth={7}
          strokeDasharray={`${arc} ${circ}`} strokeLinecap="round"
          style={{ transform: 'rotate(135deg)', transformOrigin: '45px 48px' }} />
        <circle cx={45} cy={48} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={`${arc} ${circ}`} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transform: 'rotate(135deg)', transformOrigin: '45px 48px', filter: `drop-shadow(0 0 4px ${color})` }} />
        <text x={45} y={53} textAnchor="middle" fill="white" fontSize={13} fontWeight="bold">{raw}</text>
      </svg>
      <span className="text-xs text-[#4a7fa5] text-center leading-tight">{label}</span>
    </div>
  )
}

export default function RatiosRadar({ ticker }: { ticker: string }) {
  const [data, setData] = useState<RatioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/ratios?ticker=${ticker}`)
      .then(r => r.json())
      .then((d: RatioData & { error?: string }) => { if (d.error) throw new Error(d.error); setData(d) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [ticker])

  if (loading) return <div className="h-64 bg-[#0a1628] animate-pulse rounded-xl" />
  if (error) return <div className="h-64 flex items-center justify-center text-sm text-red-400 bg-red-900/20 rounded-xl">{error}</div>
  if (!data) return null

  return (
    <div className="grid grid-cols-3 gap-4 py-2">
      {METRICS.map(m => {
        const val = data[m.key]
        return (
          <Gauge key={m.key} label={m.label}
            raw={val != null ? m.fmt(val) : 'N/A'}
            pct={val != null ? val / m.cap : 0}
            color={m.color} />
        )
      })}
      {data.netMargin != null && (
        <Gauge label="Net Margin" raw={`${data.netMargin.toFixed(1)}%`} pct={data.netMargin / 40} color="#2dd4bf" />
      )}
    </div>
  )
}
