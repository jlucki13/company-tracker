'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, FileText } from 'lucide-react'

interface Filing {
  type: string
  date: string
  description: string
  url: string
}

function typeBadgeClass(type: string) {
  if (type === '10-K') return 'bg-indigo-100 text-indigo-700'
  if (type === '10-Q') return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-600'
}

export default function FilingsSection({ ticker }: { ticker: string }) {
  const [filings, setFilings] = useState<Filing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/filings?ticker=${ticker}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setFilings(Array.isArray(d) ? d : []) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [ticker])

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={16} className="text-gray-500" />
        <h2 className="text-base font-semibold text-gray-800">Recent SEC Filings</h2>
        <span className="text-xs text-gray-400">via EDGAR</span>
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-100 animate-pulse rounded-lg" />)}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
      {!loading && !error && filings.length === 0 && <p className="text-sm text-gray-400">No filings found.</p>}

      {!loading && !error && filings.length > 0 && (
        <div className="divide-y divide-gray-100">
          {filings.map((f, i) => (
            <a
              key={i}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors group"
            >
              <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded ${typeBadgeClass(f.type)}`}>{f.type}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-700">{f.description}</p>
                <p className="text-xs text-gray-400">{f.date}</p>
              </div>
              <ExternalLink size={13} className="shrink-0 text-gray-300 group-hover:text-indigo-400" />
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
