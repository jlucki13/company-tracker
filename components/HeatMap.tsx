'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { CompanyCardData } from './CompanyCard'

function tileColor(pct: number | undefined): string {
  if (pct == null) return 'rgb(30,58,95)'
  const clamped = Math.max(-4, Math.min(4, pct))
  const neutral = { r: 30, g: 58, b: 95 }
  const target = clamped >= 0
    ? { r: 20, g: 83, b: 45 }
    : { r: 127, g: 29, b: 29 }
  const t = Math.abs(clamped) / 4
  const lerp = (a: number, b: number) => Math.round(a * (1 - t) + b * t)
  return `rgb(${lerp(neutral.r, target.r)},${lerp(neutral.g, target.g)},${lerp(neutral.b, target.b)})`
}

export default function HeatMap({ companies }: { companies: CompanyCardData[] }) {
  if (!companies.length) return null
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {companies.map(c => {
        const up = (c.changePercent ?? 0) >= 0
        return (
          <Link
            key={c.ticker}
            href={`/company/${c.ticker}`}
            className="block rounded-xl p-4 border border-white/10 hover:brightness-125 hover:scale-[1.02] transition-all"
            style={{ background: tileColor(c.changePercent) }}
          >
            <div className="font-bold text-white font-mono text-lg leading-none">{c.ticker}</div>
            <div className="text-xs text-white/50 truncate mt-1">{c.name}</div>
            <div className="mt-4 flex items-end justify-between gap-1">
              <span className="text-white font-semibold text-sm">
                {c.price != null ? `$${c.price.toFixed(2)}` : '—'}
              </span>
              <span className={`flex items-center gap-0.5 text-xs font-bold ${up ? 'text-emerald-300' : 'text-red-300'}`}>
                {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {up ? '+' : ''}{c.changePercent?.toFixed(2) ?? '—'}%
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
