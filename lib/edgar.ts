const BASE = 'https://efts.sec.gov/LATEST/search-index'
const SUBMISSIONS = 'https://data.sec.gov/submissions'
const SEARCH = 'https://efts.sec.gov/LATEST/search-index?q=%22{ticker}%22&dateRange=custom&startdt={from}&enddt={to}&forms=8-K,10-Q,10-K'

export interface EdgarFiling {
  type: string
  date: string
  description: string
  url: string
}

async function getCik(ticker: string): Promise<string | null> {
  const res = await fetch(`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=&CIK=${ticker}&type=&dateb=&owner=include&count=1&search_text=&action=getcompany`, {
    headers: { 'User-Agent': 'company-tracker jordan.lucki@accenture.com' },
    next: { revalidate: 86400 },
  })
  if (!res.ok) return null
  const html = await res.text()
  const match = html.match(/CIK=(\d+)/)
  return match ? match[1].padStart(10, '0') : null
}

export async function getFilings(ticker: string): Promise<EdgarFiling[]> {
  const cik = await getCik(ticker)
  if (!cik) return []

  const res = await fetch(`${SUBMISSIONS}/CIK${cik}.json`, {
    headers: { 'User-Agent': 'company-tracker jordan.lucki@accenture.com' },
    next: { revalidate: 3600 },
  })
  if (!res.ok) return []

  const data = await res.json()
  const recent = data?.filings?.recent
  if (!recent) return []

  const { form, filingDate, primaryDocument, accessionNumber } = recent as {
    form: string[]
    filingDate: string[]
    primaryDocument: string[]
    accessionNumber: string[]
  }

  const results: EdgarFiling[] = []
  for (let i = 0; i < form.length && results.length < 5; i++) {
    if (['8-K', '10-K', '10-Q'].includes(form[i])) {
      const acc = accessionNumber[i].replace(/-/g, '')
      results.push({
        type: form[i],
        date: filingDate[i],
        description: form[i] === '8-K' ? 'Current Report' : form[i] === '10-K' ? 'Annual Report' : 'Quarterly Report',
        url: `https://www.sec.gov/Archives/edgar/data/${parseInt(cik)}/${acc}/${primaryDocument[i]}`,
      })
    }
  }
  return results
}
