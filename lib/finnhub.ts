const BASE = 'https://finnhub.io/api/v1'

function key() {
  const k = process.env.FINNHUB_API_KEY
  if (!k || k === 'your_finnhub_key_here') throw new Error('FINNHUB_API_KEY not set')
  return k
}

async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('token', key())
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString(), { next: { revalidate: 300 } })
  if (res.status === 429) throw new Error('RATE_LIMIT')
  if (!res.ok) throw new Error(`Finnhub ${res.status}`)
  return res.json()
}

export interface FinnhubProfile {
  name: string
  ticker: string
  exchange: string
  finnhubIndustry: string
  marketCapitalization: number
  logo: string
  weburl: string
  ipo: string
  shareOutstanding: number
  currency: string
}

export interface FinnhubQuote {
  c: number  // current price
  d: number  // change
  dp: number // change percent
  h: number  // high
  l: number  // low
  o: number  // open
  pc: number // prev close
}

export interface FinnhubCandle {
  c: number[]
  h: number[]
  l: number[]
  o: number[]
  t: number[]
  v: number[]
  s: string
}

export interface FinnhubEarnings {
  actual: number | null
  estimate: number | null
  period: string
  quarter: number
  surprise: number | null
  surprisePercent: number | null
  symbol: string
  year: number
}

export interface FinnhubNews {
  category: string
  datetime: number
  headline: string
  id: number
  image: string
  related: string
  source: string
  summary: string
  url: string
}

export interface FinnhubSearchResult {
  description: string
  displaySymbol: string
  symbol: string
  type: string
}

export async function searchSymbol(query: string): Promise<FinnhubSearchResult[]> {
  const data = await get<{ count: number; result: FinnhubSearchResult[] }>('/search', { q: query })
  return (data.result ?? []).filter(r => r.type === 'Common Stock').slice(0, 8)
}

export async function getProfile(ticker: string): Promise<FinnhubProfile> {
  return get<FinnhubProfile>('/stock/profile2', { symbol: ticker })
}

export async function getQuote(ticker: string): Promise<FinnhubQuote> {
  return get<FinnhubQuote>('/quote', { symbol: ticker })
}

export async function getPriceHistory(ticker: string): Promise<FinnhubCandle> {
  const to = Math.floor(Date.now() / 1000)
  const from = to - 365 * 24 * 3600
  return get<FinnhubCandle>('/stock/candle', {
    symbol: ticker,
    resolution: 'D',
    from: String(from),
    to: String(to),
  })
}

export async function getEarnings(ticker: string): Promise<FinnhubEarnings[]> {
  const data = await get<FinnhubEarnings[]>('/stock/earnings', { symbol: ticker, limit: '8' })
  return Array.isArray(data) ? data : []
}

export async function getCompanyNews(ticker: string): Promise<FinnhubNews[]> {
  const to = new Date().toISOString().split('T')[0]
  const from = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
  const data = await get<FinnhubNews[]>('/company-news', { symbol: ticker, from, to })
  return Array.isArray(data) ? data.slice(0, 15) : []
}

export interface RatioData {
  pe: number | null
  pb: number | null
  roe: number | null
  roa: number | null
  currentRatio: number | null
  debtEquity: number | null
  netMargin: number | null
}

export async function getRatios(ticker: string): Promise<RatioData> {
  const data = await get<{ metric: Record<string, number | null> }>('/stock/metric', { symbol: ticker, metric: 'all' })
  const m = data.metric ?? {}
  const num = (v: number | null | undefined): number | null => (v != null && isFinite(v) ? +v.toFixed(2) : null)
  return {
    pe: num(m['peBasicExclExtraTTM'] ?? m['peNormalizedAnnual']),
    pb: num(m['pbQuarterly'] ?? m['pbAnnual']),
    roe: num(m['roeTTM']),
    roa: num(m['roaTTM']),
    currentRatio: num(m['currentRatioQuarterly'] ?? m['currentRatioAnnual']),
    debtEquity: num(m['totalDebt/totalEquityAnnual']),
    netMargin: num(m['netProfitMarginTTM']),
  }
}
