'use client'

import { useEffect, useState } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface RatioData {
  pe: number | null
  pb: number | null
  roe: number | null
  roa: number | null
  currentRatio: number | null
}

interface RadarPoint { metric: string; value: number; raw: string }

const CAPS: Record<string, number> = { 'P/E': 60, 'P/B': 20, 'ROE (%)': 60, 'ROA (%)': 30, 'Current Ratio': 5 }

function normalize(value: number, cap: number): number {
  return Math.min(Math.max((value / cap) * 100, 0), 100)
}

export default function RatiosRadar({ ticker }: { ticker: string }) {
  const [data, setData] = useState<RadarPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/ratios?ticker=${ticker}`)
      .then(r => r.json())
      .then((d: RatioData & { error?: string }) => {
        if (d.error) throw new Error(d.error)
        const metrics: Array<{ label: string; value: number | null; fmt: string }> = [
          { label: 'P/E', value: d.pe, fmt: d.pe != null ? `${d.pe.toFixed(1)}x` : 'N/A' },
          { label: 'P/B', value: d.pb, fmt: d.pb != null ? `${d.pb.toFixed(1)}x` : 'N/A' },
          { label: 'ROE (%)', value: d.roe, fmt: d.roe != null ? `${d.roe.toFixed(1)}%` : 'N/A' },
          { label: 'ROA (%)', value: d.roa, fmt: d.roa != null ? `${d.roa.toFixed(1)}%` : 'N/A' },
          { label: 'Current Ratio', value: d.currentRatio, fmt: d.currentRatio != null ? d.currentRatio.toFixed(2) : 'N/A' },
        ]
        setData(metrics.map(m => ({
          metric: m.label,
          value: m.value != null ? normalize(m.value, CAPS[m.label]) : 0,
          raw: m.fmt,
        })))
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [ticker])

  if (loading) return <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
  if (error) return <div className="h-64 flex items-center justify-center text-sm text-red-500 bg-red-50 rounded-xl">{error}</div>

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} margin={{ top: 8, right: 30, left: 30, bottom: 8 }}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(_: unknown, __: unknown, props: { payload?: RadarPoint }) => [props.payload?.raw ?? '—', 'Value']}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
