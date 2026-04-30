'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, Plus, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SearchResult {
  symbol: string
  description: string
  displaySymbol: string
}

interface Props {
  existingTickers: string[]
  onAdd: (ticker: string, name: string) => Promise<void>
}

export default function CompanySearch({ existingTickers, onAdd }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const search = useCallback(async (q: string) => {
    if (q.length < 1) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(Array.isArray(data) ? data : [])
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(query), 300)
    return () => clearTimeout(t)
  }, [query, search])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node) && !inputRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function handleAdd(symbol: string, description: string) {
    setAdding(symbol)
    setError(null)
    try {
      await onAdd(symbol, description)
      setQuery('')
      setOpen(false)
      setResults([])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add company')
    } finally {
      setAdding(null)
    }
  }

  return (
    <div className="relative w-full max-w-xl">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setError(null) }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search by company name or ticker…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {open && results.length > 0 && (
        <div ref={dropdownRef} className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          {results.map(r => {
            const alreadyAdded = existingTickers.includes(r.symbol)
            return (
              <div key={r.symbol} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm text-gray-900 font-mono">{r.displaySymbol}</span>
                  <span className="ml-2 text-sm text-gray-600 truncate">{r.description}</span>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <button
                    onClick={() => router.push(`/company/${r.symbol}`)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50"
                  >
                    View <ExternalLink size={11} />
                  </button>
                  <button
                    onClick={() => handleAdd(r.symbol, r.description)}
                    disabled={alreadyAdded || adding === r.symbol}
                    className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {adding === r.symbol ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : alreadyAdded ? (
                      'Added'
                    ) : (
                      <><Plus size={11} /> Add</>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
