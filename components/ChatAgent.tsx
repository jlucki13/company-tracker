'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Paperclip, ArrowUp, Loader2, Wrench, User, Bot } from 'lucide-react'
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages'

interface DisplayMessage {
  role: 'user' | 'assistant'
  text: string
  toolCalls?: string[]
  streaming?: boolean
}

const SUGGESTED = [
  'What are the key financial highlights?',
  'How have margins trended recently?',
  'How does the P/E ratio compare to industry norms?',
  'Summarize the latest earnings surprises.',
]

export default function ChatAgent({ ticker, name }: { ticker: string; name: string }) {
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [apiMessages, setApiMessages] = useState<MessageParam[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text: string) {
    if (!text.trim() || loading) return
    const userText = text.trim()
    setInput('')
    setLoading(true)

    const newApiMessages: MessageParam[] = [...apiMessages, { role: 'user', content: userText }]
    setApiMessages(newApiMessages)
    setMessages(prev => [...prev, { role: 'user', text: userText }])
    setMessages(prev => [...prev, { role: 'assistant', text: '', toolCalls: [], streaming: true }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, messages: newApiMessages }),
      })

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''
      const toolCallNames: string[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const event = JSON.parse(data) as { type: string; text?: string; name?: string }
            if (event.type === 'text' && event.text) {
              assistantText += event.text
              setMessages(prev => {
                const next = [...prev]
                next[next.length - 1] = { role: 'assistant', text: assistantText, toolCalls: toolCallNames, streaming: true }
                return next
              })
            } else if (event.type === 'tool_call' && event.name) {
              toolCallNames.push(event.name)
              setMessages(prev => {
                const next = [...prev]
                next[next.length - 1] = { role: 'assistant', text: assistantText, toolCalls: [...toolCallNames], streaming: true }
                return next
              })
            }
          } catch { /* incomplete chunk */ }
        }
      }

      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', text: assistantText, toolCalls: toolCallNames, streaming: false }
        return next
      })
      setApiMessages(prev => [...prev, { role: 'assistant', content: assistantText }])
    } catch (e) {
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', text: `Error: ${(e as Error).message}`, streaming: false }
        return next
      })
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  const isEmpty = messages.length === 0

  return (
    <section className="relative rounded-2xl overflow-hidden bg-[#09090f] border border-white/[0.06]">
      {/* Spotlight glow — only visible in hero state */}
      {isEmpty && (
        <div
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.18) 0%, transparent 70%)' }}
        />
      )}

      {/* Hero empty state */}
      {isEmpty && (
        <div className="relative flex flex-col items-center justify-center gap-6 px-6 pt-16 pb-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-white/70 border border-white/10 bg-white/5 backdrop-blur-sm">
            <span className="text-base">✦</span>
            AI Financial Analyst
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight tracking-tight">
              Ask me anything about<br />
              <span className="text-white/50">{name}</span>
            </h2>
            <p className="mt-3 text-sm text-white/40">
              I can pull live financials, ratios, earnings, margins, and news.
            </p>
          </div>
        </div>
      )}

      {/* Messages area (only shown once chat starts) */}
      {!isEmpty && (
        <div className="h-[420px] overflow-y-auto px-6 py-6 space-y-5">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={13} className="text-white/60" />
                </div>
              )}
              <div className={`max-w-[82%] flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.toolCalls.map((tc, j) => (
                      <span key={j} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40">
                        <Wrench size={9} />
                        {tc.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-white/10 text-white rounded-br-sm'
                    : 'bg-white/5 border border-white/[0.07] text-white/80 rounded-bl-sm'
                }`}>
                  {msg.text || (msg.streaming
                    ? <span className="flex gap-1 items-center py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce [animation-delay:0ms]" /><span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce [animation-delay:150ms]" /><span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce [animation-delay:300ms]" /></span>
                    : null)}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={13} className="text-white/60" />
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input bar */}
      <div className={`px-4 ${isEmpty ? 'pb-8' : 'pb-4 border-t border-white/[0.06]'}`}>
        <div className="flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-white/20 transition-colors">
          <Paperclip size={16} className="text-white/30 shrink-0" />
          <Sparkles size={16} className="text-purple-400/70 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`How can I help you with ${name} today?`}
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-white placeholder-white/25 focus:outline-none disabled:opacity-50 min-w-0"
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-xl bg-white disabled:bg-white/20 hover:bg-white/90 flex items-center justify-center transition-all shrink-0 disabled:cursor-not-allowed"
          >
            {loading
              ? <Loader2 size={14} className="animate-spin text-black/60" />
              : <ArrowUp size={14} className="text-black" />}
          </button>
        </div>

        {/* Suggestion chips */}
        {isEmpty && (
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {SUGGESTED.map(q => (
              <button
                key={q}
                onClick={() => send(q)}
                className="text-xs px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-white/50 hover:bg-white/10 hover:text-white/80 hover:border-white/20 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
