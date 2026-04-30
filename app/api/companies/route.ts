import { readCompanies, writeCompanies } from '@/lib/store'
import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'

export async function GET() {
  const companies = readCompanies().sort((a, b) => a.rank - b.rank)
  return Response.json(companies)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { ticker, name } = body as { ticker: string; name: string }
  if (!ticker || !name) return Response.json({ error: 'ticker and name required' }, { status: 400 })

  const companies = readCompanies()
  if (companies.length >= 10) return Response.json({ error: 'Top 10 is full — remove one first' }, { status: 400 })

  const upper = ticker.toUpperCase()
  if (companies.find(c => c.ticker === upper)) {
    return Response.json({ error: `${upper} is already in your list` }, { status: 409 })
  }

  const company = { id: randomUUID(), ticker: upper, name, rank: companies.length + 1, addedAt: new Date().toISOString() }
  writeCompanies([...companies, company])
  return Response.json(company, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker')
  if (!ticker) return Response.json({ error: 'ticker required' }, { status: 400 })

  const upper = ticker.toUpperCase()
  const companies = readCompanies().filter(c => c.ticker !== upper)
  const reranked = companies.sort((a, b) => a.rank - b.rank).map((c, i) => ({ ...c, rank: i + 1 }))
  writeCompanies(reranked)
  return Response.json({ ok: true })
}

export async function PUT(req: NextRequest) {
  const body = await req.json() as Array<{ ticker: string; rank: number }>
  const companies = readCompanies()
  const rankMap = new Map(body.map(({ ticker, rank }) => [ticker.toUpperCase(), rank]))
  const updated = companies.map(c => ({ ...c, rank: rankMap.get(c.ticker) ?? c.rank }))
  writeCompanies(updated)
  return Response.json({ ok: true })
}
