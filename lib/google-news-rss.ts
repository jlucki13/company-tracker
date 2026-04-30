import type { RssItem } from './yahoo-rss'

function parseGoogleRss(xml: string): RssItem[] {
  const items: RssItem[] = []
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)
  for (const match of itemMatches) {
    const block = match[1]
    const titleRaw = block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''
    const title = titleRaw.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim()
    const link = block.match(/<link>(.*?)<\/link>/)?.[1]?.trim()
      ?? block.match(/<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/)?.[1]?.trim()
      ?? ''
    const sourceRaw = block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] ?? 'Google News'
    const source = sourceRaw.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim()
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? ''
    const dt = pubDate ? new Date(pubDate).getTime() / 1000 : Date.now() / 1000
    if (title && link) {
      items.push({ title, url: link, source, datetime: dt })
    }
  }
  return items
}

export async function getGoogleNews(companyName: string): Promise<RssItem[]> {
  try {
    const q = encodeURIComponent(`${companyName} stock earnings`)
    const url = `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`
    const res = await fetch(url, { next: { revalidate: 600 } })
    if (!res.ok) return []
    const xml = await res.text()
    return parseGoogleRss(xml).slice(0, 10)
  } catch {
    return []
  }
}
