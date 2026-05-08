import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://finnhub.io/api/v1'

interface FinnhubEarningsEvent {
  symbol: string
  date: string
  epsEstimate: number | null
  epsActual: number | null
  quarter: number
  year: number
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey || apiKey === 'your_finnhub_key_here') {
    return NextResponse.json({ error: 'FINNHUB_API_KEY not set' }, { status: 503 })
  }

  const tickers = req.nextUrl.searchParams.get('tickers')
  if (!tickers) return NextResponse.json({ error: 'tickers param required' }, { status: 400 })

  const tickerList = tickers.split(',').map(t => t.trim()).filter(Boolean)

  const from = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString().split('T')[0]
  const to = new Date(Date.now() + 75 * 24 * 3600 * 1000).toISOString().split('T')[0]

  try {
    const results = await Promise.all(
      tickerList.map(async ticker => {
        const url = new URL(`${BASE}/calendar/earnings`)
        url.searchParams.set('from', from)
        url.searchParams.set('to', to)
        url.searchParams.set('symbol', ticker)
        url.searchParams.set('token', apiKey)
        const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
        if (!res.ok) return []
        const data = await res.json() as { earningsCalendar?: FinnhubEarningsEvent[] }
        return (data.earningsCalendar ?? []).map(e => ({
          ticker: e.symbol,
          date: e.date,
          epsEstimate: e.epsEstimate,
          epsActual: e.epsActual,
          quarter: e.quarter,
          year: e.year,
        }))
      })
    )

    const merged = results.flat().sort((a, b) => a.date.localeCompare(b.date))
    return NextResponse.json(merged)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
