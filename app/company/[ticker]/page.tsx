import Link from 'next/link'
import { ArrowLeft, Globe, TrendingUp, TrendingDown } from 'lucide-react'
import StockPriceChart from '@/components/charts/StockPriceChart'
import RevenueChart from '@/components/charts/RevenueChart'
import EarningsChart from '@/components/charts/EarningsChart'
import RatiosRadar from '@/components/charts/RatiosRadar'
import MarginsChart from '@/components/charts/MarginsChart'
import NewsSection from '@/components/NewsSection'
import FilingsSection from '@/components/FilingsSection'

async function getCompany(ticker: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}/api/company?ticker=${ticker}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

function fmtMarketCap(v: number) {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}T`
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}B`
  return `$${v.toFixed(0)}M`
}

export default async function CompanyDetailPage(props: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await props.params
  const symbol = ticker.toUpperCase()
  const company = await getCompany(symbol)

  const isPositive = company ? company.changePercent >= 0 : false

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-3">
            <ArrowLeft size={14} /> Back to dashboard
          </Link>

          {company ? (
            <div className="flex flex-wrap items-start gap-4">
              {company.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={company.logo} alt={company.name} className="w-12 h-12 rounded-lg object-contain border border-gray-100 p-1" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                  <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{symbol}</span>
                  {company.exchange && <span className="text-xs text-gray-400">{company.exchange}</span>}
                </div>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  {company.sector && <span className="text-sm text-gray-500">{company.sector}</span>}
                  {company.marketCap && <span className="text-sm text-gray-500">Mkt Cap: {fmtMarketCap(company.marketCap)}</span>}
                  {company.website && (
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                      <Globe size={12} /> Website
                    </a>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-3xl font-bold text-gray-900">${company.price?.toFixed(2)}</div>
                <div className={`flex items-center gap-1 justify-end text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {isPositive ? '+' : ''}{company.changePercent?.toFixed(2)}% today
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{symbol}</h1>
              <p className="text-sm text-red-500 mt-1">Could not load company data — check your API key in .env.local</p>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Stock Price — 1 Year</h2>
          <StockPriceChart ticker={symbol} />
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Annual Revenue &amp; Net Income</h2>
            <RevenueChart ticker={symbol} />
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Earnings Per Share — Actual vs. Estimated</h2>
            <EarningsChart ticker={symbol} />
          </section>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-1">Key Financial Ratios</h2>
            <p className="text-xs text-gray-400 mb-4">Normalized scale — hover for raw values</p>
            <RatiosRadar ticker={symbol} />
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Profit Margins — Quarterly Trend</h2>
            <MarginsChart ticker={symbol} />
          </section>
        </div>

        <NewsSection ticker={symbol} name={company?.name ?? symbol} />
        <FilingsSection ticker={symbol} />
      </main>
    </div>
  )
}
