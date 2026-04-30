import { NextRequest } from 'next/server'
import { getProfile, getQuote } from '@/lib/finnhub'

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker')?.toUpperCase()
  if (!ticker) return Response.json({ error: 'ticker required' }, { status: 400 })
  try {
    const [profile, quote] = await Promise.all([getProfile(ticker), getQuote(ticker)])
    if (!profile.name) return Response.json({ error: 'No data found' }, { status: 404 })
    return Response.json({
      ticker,
      name: profile.name,
      exchange: profile.exchange,
      sector: profile.finnhubIndustry,
      logo: profile.logo,
      website: profile.weburl,
      marketCap: profile.marketCapitalization,
      currency: profile.currency,
      price: quote.c,
      change: quote.d,
      changePercent: quote.dp,
      high: quote.h,
      low: quote.l,
      prevClose: quote.pc,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    if (msg === 'RATE_LIMIT') return Response.json({ error: 'Rate limit exceeded — try again shortly' }, { status: 429 })
    if (msg === 'FINNHUB_API_KEY not set') return Response.json({ error: 'API key not configured' }, { status: 503 })
    return Response.json({ error: msg }, { status: 500 })
  }
}
