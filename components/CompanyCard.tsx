'use client'

import { ChevronUp, ChevronDown, X, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export interface CompanyCardData {
  id: string
  ticker: string
  name: string
  rank: number
  price?: number
  changePercent?: number
  sector?: string
  logo?: string
}

interface Props {
  company: CompanyCardData
  total: number
  onRemove: (ticker: string) => void
  onMoveUp: (ticker: string) => void
  onMoveDown: (ticker: string) => void
}

export default function CompanyCard({ company, total, onRemove, onMoveUp, onMoveDown }: Props) {
  const isPositive = (company.changePercent ?? 0) >= 0

  return (
    <div className="flex items-center gap-3 bg-gray-900 rounded-xl border border-gray-800 px-4 py-3 shadow-sm hover:border-gray-700 hover:bg-gray-800/80 transition-all">
      <div className="flex flex-col gap-0.5">
        <button
          onClick={() => onMoveUp(company.ticker)}
          disabled={company.rank === 1}
          className="p-0.5 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed"
          aria-label="Move up"
        >
          <ChevronUp size={14} />
        </button>
        <button
          onClick={() => onMoveDown(company.ticker)}
          disabled={company.rank === total}
          className="p-0.5 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed"
          aria-label="Move down"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      <span className="text-xs font-medium text-gray-600 w-5 text-center">{company.rank}</span>

      {company.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={company.logo} alt={company.name} className="w-8 h-8 rounded object-contain bg-gray-800 p-0.5" />
      ) : (
        <div className="w-8 h-8 rounded bg-indigo-900/60 flex items-center justify-center text-xs font-bold text-indigo-400">
          {company.ticker.slice(0, 2)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-white truncate">{company.name}</span>
          <span className="text-xs text-gray-500 font-mono">{company.ticker}</span>
        </div>
        {company.sector && <div className="text-xs text-gray-600 truncate">{company.sector}</div>}
      </div>

      <div className="text-right shrink-0">
        {company.price != null ? (
          <>
            <div className="text-sm font-semibold text-white">${company.price.toFixed(2)}</div>
            <div className={`text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{company.changePercent?.toFixed(2)}%
            </div>
          </>
        ) : (
          <div className="text-xs text-gray-600">Loading...</div>
        )}
      </div>

      <Link
        href={`/company/${company.ticker}`}
        className="shrink-0 flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1 rounded hover:bg-indigo-900/40"
      >
        Details <ExternalLink size={12} />
      </Link>

      <button
        onClick={() => onRemove(company.ticker)}
        className="shrink-0 p-1 rounded hover:bg-red-900/40 text-gray-600 hover:text-red-400"
        aria-label={`Remove ${company.ticker}`}
      >
        <X size={14} />
      </button>
    </div>
  )
}
