import TopTenList from '@/components/TopTenList'
import { BarChart2 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <BarChart2 size={24} className="text-indigo-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Company Tracker</h1>
            <p className="text-xs text-gray-400">Monitor your top consulting clients</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <TopTenList />
      </main>
    </div>
  )
}
