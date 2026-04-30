import { NextRequest } from 'next/server'
import { getEarnings } from '@/lib/finnhub'

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker')?.toUpperCase()
  if (!ticker) return Response.json({ error: 'ticker required' }, { status: 400 })
  try {
    const data = await getEarnings(ticker)
    if (!data.length) return Response.json({ error: 'No earnings data available' }, { status: 404 })
    const mapped = data.map(e => ({
      period: e.period,
      quarter: `Q${e.quarter} ${e.year}`,
      estimated: e.estimate,
      actual: e.actual,
      surprise: e.surprise,
      surprisePercent: e.surprisePercent,
    })).reverse()
    return Response.json(mapped)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    if (msg === 'RATE_LIMIT') return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
    return Response.json({ error: msg }, { status: 500 })
  }
}
