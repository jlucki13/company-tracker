import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export interface Company {
  id: string
  ticker: string
  name: string
  rank: number
  addedAt: string
}

const STORE = join(process.cwd(), 'data', 'companies.json')

function ensureDir() {
  const dir = join(process.cwd(), 'data')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

export function readCompanies(): Company[] {
  ensureDir()
  if (!existsSync(STORE)) { writeFileSync(STORE, '[]', 'utf-8'); return [] }
  try { return JSON.parse(readFileSync(STORE, 'utf-8')) } catch { return [] }
}

export function writeCompanies(companies: Company[]) {
  ensureDir()
  writeFileSync(STORE, JSON.stringify(companies, null, 2), 'utf-8')
}
