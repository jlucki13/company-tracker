'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

interface EarningsEvent {
  ticker: string
  date: string
  epsEstimate: number | null
  epsActual: number | null
  quarter: number
  year: number
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const PALETTE = ['#00d4ff', '#ffd700', '#00ff88', '#a855f7', '#ff6b35', '#2dd4bf', '#f97316', '#ec4899', '#84cc16', '#06b6d4']

export default function EarningsCalendar() {
  const [events, setEvents] = useState<EarningsEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(() => new Date().getMonth())
  const [year, setYear] = useState(() => new Date().getFullYear())

  // Assign a consistent color per ticker
  const tickerColorMap = new Map<string, string>()
  let ci = 0
  for (const e of events) {
    if (!tickerColorMap.has(e.ticker)) tickerColorMap.set(e.ticker, PALETTE[ci++ % PALETTE.length])
  }

  useEffect(() => {
    async function load() {
      try {
        const listRes = await fetch('/api/companies')
        const companies: { ticker: string }[] = await listRes.json()
        if (!Array.isArray(companies) || !companies.length) { setLoading(false); return }
        const tickers = companies.map(c => c.ticker).join(',')
        const calRes = await fetch(`/api/earnings-calendar?tickers=${tickers}`)
        const data = await calRes.json()
        if (Array.isArray(data)) setEvents(data)
      } catch { /* fail silently */ }
      setLoading(false)
    }
    load()
  }, [])

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array<null>(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const today = new Date()

  function eventsOnDay(day: number): EarningsEvent[] {
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.date === d)
  }

  return (
    <section className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-indigo-400 uppercase tracking-widest">Earnings Calendar</h2>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors">
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm font-medium text-white min-w-[140px] text-center">{MONTH_NAMES[month]} {year}</span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-56 bg-gray-800 rounded-xl animate-pulse" />
      ) : (
        <>
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map(d => (
              <div key={d} className="text-center text-[11px] text-gray-600 font-medium py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day == null) return <div key={i} className="min-h-[60px]" />
              const dayEvents = eventsOnDay(day)
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
              return (
                <div
                  key={i}
                  className={`min-h-[60px] rounded-lg p-1.5 border transition-colors ${
                    isToday ? 'border-indigo-500 bg-indigo-950/40' : dayEvents.length ? 'border-gray-700 bg-gray-800/40' : 'border-transparent'
                  }`}
                >
                  <span className={`text-[11px] block leading-none mb-1 ${isToday ? 'text-indigo-400 font-bold' : 'text-gray-600'}`}>
                    {day}
                  </span>
                  {dayEvents.map(e => {
                    const color = tickerColorMap.get(e.ticker) ?? '#4a7fa5'
                    const tooltip = e.epsEstimate != null
                      ? `${e.ticker} Q${e.quarter} ${e.year} — Est. EPS: $${e.epsEstimate.toFixed(2)}`
                      : `${e.ticker} Q${e.quarter} ${e.year}`
                    return (
                      <div
                        key={e.ticker}
                        title={tooltip}
                        className="text-[9px] font-bold px-1 py-0.5 rounded mb-0.5 truncate cursor-default"
                        style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
                      >
                        {e.ticker}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {events.length === 0 && (
            <p className="text-center text-xs text-gray-600 mt-4">No earnings dates found for tracked companies in this window.</p>
          )}
        </>
      )}
    </section>
  )
}
