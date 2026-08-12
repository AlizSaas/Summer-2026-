import { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, Maximize2, Minimize2, Send, SquarePen, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

// ─── SSE hook ─────────────────────────────────────────────────────────────────

function useSendMessage() {
  const [isPending, setIsPending] = useState(false)

  const send = useCallback(
    async (
      messages: ChatMessage[],
      callbacks: {
        onChunk: (text: string) => void
        onDone: () => void
        onError: (msg: string) => void
      },
    ) => {
      setIsPending(true)
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
          }),
        })

        if (!res.ok || !res.body) {
          callbacks.onError('Request failed')
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split('\n\n')
          buffer = parts.pop() ?? ''
          for (const part of parts) {
            if (!part.startsWith('data: ')) continue
            try {
              const data = JSON.parse(part.slice(6)) as { t: string; v?: string; e?: string }
              if (data.t === 'chunk' && data.v) callbacks.onChunk(data.v)
              else if (data.t === 'done') callbacks.onDone()
              else if (data.t === 'error') callbacks.onError(data.e ?? 'Unknown error')
            } catch { /* ignore parse errors */ }
          }
        }
      } catch (err) {
        callbacks.onError(err instanceof Error ? err.message : 'Network error')
      } finally {
        setIsPending(false)
      }
    },
    [],
  )

  return { send, isPending }
}

// ─── Quick actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  "Schedule a daily summary email every morning at 9am",
  "What's my daily summary schedule?",
  "What are my current goals?",
  "How many goals did I complete?",
  "What books have I logged?",
  "Show my todo board",
  "How are my projects going?",
]

// ─── Main component ───────────────────────────────────────────────────────────

export function Chat() {
  const [open, setOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { send, isPending } = useSendMessage()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const submitMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isPending) return

      const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: trimmed }
      const assistantId = crypto.randomUUID()

      const nextMessages = [...messages, userMsg]
      setMessages(nextMessages)
      setInput('')
      setIsTyping(true)

      // Placeholder for streaming assistant message
      const placeholderMsg: ChatMessage = { id: assistantId, role: 'assistant', content: '' }
      let started = false

      await send(nextMessages, {
        onChunk: (chunk) => {
          if (!started) {
            started = true
            setIsTyping(false)
            setStreamingId(assistantId)
            setMessages((prev) => [...prev, { ...placeholderMsg }])
          }
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)),
          )
        },
        onDone: () => {
          setStreamingId(null)
          setIsTyping(false)
          queryClient.invalidateQueries()
        },
        onError: (msg) => {
          setStreamingId(null)
          setIsTyping(false)
          if (!started) {
            setMessages((prev) => [
              ...prev,
              { id: assistantId, role: 'assistant', content: `Sorry, something went wrong: ${msg}` },
            ])
          }
        },
      })
    },
    [messages, isPending, send, queryClient],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitMessage(input)
    }
  }

  const clearConversation = () => {
    setMessages([])
    setStreamingId(null)
    setIsTyping(false)
  }

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg"
        aria-label="Open AI chat"
      >
        <Bot className="h-5 w-5" />
      </Button>
    )
  }

  const hasMessages = messages.length > 0

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl transition-all duration-300',
        fullscreen
          ? 'inset-4'
          : 'bottom-6 right-6 h-135 w-80 sm:w-96',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <div className="relative">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </div>
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-1 ring-background" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">AI Assistant</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => setFullscreen((f) => !f)}
          aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={clearConversation}
          aria-label="New conversation"
        >
          <SquarePen className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => setOpen(false)}
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Body */}
      <div className={cn('flex flex-1 overflow-hidden', fullscreen && hasMessages && 'lg:flex-row')}>
        {/* Sidebar: quick actions on large screens when there are messages */}
        {fullscreen && hasMessages && (
          <div className="hidden lg:flex w-48 shrink-0 flex-col gap-1 border-r p-3 overflow-y-auto">
            <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Quick actions
            </p>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                onClick={() => submitMessage(action)}
                disabled={isPending}
                className="rounded-lg px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
              >
                {action}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {!hasMessages && (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Bot className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">How can I help you?</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Ask me anything about your goals, books, projects, or todos.
                    Try: "Schedule a daily summary email every morning at 9am."
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 w-full max-w-xs">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action}
                      onClick={() => submitMessage(action)}
                      disabled={isPending}
                      className="rounded-xl border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 text-left"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-2',
                  msg.role === 'user' ? 'justify-end' : 'justify-start',
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted mt-0.5">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm',
                  )}
                >
                  {msg.content ? (
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    p: ({ children }) => (
      <p className="mb-2 last:mb-0">{children}</p>
    ),

    ol: ({ children }) => (
      <ol className="ml-5 mb-2 list-decimal space-y-2">
        {children}
      </ol>
    ),

    ul: ({ children }) => (
      <ul className="ml-5 mt-1 list-disc space-y-1">
        {children}
      </ul>
    ),

    li: ({ children }) => (
      <li className="pl-1">
        {children}
      </li>
    ),

    strong: ({ children }) => (
      <strong className="font-semibold">
        {children}
      </strong>
    ),

    em: ({ children }) => (
      <em className="italic">
        {children}
      </em>
    ),

    code: ({ children }) => (
      <code className="rounded bg-background/70 px-1 py-0.5 text-xs font-mono">
        {children}
      </code>
    ),
  }}
>
  {msg.content}
</ReactMarkdown>
) : streamingId === msg.id ? null : (
  '…'
)}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2 justify-start">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted mt-0.5">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-3 py-2">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Mobile quick-action chips */}
          {hasMessages && (
            <div className={cn('flex gap-1.5 overflow-x-auto px-3 pb-1 pt-0.5 no-scrollbar', fullscreen && 'lg:hidden')}>
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  onClick={() => submitMessage(action)}
                  disabled={isPending}
                  className="shrink-0 rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t px-3 py-2">
            <div className="flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask something…"
                disabled={isPending}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50 min-w-0"
              />
              <Button
                size="icon"
                className="h-7 w-7 shrink-0 rounded-full"
                onClick={() => submitMessage(input)}
                disabled={isPending || !input.trim()}
                aria-label="Send"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

