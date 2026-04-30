import { NextRequest } from 'next/server'
import { getQuarterlyMargins } from '@/lib/yahoo-finance'

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker')?.toUpperCase()
  if (!ticker) return Response.json({ error: 'ticker required' }, { status: 400 })
  try {
    const data = await getQuarterlyMargins(ticker)
    if (!data.length) return Response.json({ error: 'No margin data' }, { status: 404 })
    return Response.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    if (msg === 'No data found') return Response.json({ error: 'No data found' }, { status: 404 })
    return Response.json({ error: msg }, { status: 500 })
  }
}
