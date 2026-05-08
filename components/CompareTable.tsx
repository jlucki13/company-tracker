interface RatioData {
  pe: number | null
  pb: number | null
  roe: number | null
  roa: number | null
  currentRatio: number | null
  debtEquity: number | null
  netMargin: number | null
}

interface FinancialRow {
  year: string
  revenue: number | null
  netIncome: number | null
}

type RatioKey = keyof RatioData

const RATIO_ROWS: { key: RatioKey; label: string; fmt: (v: number) => string; higherBetter: boolean }[] = [
  { key: 'pe',           label: 'P/E Ratio',      fmt: v => `${v.toFixed(1)}x`,  higherBetter: false },
  { key: 'pb',           label: 'P/B Ratio',      fmt: v => `${v.toFixed(1)}x`,  higherBetter: false },
  { key: 'roe',          label: 'ROE',             fmt: v => `${v.toFixed(1)}%`,  higherBetter: true  },
  { key: 'roa',          label: 'ROA',             fmt: v => `${v.toFixed(1)}%`,  higherBetter: true  },
  { key: 'currentRatio', label: 'Current Ratio',  fmt: v => v.toFixed(2),         higherBetter: true  },
  { key: 'debtEquity',   label: 'Debt / Equity',  fmt: v => v.toFixed(2),         higherBetter: false },
  { key: 'netMargin',    label: 'Net Margin',     fmt: v => `${v.toFixed(1)}%`,   higherBetter: true  },
]

const COLORS = ['text-cyan-400', 'text-yellow-400', 'text-emerald-400']

function fmtLarge(v: number | null): string {
  if (v == null) return '—'
  const abs = Math.abs(v)
  if (abs >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
  if (abs >= 1e9)  return `$${(v / 1e9).toFixed(1)}B`
  if (abs >= 1e6)  return `$${(v / 1e6).toFixed(1)}M`
  return `$${v.toFixed(0)}`
}

function winnerIdx(vals: (number | null)[], higherBetter: boolean): number {
  let best = -1
  let bestVal: number | null = null
  vals.forEach((v, i) => {
    if (v == null) return
    if (bestVal == null || (higherBetter ? v > bestVal : v < bestVal)) { bestVal = v; best = i }
  })
  return best
}

export default function CompareTable({ tickers, ratios, financials }: {
  tickers: string[]
  ratios: (RatioData | null)[]
  financials: (FinancialRow[] | null)[]
}) {
  const latestRevenues = tickers.map((_, i) => financials[i]?.[0]?.revenue ?? null)
  const latestNetIncome = tickers.map((_, i) => financials[i]?.[0]?.netIncome ?? null)
  const revenueWinner = winnerIdx(latestRevenues, true)
  const niWinner = winnerIdx(latestNetIncome, true)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-[#1e3a5f]">
            <th className="text-left py-2 pr-6 text-xs text-[#4a7fa5] font-medium uppercase tracking-wide w-36">Metric</th>
            {tickers.map((t, i) => (
              <th key={t} className={`text-right py-2 px-3 text-sm font-bold ${COLORS[i % COLORS.length]}`}>{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RATIO_ROWS.map(row => {
            const vals = ratios.map(r => r?.[row.key] ?? null)
            const winner = winnerIdx(vals, row.higherBetter)
            return (
              <tr key={row.key} className="border-b border-[#1e3a5f]/40 hover:bg-white/[0.02]">
                <td className="py-2.5 pr-6 text-[#4a7fa5] text-xs">{row.label}</td>
                {vals.map((v, i) => {
                  const isWinner = i === winner && v != null
                  return (
                    <td key={i} className="text-right py-2.5 px-3">
                      {v != null ? (
                        <span className={`font-mono text-xs ${isWinner ? `${COLORS[i % COLORS.length]} font-bold` : 'text-gray-400'}`}>
                          {row.fmt(v)}{isWinner ? ' ✦' : ''}
                        </span>
                      ) : <span className="text-gray-700 text-xs">—</span>}
                    </td>
                  )
                })}
              </tr>
            )
          })}
          <tr className="border-b border-[#1e3a5f]/40 hover:bg-white/[0.02]">
            <td className="py-2.5 pr-6 text-[#4a7fa5] text-xs">Latest Revenue</td>
            {latestRevenues.map((v, i) => (
              <td key={i} className="text-right py-2.5 px-3">
                <span className={`font-mono text-xs ${i === revenueWinner && v != null ? `${COLORS[i % COLORS.length]} font-bold` : 'text-gray-400'}`}>
                  {fmtLarge(v)}{i === revenueWinner && v != null ? ' ✦' : ''}
                </span>
              </td>
            ))}
          </tr>
          <tr className="hover:bg-white/[0.02]">
            <td className="py-2.5 pr-6 text-[#4a7fa5] text-xs">Latest Net Income</td>
            {latestNetIncome.map((v, i) => (
              <td key={i} className="text-right py-2.5 px-3">
                <span className={`font-mono text-xs ${i === niWinner && v != null ? `${COLORS[i % COLORS.length]} font-bold` : v != null && v < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                  {fmtLarge(v)}{i === niWinner && v != null ? ' ✦' : ''}
                </span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="text-[10px] text-gray-700 mt-3">✦ indicates best value per metric</p>
    </div>
  )
}
