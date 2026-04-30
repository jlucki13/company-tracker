'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Newspaper } from 'lucide-react'

interface NewsItem {
  title: string
  url: string
  source: string
  datetime: number
  sentiment?: string
}

function sentimentClass(s?: string) {
  if (s === 'Positive') return 'bg-emerald-100 text-emerald-700'
  if (s === 'Negative') return 'bg-red-100 text-red-600'
  return 'bg-gray-100 text-gray-500'
}

function fmtTime(ts: number) {
  const d = new Date(ts * 1000)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function NewsSection({ ticker, name }: { ticker: string; name: string }) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/news?ticker=${ticker}&name=${encodeURIComponent(name)}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setNews(Array.isArray(d) ? d : []) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [ticker, name])

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper size={16} className="text-gray-500" />
        <h2 className="text-base font-semibold text-gray-800">Latest News &amp; Announcements</h2>
        {!loading && !error && <span className="text-xs text-gray-400">{news.length} stories</span>}
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-lg" />)}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && news.length === 0 && (
        <p className="text-sm text-gray-400">No recent news found.</p>
      )}

      {!loading && !error && news.length > 0 && (
        <div className="divide-y divide-gray-100">
          {news.map((item, i) => (
            <a
              key={`${item.url}-${i}`}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 line-clamp-2">{item.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-gray-400">{item.source}</span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">{fmtTime(item.datetime)}</span>
                  {item.sentiment && (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${sentimentClass(item.sentiment)}`}>
                      {item.sentiment}
                    </span>
                  )}
                </div>
              </div>
              <ExternalLink size={13} className="shrink-0 text-gray-300 group-hover:text-indigo-400 mt-0.5" />
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
