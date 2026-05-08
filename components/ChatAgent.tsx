'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Wrench } from 'lucide-react'
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

    // Add empty assistant message that will be filled by streaming
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
        const lines = chunk.split('\n')

        for (const line of lines) {
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
          } catch {
            // ignore parse errors on incomplete chunks
          }
        }
      }

      // Finalize message
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <section className="bg-[#0d1b2e] rounded-2xl border border-[#1e3a5f] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#1e3a5f] flex items-center gap-2">
        <Bot size={16} className="text-cyan-400" />
        <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-widest">AI Analyst — {name}</h2>
      </div>

      <div className="h-[400px] overflow-y-auto px-6 py-4 space-y-4 flex flex-col">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <Bot size={32} className="text-[#1e3a5f]" />
            <p className="text-sm text-[#4a7fa5]">Ask anything about {name}&#39;s financials, performance, or competitors.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED.map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-xs px-3 py-1.5 rounded-full border border-[#1e3a5f] text-[#4a7fa5] hover:border-cyan-400 hover:text-cyan-400 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-cyan-900/40 border border-cyan-700/40 flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={14} className="text-cyan-400" />
              </div>
            )}
            <div className={`max-w-[80%] space-y-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {msg.toolCalls.map((tc, j) => (
                    <span key={j} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#0a1628] border border-[#1e3a5f] text-[#4a7fa5]">
                      <Wrench size={9} />
                      {tc.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-cyan-900/30 border border-cyan-700/40 text-cyan-100 rounded-br-sm'
                  : 'bg-[#0a1628] border border-[#1e3a5f] text-[#e2e8f0] rounded-bl-sm'
              }`}>
                {msg.text || (msg.streaming ? <Loader2 size={14} className="animate-spin text-[#4a7fa5]" /> : null)}
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-[#1e3a5f] flex items-center justify-center shrink-0 mt-0.5">
                <User size={14} className="text-[#4a7fa5]" />
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-[#1e3a5f] flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Ask about ${name}…`}
          disabled={loading}
          className="flex-1 bg-[#060e1f] border border-[#1e3a5f] rounded-xl px-4 py-2 text-sm text-[#e2e8f0] placeholder-[#2a4a6a] focus:outline-none focus:border-cyan-600 disabled:opacity-50 transition-colors"
        />
        <button
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          className="w-9 h-9 rounded-xl bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
        >
          {loading ? <Loader2 size={15} className="animate-spin text-white" /> : <Send size={15} className="text-white" />}
        </button>
      </div>
    </section>
  )
}
