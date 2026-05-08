'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface Company { ticker: string; name: string }
interface Quote { price: number | null; changePercent: number | null }

// Fetch a live quote per ticker via the existing /api/company route
async function fetchQuote(ticker: string): Promise<Quote> {
  try {
    const res = await fetch(`/api/company?ticker=${ticker}`, { cache: 'no-store' })
    const d = await res.json()
    return { price: d.price ?? null, changePercent: d.changePercent ?? null }
  } catch {
    return { price: null, changePercent: null }
  }
}

interface TickerItem extends Company, Quote {}

export default function TickerMarquee() {
  const [items, setItems] = useState<TickerItem[]>([])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/companies')
        const companies: Company[] = await res.json()
        if (!companies.length) return
        const withQuotes = await Promise.all(
          companies.map(async c => ({ ...c, ...(await fetchQuote(c.ticker)) }))
        )
        setItems(withQuotes)
      } catch {}
    }
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [])

  if (!items.length) return null

  // Duplicate for seamless loop
  const repeated = [...items, ...items]

  return (
    <div className="relative overflow-hidden bg-[#060e1f] border-b border-[#1e3a5f] py-2 select-none">
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 z-10 bg-gradient-to-r from-[#060e1f] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l from-[#060e1f] to-transparent" />

      <div className="flex animate-marquee whitespace-nowrap">
        {repeated.map((item, i) => {
          const up = item.changePercent != null ? item.changePercent >= 0 : null
          return (
            <span key={i} className="inline-flex items-center gap-2 mx-6">
              <span className="text-xs font-mono font-bold text-cyan-300 tracking-wider">{item.ticker}</span>
              <span className="text-xs text-[#4a7fa5] hidden sm:inline">{item.name}</span>
              {item.price != null && (
                <span className="text-xs font-mono text-[#e2e8f0]">${item.price.toFixed(2)}</span>
              )}
              {item.changePercent != null && (
                <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {up ? '+' : ''}{item.changePercent.toFixed(2)}%
                </span>
              )}
              <span className="text-[#1e3a5f] mx-2">·</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
