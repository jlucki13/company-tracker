const BASE = 'https://financialmodelingprep.com/api/v3'

function key() {
  const k = process.env.FMP_API_KEY
  if (!k || k === 'your_fmp_key_here') throw new Error('FMP_API_KEY not set')
  return k
}

async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('apikey', key())
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
  if (res.status === 429) throw new Error('RATE_LIMIT')
  if (!res.ok) throw new Error(`FMP ${res.status}`)
  return res.json()
}

export interface FMPIncomeStatement {
  date: string
  symbol: string
  reportedCurrency: string
  period: string
  revenue: number
  netIncome: number
  grossProfit: number
  operatingIncome: number
  grossProfitRatio: number
  operatingIncomeRatio: number
  netIncomeRatio: number
  eps: number
  ebitda: number
}

export interface FMPRatios {
  symbol: string
  date: string
  period: string
  priceEarningsRatio: number
  priceToBookRatio: number
  returnOnEquity: number
  returnOnAssets: number
  currentRatio: number
  debtEquityRatio: number
  netProfitMargin: number
}

export async function getAnnualIncome(ticker: string): Promise<FMPIncomeStatement[]> {
  const data = await get<FMPIncomeStatement[]>(`/income-statement/${ticker}`, { limit: '5' })
  return Array.isArray(data) ? data : []
}

export async function getQuarterlyIncome(ticker: string): Promise<FMPIncomeStatement[]> {
  const data = await get<FMPIncomeStatement[]>(`/income-statement/${ticker}`, {
    period: 'quarter',
    limit: '8',
  })
  return Array.isArray(data) ? data : []
}

export async function getRatios(ticker: string): Promise<FMPRatios | null> {
  const data = await get<FMPRatios[]>(`/ratios-ttm/${ticker}`)
  return Array.isArray(data) && data.length > 0 ? data[0] : null
}
