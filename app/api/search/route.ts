import { NextRequest } from 'next/server'
import { searchSymbol } from '@/lib/finnhub'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 1) return Response.json([])
  try {
    const results = await searchSymbol(q)
    return Response.json(results)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    if (msg === 'FINNHUB_API_KEY not set') return Response.json({ error: 'API key not configured' }, { status: 503 })
    return Response.json({ error: msg }, { status: 500 })
  }
}
