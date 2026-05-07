'use client'

import { useEffect, useState, useCallback } from 'react'
import CompanyCard, { type CompanyCardData } from './CompanyCard'
import CompanySearch from './CompanySearch'
import { Building2 } from 'lucide-react'

interface StoredCompany {
  id: string
  ticker: string
  name: string
  rank: number
}

export default function TopTenList() {
  const [companies, setCompanies] = useState<CompanyCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadCompanies = useCallback(async () => {
    const res = await fetch('/api/companies')
    const stored: StoredCompany[] = await res.json()
    if (!stored.length) { setCompanies([]); setLoading(false); return }
    const enriched = await Promise.all(stored.map(async c => {
      try {
        const r = await fetch(`/api/company?ticker=${c.ticker}`)
        if (!r.ok) return { ...c, price: undefined, changePercent: undefined }
        const d = await r.json()
        return { ...c, price: d.price, changePercent: d.changePercent, sector: d.sector, logo: d.logo }
      } catch {
        return { ...c }
      }
    }))
    setCompanies(enriched)
    setLoading(false)
  }, [])

  useEffect(() => { loadCompanies() }, [loadCompanies])

  async function handleAdd(ticker: string, name: string) {
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker, name }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Failed to add')
    showToast(`${ticker} added to your list`)
    await loadCompanies()
  }

  async function handleRemove(ticker: string) {
    const res = await fetch(`/api/companies?ticker=${ticker}`, { method: 'DELETE' })
    if (!res.ok) { showToast('Failed to remove', 'error'); return }
    showToast(`${ticker} removed`)
    setCompanies(prev => {
      const filtered = prev.filter(c => c.ticker !== ticker)
      return filtered.map((c, i) => ({ ...c, rank: i + 1 }))
    })
  }

  async function reorder(newOrder: CompanyCardData[]) {
    const ranked = newOrder.map((c, i) => ({ ...c, rank: i + 1 }))
    setCompanies(ranked)
    await fetch('/api/companies', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ranked.map(c => ({ ticker: c.ticker, rank: c.rank }))),
    })
  }

  function handleMoveUp(ticker: string) {
    const idx = companies.findIndex(c => c.ticker === ticker)
    if (idx <= 0) return
    const next = [...companies]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    reorder(next)
  }

  function handleMoveDown(ticker: string) {
    const idx = companies.findIndex(c => c.ticker === ticker)
    if (idx >= companies.length - 1) return
    const next = [...companies]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    reorder(next)
  }

  return (
    <div className="space-y-4">
      <CompanySearch existingTickers={companies.map(c => c.ticker)} onAdd={handleAdd} />

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-600'}`}>
          {toast.msg}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 size={48} className="text-gray-700 mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-1">No companies tracked yet</h3>
          <p className="text-sm text-gray-600 max-w-sm">
            Search for a company above and click <strong className="text-gray-400">Add</strong> to start building your Top 10 list.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {companies.map(c => (
            <CompanyCard
              key={c.ticker}
              company={c}
              total={companies.length}
              onRemove={handleRemove}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          ))}
          <p className="text-xs text-gray-600 text-right pt-1">{companies.length}/10 slots used</p>
        </div>
      )}
    </div>
  )
}
