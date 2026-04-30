import { kv } from '@vercel/kv'

export interface Company {
  id: string
  ticker: string
  name: string
  rank: number
  addedAt: string
}

const KEY = 'companies'

export async function readCompanies(): Promise<Company[]> {
  const data = await kv.get<Company[]>(KEY)
  return data ?? []
}

export async function writeCompanies(companies: Company[]): Promise<void> {
  await kv.set(KEY, companies)
}
