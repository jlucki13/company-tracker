import { Redis } from '@upstash/redis'

export interface Company {
  id: string
  ticker: string
  name: string
  rank: number
  addedAt: string
}

const KEY = 'companies'

function client() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) throw new Error('Upstash Redis env vars not set (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)')
  return new Redis({ url, token })
}

export async function readCompanies(): Promise<Company[]> {
  const data = await client().get<Company[]>(KEY)
  return data ?? []
}

export async function writeCompanies(companies: Company[]): Promise<void> {
  await client().set(KEY, companies)
}
