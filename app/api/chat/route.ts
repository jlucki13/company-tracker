import { NextRequest } from 'next/server'
import anthropic from '@/lib/anthropic'
import type { MessageParam, Tool } from '@anthropic-ai/sdk/resources/messages'

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

async function fetchJson(path: string) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) return { error: `HTTP ${res.status}` }
  return res.json()
}

const TOOLS: Tool[] = [
  {
    name: 'get_company_profile',
    description: 'Get the company profile and current stock quote (name, sector, exchange, price, market cap, % change).',
    input_schema: { type: 'object' as const, properties: { ticker: { type: 'string' } }, required: ['ticker'] },
  },
  {
    name: 'get_financials',
    description: 'Get annual income statement data: revenue and net income for the last 5 fiscal years.',
    input_schema: { type: 'object' as const, properties: { ticker: { type: 'string' } }, required: ['ticker'] },
  },
  {
    name: 'get_ratios',
    description: 'Get key financial ratios: P/E, P/B, ROE, ROA, current ratio, debt/equity, net margin.',
    input_schema: { type: 'object' as const, properties: { ticker: { type: 'string' } }, required: ['ticker'] },
  },
  {
    name: 'get_margins',
    description: 'Get quarterly gross, operating, and net profit margin trends for the last 8 quarters.',
    input_schema: { type: 'object' as const, properties: { ticker: { type: 'string' } }, required: ['ticker'] },
  },
  {
    name: 'get_earnings',
    description: 'Get quarterly EPS data: estimated vs actual earnings, and surprise %, for the last 8 quarters.',
    input_schema: { type: 'object' as const, properties: { ticker: { type: 'string' } }, required: ['ticker'] },
  },
  {
    name: 'get_price_history',
    description: 'Get 1-year daily closing price history for the stock.',
    input_schema: { type: 'object' as const, properties: { ticker: { type: 'string' } }, required: ['ticker'] },
  },
  {
    name: 'get_news',
    description: 'Get the latest news headlines about the company from multiple sources.',
    input_schema: { type: 'object' as const, properties: { ticker: { type: 'string' } }, required: ['ticker'] },
  },
]

async function runTool(name: string, input: { ticker: string }): Promise<string> {
  const t = input.ticker.toUpperCase()
  let data: unknown
  switch (name) {
    case 'get_company_profile':  data = await fetchJson(`/api/company?ticker=${t}`); break
    case 'get_financials':        data = await fetchJson(`/api/financials?ticker=${t}`); break
    case 'get_ratios':            data = await fetchJson(`/api/ratios?ticker=${t}`); break
    case 'get_margins':           data = await fetchJson(`/api/margins?ticker=${t}`); break
    case 'get_earnings':          data = await fetchJson(`/api/earnings?ticker=${t}`); break
    case 'get_price_history':     data = await fetchJson(`/api/price-history?ticker=${t}`); break
    case 'get_news':              data = await fetchJson(`/api/news?ticker=${t}`); break
    default:                      data = { error: 'Unknown tool' }
  }
  return JSON.stringify(data)
}

export async function POST(req: NextRequest) {
  const { ticker, messages } = await req.json() as { ticker: string; messages: MessageParam[] }

  const systemPrompt = `You are a financial analyst assistant for ${ticker}. You have access to live financial data tools — use them whenever the user asks about financials, stock price, ratios, earnings, margins, or news. Be concise, analytical, and precise. Format numbers clearly (e.g. "$42.1B revenue", "P/E of 28.4x"). When comparing to competitors, note you can only fetch data for a specific ticker at a time.`

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: string) => controller.enqueue(encoder.encode(chunk))

      const runMessages: MessageParam[] = [...messages]

      // Agentic loop: keep going until Claude stops calling tools
      while (true) {
        const response = await anthropic.messages.create({
          model: 'claude-opus-4-7',
          max_tokens: 2048,
          system: systemPrompt,
          tools: TOOLS,
          messages: runMessages,
          stream: false,
        })

        // Collect text chunks and tool uses from response
        let hasToolUse = false
        let assistantText = ''

        for (const block of response.content) {
          if (block.type === 'text') {
            assistantText += block.text
            // Stream text token by token (simulate streaming for UX)
            for (const char of block.text) {
              send(`data: ${JSON.stringify({ type: 'text', text: char })}\n\n`)
            }
          } else if (block.type === 'tool_use') {
            hasToolUse = true
            send(`data: ${JSON.stringify({ type: 'tool_call', name: block.name })}\n\n`)
          }
        }

        runMessages.push({ role: 'assistant', content: response.content })

        if (!hasToolUse || response.stop_reason === 'end_turn') {
          break
        }

        // Execute all tool calls and append results
        const toolResults = []
        for (const block of response.content) {
          if (block.type === 'tool_use') {
            const result = await runTool(block.name, block.input as { ticker: string })
            toolResults.push({
              type: 'tool_result' as const,
              tool_use_id: block.id,
              content: result,
            })
          }
        }
        runMessages.push({ role: 'user', content: toolResults })
      }

      send('data: [DONE]\n\n')
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
