'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, X, Loader2 } from 'lucide-react'
import CompareRadar from '@/components/charts/CompareRadar'
import CompareTable from '@/components/CompareTable'

interface RatioData {
  pe: number | null; pb: number | null; roe: number | null
  roa: number | null; currentRatio: number | null; debtEquity: number | null; netMargin: number | null
}
interface FinancialRow { year: string; revenue: number | null; netIncome: number | null }
interface SearchResult { symbol: string; description: string }

const COLORS = ['#00d4ff', '#ffd700', '#00ff88']

function ComparePageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const initialTickers = (['a', 'b', 'c'] as const)
    .map(k => searchParams.get(k))
    .filter((t): t is string => t != null && t.length > 0)

  const [tickers, setTickers] = useState<string[]>(initialTickers)
  const [ratios, setRatios] = useState<(RatioData | null)[]>([])
  const [financials, setFinancials] = useState<(FinancialRow[] | null)[]>([])
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)

  // Fetch data whenever tickers change
  useEffect(() => {
    if (!tickers.length) { setRatios([]); setFinancials([]); return }
    setLoading(true)
    Promise.all([
      Promise.all(tickers.map(t =>
        fetch(`/api/ratios?ticker=${t}`).then(r => r.json()).catch(() => null)
      )),
      Promise.all(tickers.map(t =>
        fetch(`/api/financials?ticker=${t}`).then(r => r.json()).catch(() => null)
      )),
    ]).then(([r, f]) => { setRatios(r); setFinancials(f) })
      .finally(() => setLoading(false))
  }, [tickers])

  // Sync URL with tickers
  useEffect(() => {
    const params = new URLSearchParams()
    tickers.forEach((t, i) => params.set(['a', 'b', 'c'][i], t))
    router.replace(`/compare${tickers.length ? '?' + params.toString() : ''}`, { scroll: false })
  }, [tickers, router])

  // Debounced search
  useEffect(() => {
    if (!searchInput.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchInput)}`)
        const data = await res.json()
        setSearchResults(Array.isArray(data) ? data.slice(0, 6) : [])
      } catch { /* ignore */ }
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  function addTicker(symbol: string) {
    if (tickers.includes(symbol) || tickers.length >= 3) return
    setTickers(prev => [...prev, symbol])
    setSearchInput('')
    setSearchResults([])
  }

  function removeTicker(symbol: string) {
    setTickers(prev => prev.filter(t => t !== symbol))
  }

  return (
    <div className="min-h-screen bg-[#060e1f]">
      <header className="bg-[#0a1628] border-b border-[#1e3a5f] px-6 py-4 shadow-lg">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#4a7fa5] hover:text-cyan-400 mb-3 transition-colors">
            <ArrowLeft size={14} /> Back to dashboard
          </Link>
          <h1 className="text-xl font-bold text-white">Company Comparison</h1>
          <p className="text-xs text-[#4a7fa5] mt-0.5">Compare up to 3 companies side by side</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Ticker selector */}
        <div className="bg-[#0d1b2e] rounded-2xl border border-[#1e3a5f] p-5">
          <div className="flex flex-wrap gap-2 items-center">
            {tickers.map((t, i) => (
              <div
                key={t}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
                style={{ background: `${COLORS[i]}18`, color: COLORS[i], border: `1px solid ${COLORS[i]}40` }}
              >
                {t}
                <button onClick={() => removeTicker(t)} className="hover:opacity-70 transition-opacity">
                  <X size={12} />
                </button>
              </div>
            ))}

            {tickers.length < 3 && (
              <div className="relative">
                <div className="flex items-center gap-2 bg-[#060e1f] border border-[#1e3a5f] rounded-full px-3 py-1.5 focus-within:border-cyan-600 transition-colors">
                  <Search size={13} className="text-[#4a7fa5] shrink-0" />
                  <input
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    placeholder="Add ticker…"
                    className="bg-transparent text-sm text-white placeholder-[#2a4a6a] focus:outline-none w-28"
                  />
                  {searching && <Loader2 size={12} className="text-[#4a7fa5] animate-spin shrink-0" />}
                </div>
                {searchResults.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 w-72 bg-[#0d1b2e] border border-[#1e3a5f] rounded-xl shadow-xl z-20 overflow-hidden">
                    {searchResults.map(r => (
                      <button
                        key={r.symbol}
                        onClick={() => addTicker(r.symbol)}
                        className="w-full text-left px-3 py-2 hover:bg-[#1e3a5f] flex items-center gap-2 transition-colors"
                      >
                        <span className="text-xs font-mono font-bold text-cyan-300 shrink-0">{r.symbol}</span>
                        <span className="text-xs text-[#4a7fa5] truncate">{r.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tickers.length === 0 && (
              <span className="text-xs text-[#4a7fa5]">Search for a company to start comparing</span>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            <div className="h-72 bg-[#0a1628] rounded-2xl animate-pulse" />
            <div className="h-64 bg-[#0a1628] rounded-2xl animate-pulse" />
          </div>
        )}

        {/* Charts */}
        {!loading && tickers.length > 0 && (
          <>
            <div className="bg-[#0d1b2e] rounded-2xl border border-[#1e3a5f] p-6">
              <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-widest mb-4">Financial Ratios Overlay</h2>
              <CompareRadar tickers={tickers} ratios={ratios} />
            </div>

            <div className="bg-[#0d1b2e] rounded-2xl border border-[#1e3a5f] p-6">
              <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-widest mb-4">Metrics Head-to-Head</h2>
              <CompareTable tickers={tickers} ratios={ratios} financials={financials} />
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060e1f]" />}>
      <ComparePageInner />
    </Suspense>
  )
}
