import type { RssItem } from './yahoo-rss'

interface MarketauxArticle {
  title: string
  url: string
  published_at: string
  source: string
  entities: Array<{ sentiment_score: number }>
}

interface MarketauxResponse {
  data: MarketauxArticle[]
  error?: { message: string }
}

function sentimentLabel(score: number): string {
  if (score > 0.15) return 'Positive'
  if (score < -0.15) return 'Negative'
  return 'Neutral'
}

export async function getMarketauxNews(ticker: string): Promise<RssItem[]> {
  const k = process.env.MARKETAUX_API_KEY
  if (!k || k === 'your_marketaux_key_here') return []
  try {
    const url = `https://api.marketaux.com/v1/news/all?symbols=${ticker}&language=en&api_token=${k}`
    const res = await fetch(url, { next: { revalidate: 600 } })
    if (!res.ok) return []
    const json: MarketauxResponse = await res.json()
    if (!json.data) return []
    return json.data.slice(0, 10).map(a => {
      const score = a.entities?.[0]?.sentiment_score ?? 0
      return {
        title: a.title,
        url: a.url,
        source: a.source ?? 'Marketaux',
        datetime: new Date(a.published_at).getTime() / 1000,
        sentiment: sentimentLabel(score),
      }
    })
  } catch {
    return []
  }
}
