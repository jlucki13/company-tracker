import Link from 'next/link'
import { ArrowLeft, Globe, TrendingUp, TrendingDown } from 'lucide-react'
import StockPriceChart from '@/components/charts/StockPriceChart'
import RevenueChart from '@/components/charts/RevenueChart'
import EarningsChart from '@/components/charts/EarningsChart'
import RatiosRadar from '@/components/charts/RatiosRadar'
import MarginsChart from '@/components/charts/MarginsChart'
import NewsSection from '@/components/NewsSection'
import FilingsSection from '@/components/FilingsSection'
import { getProfile, getQuote } from '@/lib/finnhub'

async function getCompany(ticker: string) {
  try {
    const [profile, quote] = await Promise.all([getProfile(ticker), getQuote(ticker)])
    if (!profile.name) return null
    return {
      ticker,
      name: profile.name,
      exchange: profile.exchange,
      sector: profile.finnhubIndustry,
      logo: profile.logo,
      website: profile.weburl,
      marketCap: profile.marketCapitalization,
      currency: profile.currency,
      price: quote.c,
      change: quote.d,
      changePercent: quote.dp,
      high: quote.h,
      low: quote.l,
      prevClose: quote.pc,
    }
  } catch {
    return null
  }
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
    <div className="min-h-screen bg-[#060e1f]">
      <header className="bg-[#0a1628] border-b border-[#1e3a5f] px-6 py-4 shadow-lg">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#4a7fa5] hover:text-cyan-400 mb-3 transition-colors">
            <ArrowLeft size={14} /> Back to dashboard
          </Link>

          {company ? (
            <div className="flex flex-wrap items-start gap-4">
              {company.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={company.logo} alt={company.name} className="w-12 h-12 rounded-lg object-contain bg-[#0d1b2e] border border-[#1e3a5f] p-1" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-white">{company.name}</h1>
                  <span className="text-sm font-mono bg-[#1e3a5f] px-2 py-0.5 rounded text-cyan-300">{symbol}</span>
                  {company.exchange && <span className="text-xs text-[#4a7fa5]">{company.exchange}</span>}
                </div>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  {company.sector && <span className="text-sm text-[#4a7fa5]">{company.sector}</span>}
                  {company.marketCap && <span className="text-sm text-[#4a7fa5]">Mkt Cap: {fmtMarketCap(company.marketCap)}</span>}
                  {company.website && (
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 hover:underline">
                      <Globe size={12} /> Website
                    </a>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-3xl font-bold text-white">${company.price?.toFixed(2)}</div>
                <div className={`flex items-center gap-1 justify-end text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {isPositive ? '+' : ''}{company.changePercent?.toFixed(2)}% today
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-white">{symbol}</h1>
              <p className="text-sm text-red-400 mt-1">Could not load company data — check your API key in .env.local</p>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <section className="bg-[#0d1b2e] rounded-2xl border border-[#1e3a5f] p-6">
          <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-widest mb-4">Stock Price — 1 Year</h2>
          <StockPriceChart ticker={symbol} />
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-[#0d1b2e] rounded-2xl border border-[#1e3a5f] p-6">
            <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-widest mb-4">Annual Revenue &amp; Net Income</h2>
            <RevenueChart ticker={symbol} />
          </section>

          <section className="bg-[#0d1b2e] rounded-2xl border border-[#1e3a5f] p-6">
            <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-widest mb-4">EPS — Actual vs. Estimated</h2>
            <EarningsChart ticker={symbol} />
          </section>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-[#0d1b2e] rounded-2xl border border-[#1e3a5f] p-6">
            <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-widest mb-4">Key Financial Ratios</h2>
            <RatiosRadar ticker={symbol} />
          </section>

          <section className="bg-[#0d1b2e] rounded-2xl border border-[#1e3a5f] p-6">
            <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-widest mb-4">Profit Margins — Quarterly</h2>
            <MarginsChart ticker={symbol} />
          </section>
        </div>

        <NewsSection ticker={symbol} name={company?.name ?? symbol} />
        <FilingsSection ticker={symbol} />
      </main>
    </div>
  )
}
