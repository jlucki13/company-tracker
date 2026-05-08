'use client'

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface RatioData {
  pe: number | null
  pb: number | null
  roe: number | null
  roa: number | null
  currentRatio: number | null
  debtEquity: number | null
  netMargin: number | null
}

const METRICS: { key: keyof RatioData; label: string; cap: number }[] = [
  { key: 'pe', label: 'P/E', cap: 60 },
  { key: 'pb', label: 'P/B', cap: 20 },
  { key: 'roe', label: 'ROE', cap: 100 },
  { key: 'roa', label: 'ROA', cap: 30 },
  { key: 'currentRatio', label: 'Curr. Ratio', cap: 5 },
  { key: 'netMargin', label: 'Net Margin', cap: 40 },
]

const COLORS = ['#00d4ff', '#ffd700', '#00ff88']

export default function CompareRadar({ tickers, ratios }: { tickers: string[]; ratios: (RatioData | null)[] }) {
  const data = METRICS.map(m => {
    const row: Record<string, string | number> = { metric: m.label }
    tickers.forEach((t, i) => {
      const v = ratios[i]?.[m.key]
      row[t] = v != null ? Math.min(100, Math.round((v / m.cap) * 100)) : 0
    })
    return row
  })

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} margin={{ top: 12, right: 32, bottom: 8, left: 32 }}>
        <PolarGrid stroke="#1e3a5f" />
        <PolarAngleAxis dataKey="metric" tick={{ fill: '#4a7fa5', fontSize: 12 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        {tickers.map((t, i) => (
          <Radar
            key={t}
            name={t}
            dataKey={t}
            stroke={COLORS[i % COLORS.length]}
            fill={COLORS[i % COLORS.length]}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        ))}
        <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
        <Tooltip
          contentStyle={{ fontSize: 12, background: '#0d1b2e', border: '1px solid #1e3a5f', borderRadius: 8, color: '#e2e8f0' }}
          formatter={(v: unknown) => [`${v}%`, '']}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
