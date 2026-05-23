import OpenAI from 'openai'
import type { ChatCompletionMessageParam, ChatCompletionMessageToolCall } from 'openai/resources'
import type { Context } from 'hono'
import { AI_TOOLS, executeToolCall } from './tools'

type HonoCtx = Context<{ Bindings: ServiceBindings; Variables: { userId: string; userEmail?: string } }>

const AI_FALLBACK = "Sorry, I couldn't understand that."

function sseChunk(text: string) {
  return `data: ${JSON.stringify({ t: 'chunk', v: text })}\n\n`
}
function sseDone() {
  return `data: ${JSON.stringify({ t: 'done' })}\n\n`
}
function sseError(msg: string) {
  return `data: ${JSON.stringify({ t: 'error', e: msg })}\n\n`
}

export async function handleChat(c: HonoCtx): Promise<Response> {
  const body = await c.req.json<{ messages: Array<{ role: string; content: string }> }>()
  const userId = c.get('userId')
  const userEmail = c.get('userEmail')
  const openai = new OpenAI({ apiKey: c.env.OPENAI_API_KEY })
  const toolRequestContext = { baseUrl: c.req.url, headers: c.req.raw.headers, userEmail, env: c.env }
   // Passes request context to tools for things like auth, logging, or making sub-requests.

  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are a personal productivity assistant for a summer 2026 tracker app.
Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
You help manage goals, reading log, coding projects, and todo boards.
When you make changes, briefly confirm what you did. Be concise and friendly.

DAILY SUMMARY RULES:
- Before scheduling, always call getDailySummaryStatus first to check if one already exists.
- If one exists, call cancelDailySummary before scheduling the new one.
- If the user asks to cancel, call getDailySummaryStatus first. If no schedule exists, tell them there is nothing to cancel.`,
    },
    ...body.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ]

  const encoder = new TextEncoder()
  const SSE_HEADERS = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  } // Required headers for SSE responses

  // ── Agentic tool call loop (non-streaming) ────────────────────────────────
  // Loops until the AI stops requesting tool calls (supports multi-step flows
  // like: getDailySummaryStatus → scheduleDailySummary).
  const loopMessages: ChatCompletionMessageParam[] = [...messages]
  const MAX_TOOL_ITERATIONS = 10 // Safeguard to prevent infinite loops in case of unexpected AI behavior

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const toolResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: loopMessages,
      tools: AI_TOOLS,
      tool_choice: 'auto',
    })

    const assistantMsg = toolResponse.choices[0].message

    loopMessages.push({
      role: 'assistant',
      content: assistantMsg.content,
      tool_calls: assistantMsg.tool_calls,
    })

    // No more tool calls — stream the final text response directly
    if (!assistantMsg.tool_calls?.length) {
      const content = assistantMsg.content ?? AI_FALLBACK
      const readable = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(sseChunk(content)))
          controller.enqueue(encoder.encode(sseDone()))
          controller.close()
        },
      })
      return new Response(readable, { headers: SSE_HEADERS })
    }

    const toolResults = await Promise.all(
      assistantMsg.tool_calls
        .filter((tc) => tc.type === 'function')
        .map(async (tc) => {
          const fn = (tc as ChatCompletionMessageToolCall & { function: { name: string; arguments: string } }).function
          let args: Record<string, unknown>
          try { args = JSON.parse(fn.arguments) as Record<string, unknown> } catch { args = {} }
          console.info('AI tool call', { name: fn.name, args })
          const result = await executeToolCall(fn.name, args, userId, toolRequestContext)
          return { role: 'tool' as const, tool_call_id: tc.id, content: result }
        }),
    )

    loopMessages.push(...toolResults)
  }

  // ── Fallback: stream a synthesised response after hitting max iterations ───
  const finalStream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: loopMessages,
    stream: true,
  })

  const readable = new ReadableStream({
    async start(controller) {
      let fullContent = ''
      try {
        for await (const chunk of finalStream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) {
            fullContent += text
            controller.enqueue(encoder.encode(sseChunk(text)))
          }
        }
        if (!fullContent) {
          controller.enqueue(encoder.encode(sseChunk(AI_FALLBACK)))
        }
        controller.enqueue(encoder.encode(sseDone()))
      } catch (err) {
        controller.enqueue(
          encoder.encode(sseError(err instanceof Error ? err.message : 'Stream error')),
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, { headers: SSE_HEADERS })
}

