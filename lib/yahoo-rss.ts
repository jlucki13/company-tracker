export interface RssItem {
  title: string
  url: string
  source: string
  datetime: number
  sentiment?: string
}

function parseRssXml(xml: string, sourceName: string): RssItem[] {
  const items: RssItem[] = []
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)
  for (const match of itemMatches) {
    const block = match[1]
    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[1] ?? block.match(/<title>(.*?)<\/title>/)?.[1] ?? ''
    const link = block.match(/<link>(.*?)<\/link>|<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/)?.[1] ?? ''
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? ''
    const dt = pubDate ? new Date(pubDate).getTime() / 1000 : Date.now() / 1000
    if (title && link) {
      items.push({ title: title.trim(), url: link.trim(), source: sourceName, datetime: dt })
    }
  }
  return items
}

export async function getYahooNews(ticker: string): Promise<RssItem[]> {
  try {
    const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${ticker}&region=US&lang=en-US`
    const res = await fetch(url, { next: { revalidate: 600 } })
    if (!res.ok) return []
    const xml = await res.text()
    return parseRssXml(xml, 'Yahoo Finance').slice(0, 10)
  } catch {
    return []
  }
}
