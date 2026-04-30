import { NextRequest } from 'next/server'
import { getCompanyNews } from '@/lib/finnhub'
import { getYahooNews } from '@/lib/yahoo-rss'
import { getGoogleNews } from '@/lib/google-news-rss'
import { getMarketauxNews } from '@/lib/marketaux'

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker')?.toUpperCase()
  const name = req.nextUrl.searchParams.get('name') ?? ticker ?? ''
  if (!ticker) return Response.json({ error: 'ticker required' }, { status: 400 })

  try {
    const [finnhubItems, yahooItems, googleItems, marketauxItems] = await Promise.allSettled([
      getCompanyNews(ticker).then(items => items.map(n => ({
        title: n.headline,
        url: n.url,
        source: n.source,
        datetime: n.datetime,
        sentiment: undefined as string | undefined,
      }))),
      getYahooNews(ticker),
      getGoogleNews(name),
      getMarketauxNews(ticker),
    ])

    const all = [
      ...(finnhubItems.status === 'fulfilled' ? finnhubItems.value : []),
      ...(yahooItems.status === 'fulfilled' ? yahooItems.value : []),
      ...(googleItems.status === 'fulfilled' ? googleItems.value : []),
      ...(marketauxItems.status === 'fulfilled' ? marketauxItems.value : []),
    ]

    const seen = new Set<string>()
    const deduped = all.filter(item => {
      if (seen.has(item.url)) return false
      seen.add(item.url)
      return true
    })

    deduped.sort((a, b) => b.datetime - a.datetime)

    return Response.json(deduped.slice(0, 20))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
