import type { ChatCompletionTool } from 'openai/resources'
import { and, asc, desc, eq } from 'drizzle-orm'
import { goals, books, projects, todoColumns, todoCards, user } from '@/db/drizzle-out/schema'
import { getDb } from '@/db/database'

type ToolRequestContext = {
  baseUrl: string
  headers: Headers
  userEmail?: string
  env?: ServiceBindings
}

function buildInternalHeaders(source: Headers) {
  const headers = new Headers(source)
  headers.delete('content-length')
  headers.set('Content-Type', 'application/json')
  return headers
}

export const AI_TOOLS: ChatCompletionTool[] = [
  // ─── Goals ──────────────────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'listGoals',
      description: 'List all goals for the current user',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createGoal',
      description: 'Create a new goal',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Goal title' },
          category: { type: 'string', description: 'e.g. Health, Career, Skills, Side Project' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['not-started', 'in-progress', 'completed', 'paused'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          targetDate: { type: 'string', description: 'YYYY-MM-DD format' },
          progress: { type: 'number', minimum: 0, maximum: 100 },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'updateGoal',
      description: 'Update a goal by ID. Call listGoals first to find the ID.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          category: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['not-started', 'in-progress', 'completed', 'paused'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          targetDate: { type: 'string' },
          progress: { type: 'number', minimum: 0, maximum: 100 },
          notes: { type: 'string' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deleteGoal',
      description: 'Delete a goal by ID. Call listGoals first to find the ID.',
      parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    },
  },

  // ─── Books ───────────────────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'listBooks',
      description: 'List all books in the reading log',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'addBook',
      description: 'Add a book to the reading log',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          author: { type: 'string' },
          summary: { type: 'string' },
          genre: { type: 'string' },
          dateFinished: { type: 'string', description: 'YYYY-MM-DD' },
          overallRating: { type: 'number', minimum: 1, maximum: 10 },
          knowledgeRating: { type: 'number', minimum: 1, maximum: 10 },
          learningDepth: { type: 'number', minimum: 1, maximum: 10 },
          practicalValue: { type: 'number', minimum: 1, maximum: 10 },
          notes: { type: 'string' },
        },
        required: ['title', 'author'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'updateBook',
      description: 'Update a book entry by ID. Call listBooks first to find the ID.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          author: { type: 'string' },
          summary: { type: 'string' },
          genre: { type: 'string' },
          dateFinished: { type: 'string' },
          overallRating: { type: 'number', minimum: 1, maximum: 10 },
          notes: { type: 'string' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deleteBook',
      description: 'Delete a book by ID. Call listBooks first to find the ID.',
      parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    },
  },

  // ─── Projects ────────────────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'listProjects',
      description: 'List all coding projects and open-source contributions',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'addProject',
      description: 'Add a coding project or open-source contribution',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          type: { type: 'string', enum: ['project', 'open-source'] },
          description: { type: 'string' },
          status: { type: 'string', enum: ['in-progress', 'completed', 'abandoned'] },
          link: { type: 'string' },
          techStack: { type: 'string', description: 'Comma-separated, e.g. React, TypeScript' },
          impact: { type: 'string' },
          lessonsLearned: { type: 'string' },
          startDate: { type: 'string', description: 'YYYY-MM-DD' },
          endDate: { type: 'string', description: 'YYYY-MM-DD' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'updateProject',
      description: 'Update a project by ID. Call listProjects first to find the ID.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          type: { type: 'string', enum: ['project', 'open-source'] },
          description: { type: 'string' },
          status: { type: 'string', enum: ['in-progress', 'completed', 'abandoned'] },
          link: { type: 'string' },
          techStack: { type: 'string' },
          impact: { type: 'string' },
          lessonsLearned: { type: 'string' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deleteProject',
      description: 'Delete a project by ID. Call listProjects first to find the ID.',
      parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    },
  },

  // ─── Todos ───────────────────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'getTodoBoard',
      description: 'Get the todo board with all columns and their cards',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'addTodoCard',
      description: 'Add a card to a todo column. Call getTodoBoard first to get column IDs.',
      parameters: {
        type: 'object',
        properties: {
          columnId: { type: 'string', description: 'Column ID to add card to' },
          text: { type: 'string', description: 'Card text/content' },
        },
        required: ['columnId', 'text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deleteTodoCard',
      description: 'Delete a todo card by ID. Call getTodoBoard first to find the ID.',
      parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'addTodoColumn',
      description: 'Add a new column to the todo board',
      parameters: {
        type: 'object',
        properties: { title: { type: 'string', description: 'Column title, e.g. In Progress' } },
        required: ['title'],
      },
    },
  },

  // ─── Daily Summary ─────────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'getDailySummaryStatus',
      description: 'Get the current daily summary schedule status. Call this before scheduling or cancelling.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'scheduleDailySummary',
      description: 'Schedule the daily morning summary email',
      parameters: {
        type: 'object',
        properties: {
          hour: { type: 'number', minimum: 0, maximum: 23, description: 'Hour of day (0-23)' },
        },
        required: ['hour'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancelDailySummary',
      description: 'Cancel the daily morning summary email',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
]

export async function executeToolCall(
  name: string,
  args: Record<string, unknown>,
  userId: string,
  requestContext: ToolRequestContext,
): Promise<string> {
  const db = getDb()

  switch (name) {
    case 'listGoals': {
      const rows = await db
        .select()
        .from(goals)
        .where(eq(goals.userId, userId))
        .orderBy(desc(goals.createdAt))
      return JSON.stringify(rows)
    }

    case 'createGoal': {
      const [row] = await db
        .insert(goals)
        .values({
          title: args.title as string,
          category: (args.category as string) ?? '',
          description: (args.description as string) ?? '',
          status: (args.status as 'not-started' | 'in-progress' | 'completed' | 'paused') ?? 'not-started',
          priority: (args.priority as 'low' | 'medium' | 'high') ?? 'medium',
          targetDate: (args.targetDate as string) ?? '',
          progress: (args.progress as number) ?? 0,
          notes: '',
          userId,
        })
        .returning()
      return JSON.stringify(row)
    }

    case 'updateGoal': {
      const { id, ...data } = args
      const updates = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined))
      const [row] = await db
        .update(goals)
        .set(updates)
        .where(and(eq(goals.id, id as string), eq(goals.userId, userId)))
        .returning()
      return JSON.stringify(row ?? { error: 'Not found' })
    }

    case 'deleteGoal': {
      await db.delete(goals).where(and(eq(goals.id, args.id as string), eq(goals.userId, userId)))
      return JSON.stringify({ success: true })
    }

    case 'listBooks': {
      const rows = await db
        .select()
        .from(books)
        .where(eq(books.userId, userId))
        .orderBy(desc(books.createdAt))
      return JSON.stringify(rows)
    }

    case 'addBook': {
      const [row] = await db
        .insert(books)
        .values({
          title: args.title as string,
          author: args.author as string,
          summary: (args.summary as string) ?? '',
          genre: (args.genre as string) ?? '',
          dateFinished: (args.dateFinished as string) ?? '',
          overallRating: (args.overallRating as number) ?? 5,
          knowledgeRating: (args.knowledgeRating as number) ?? 5,
          learningDepth: (args.learningDepth as number) ?? 5,
          practicalValue: (args.practicalValue as number) ?? 5,
          notes: (args.notes as string) ?? '',
          userId,
        })
        .returning()
      return JSON.stringify(row)
    }

    case 'updateBook': {
      const { id, ...data } = args
      const updates = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined))
      const [row] = await db
        .update(books)
        .set(updates)
        .where(and(eq(books.id, id as string), eq(books.userId, userId)))
        .returning()
      return JSON.stringify(row ?? { error: 'Not found' })
    }

    case 'deleteBook': {
      await db.delete(books).where(and(eq(books.id, args.id as string), eq(books.userId, userId)))
      return JSON.stringify({ success: true })
    }

    case 'listProjects': {
      const rows = await db
        .select()
        .from(projects)
        .where(eq(projects.userId, userId))
        .orderBy(desc(projects.createdAt))
      return JSON.stringify(rows)
    }

    case 'addProject': {
      const [row] = await db
        .insert(projects)
        .values({
          title: args.title as string,
          type: (args.type as 'project' | 'open-source') ?? 'project',
          description: (args.description as string) ?? '',
          status: (args.status as 'in-progress' | 'completed' | 'abandoned') ?? 'in-progress',
          link: (args.link as string) ?? '',
          techStack: (args.techStack as string) ?? '',
          impact: (args.impact as string) ?? '',
          lessonsLearned: (args.lessonsLearned as string) ?? '',
          startDate: (args.startDate as string) ?? '',
          endDate: (args.endDate as string) ?? '',
          userId,
        })
        .returning()
      return JSON.stringify(row)
    }

    case 'updateProject': {
      const { id, ...data } = args
      const updates = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined))
      const [row] = await db
        .update(projects)
        .set(updates)
        .where(and(eq(projects.id, id as string), eq(projects.userId, userId)))
        .returning()
      return JSON.stringify(row ?? { error: 'Not found' })
    }

    case 'deleteProject': {
      await db
        .delete(projects)
        .where(and(eq(projects.id, args.id as string), eq(projects.userId, userId)))
      return JSON.stringify({ success: true })
    }

    case 'getTodoBoard': {
      const cols = await db
        .select()
        .from(todoColumns)
        .where(eq(todoColumns.userId, userId))
        .orderBy(asc(todoColumns.position))
      const cards = await db
        .select()
        .from(todoCards)
        .where(eq(todoCards.userId, userId))
        .orderBy(asc(todoCards.position))
      return JSON.stringify(
        cols.map((col) => ({ ...col, cards: cards.filter((c) => c.columnId === col.id) })),
      )
    }

    case 'addTodoCard': {
      const existing = await db
        .select({ id: todoCards.id })
        .from(todoCards)
        .where(and(eq(todoCards.columnId, args.columnId as string), eq(todoCards.userId, userId)))
      const [row] = await db
        .insert(todoCards)
        .values({
          columnId: args.columnId as string,
          text: args.text as string,
          position: existing.length,
          userId,
        })
        .returning()
      return JSON.stringify(row)
    }

    case 'deleteTodoCard': {
      await db
        .delete(todoCards)
        .where(and(eq(todoCards.id, args.id as string), eq(todoCards.userId, userId)))
      return JSON.stringify({ success: true })
    }

    case 'addTodoColumn': {
      const existing = await db
        .select({ id: todoColumns.id })
        .from(todoColumns)
        .where(eq(todoColumns.userId, userId))
      const [row] = await db
        .insert(todoColumns)
        .values({ title: args.title as string, position: existing.length, userId })
        .returning()
      return JSON.stringify(row)
    }

    case 'getDailySummaryStatus': {
      const env = requestContext.env
      if (env?.DAILY_SUMMARY) {
        const id = env.DAILY_SUMMARY.idFromName(userId)
        const stub = env.DAILY_SUMMARY.get(id)
        const response = await stub.fetch('https://daily-summary/status', {
          method: 'GET',
          headers: { 'x-user-id': userId },
        })
        return response.text()
      }
      const url = new URL('/api/summary/status', requestContext.baseUrl)
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: buildInternalHeaders(requestContext.headers),
      })
      return response.text()
    }

    case 'scheduleDailySummary': {
      const hour = Number(args.hour)
      if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
        return JSON.stringify({ error: 'Hour must be an integer between 0 and 23.' })
      }
      const directEmail = typeof requestContext.userEmail === 'string'
        ? requestContext.userEmail.trim()
        : ''
      let email = directEmail

      if (!email) {
        const [profile] = await db
          .select({ email: user.email })
          .from(user)
          .where(eq(user.id, userId))
          .limit(1)
        email = profile?.email?.trim() ?? ''
      }

      if (!email) {
        return JSON.stringify({ error: 'Unable to find an email for this user.' })
      }
      const env = requestContext.env
      if (env?.DAILY_SUMMARY) {
        const id = env.DAILY_SUMMARY.idFromName(userId)
        const stub = env.DAILY_SUMMARY.get(id)
        const response = await stub.fetch('https://daily-summary/schedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({ email, hour }),
        })
        const responseText = await response.text()
        if (!response.ok) {
          return JSON.stringify({
            error: 'scheduleDailySummary failed',
            status: response.status,
            statusText: response.statusText,
            body: responseText,
          })
        }

        return responseText
      }

      const url = new URL('/api/summary/schedule', requestContext.baseUrl)
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: buildInternalHeaders(requestContext.headers),
        body: JSON.stringify({ email, hour }),
      })
      const responseText = await response.text()
      if (!response.ok) {
        return JSON.stringify({
          error: 'scheduleDailySummary failed',
          status: response.status,
          statusText: response.statusText,
          body: responseText,
        })
      }

      return responseText
    }

    case 'cancelDailySummary': {
      const env = requestContext.env
      if (env?.DAILY_SUMMARY) {
        const id = env.DAILY_SUMMARY.idFromName(userId)
        const stub = env.DAILY_SUMMARY.get(id)
        const response = await stub.fetch('https://daily-summary/cancel', {
          method: 'POST',
          headers: { 'x-user-id': userId },
        })
        const responseText = await response.text()
        if (!response.ok) {
          return JSON.stringify({
            error: 'cancelDailySummary failed',
            status: response.status,
            statusText: response.statusText,
            body: responseText,
          })
        }

        return responseText
      }

      const url = new URL('/api/summary/cancel', requestContext.baseUrl)
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: buildInternalHeaders(requestContext.headers),
      })
      const responseText = await response.text()
      if (!response.ok) {
        return JSON.stringify({
          error: 'cancelDailySummary failed',
          status: response.status,
          statusText: response.statusText,
          body: responseText,
        })
      }

      return responseText
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` })
  }
}
