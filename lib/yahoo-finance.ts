const CHART = 'https://query1.finance.yahoo.com/v8/finance/chart'
const TIMESERIES = 'https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
}

// period1/period2 covers 2015–2030
const TS_RANGE = 'period1=1420070400&period2=1893456000'

async function fetchChart(ticker: string): Promise<unknown> {
  const url = `${CHART}/${ticker}?interval=1d&range=1y`
  const res = await fetch(url, { headers: HEADERS, next: { revalidate: 900 } })
  if (res.status === 404 || res.status === 422) throw new Error('No data found')
  if (!res.ok) throw new Error(`Yahoo Finance chart ${res.status}`)
  return res.json()
}

async function fetchTimeseries(ticker: string, types: string): Promise<unknown> {
  const url = `${TIMESERIES}/${ticker}?symbol=${ticker}&type=${encodeURIComponent(types)}&${TS_RANGE}`
  const res = await fetch(url, { headers: HEADERS, next: { revalidate: 3600 } })
  if (res.status === 404 || res.status === 422) throw new Error('No data found')
  if (!res.ok) throw new Error(`Yahoo Finance timeseries ${res.status}`)
  return res.json()
}

interface TsEntry { asOfDate: string; reportedValue: { raw: number } }
interface TsResult { meta: { type: string[] }; [key: string]: unknown }

function extractSeries(results: TsResult[], typeKey: string): Map<string, number> {
  const map = new Map<string, number>()
  const r = results.find(x => x.meta.type[0] === typeKey)
  if (!r) return map
  const entries = r[typeKey] as TsEntry[] | undefined
  if (!Array.isArray(entries)) return map
  for (const e of entries) {
    map.set(e.asOfDate, e.reportedValue.raw)
  }
  return map
}

export interface PricePoint { date: string; close: number }

export async function getPriceHistory(ticker: string): Promise<PricePoint[]> {
  const json = await fetchChart(ticker) as { chart: { result: Array<{ timestamp: number[]; indicators: { quote: Array<{ close: number[] }> } }> } }
  const result = json.chart?.result?.[0]
  if (!result) throw new Error('No price data')
  const { timestamp, indicators } = result
  const closes = indicators.quote[0].close
  return timestamp
    .map((ts, i) => ({ date: new Date(ts * 1000).toISOString().split('T')[0], close: closes[i] }))
    .filter(d => d.close != null)
}

export interface AnnualFinancials {
  year: string
  revenue: number | null
  netIncome: number | null
  grossProfit: number | null
  operatingIncome: number | null
}

export async function getAnnualFinancials(ticker: string): Promise<AnnualFinancials[]> {
  const json = await fetchTimeseries(
    ticker,
    'annualTotalRevenue,annualNetIncome,annualGrossProfit,annualOperatingIncome'
  ) as { timeseries: { result: TsResult[] } }

  const results = json.timeseries?.result ?? []
  const revMap = extractSeries(results, 'annualTotalRevenue')
  const niMap = extractSeries(results, 'annualNetIncome')
  const gpMap = extractSeries(results, 'annualGrossProfit')
  const oiMap = extractSeries(results, 'annualOperatingIncome')

  const dates = [...new Set([...revMap.keys(), ...niMap.keys()])]
    .sort()
    .slice(-5)

  return dates.map(date => ({
    year: `FY${date.slice(0, 4)}`,
    revenue: revMap.get(date) ?? null,
    netIncome: niMap.get(date) ?? null,
    grossProfit: gpMap.get(date) ?? null,
    operatingIncome: oiMap.get(date) ?? null,
  }))
}

export interface QuarterlyMargin {
  period: string
  date: string
  grossMargin: number | null
  operatingMargin: number | null
  netMargin: number | null
}

export async function getQuarterlyMargins(ticker: string): Promise<QuarterlyMargin[]> {
  const json = await fetchTimeseries(
    ticker,
    'quarterlyTotalRevenue,quarterlyGrossProfit,quarterlyOperatingIncome,quarterlyNetIncome'
  ) as { timeseries: { result: TsResult[] } }

  const results = json.timeseries?.result ?? []
  const revMap = extractSeries(results, 'quarterlyTotalRevenue')
  const gpMap = extractSeries(results, 'quarterlyGrossProfit')
  const oiMap = extractSeries(results, 'quarterlyOperatingIncome')
  const niMap = extractSeries(results, 'quarterlyNetIncome')

  const dates = [...new Set([...revMap.keys()])]
    .sort()
    .slice(-8)

  return dates.map(date => {
    const dt = new Date(date)
    const q = Math.floor(dt.getUTCMonth() / 3) + 1
    const period = `Q${q} '${String(dt.getUTCFullYear()).slice(2)}`
    const rev = revMap.get(date) ?? null
    const gp = gpMap.get(date) ?? null
    const oi = oiMap.get(date) ?? null
    const ni = niMap.get(date) ?? null
    return {
      period,
      date,
      grossMargin: rev && gp != null ? +((gp / rev) * 100).toFixed(1) : null,
      operatingMargin: rev && oi != null ? +((oi / rev) * 100).toFixed(1) : null,
      netMargin: rev && ni != null ? +((ni / rev) * 100).toFixed(1) : null,
    }
  })
}
