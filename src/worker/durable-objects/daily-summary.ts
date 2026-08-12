import { and, asc, desc, eq } from 'drizzle-orm'
import { books, goals, projects, todoCards, todoColumns } from '@/db/drizzle-out/schema'
import { getDb, initDatabase } from '@/db/database'

const SUMMARY_TIME_ZONE = 'America/New_York'

type TodoColumn = typeof todoColumns.$inferSelect
type TodoCard = typeof todoCards.$inferSelect
type Goal = typeof goals.$inferSelect
type Project = typeof projects.$inferSelect
type Book = typeof books.$inferSelect

type SummaryConfig = {
  userId: string
  email: string
  hour: number
}

type SummaryData = {
  columns: TodoColumn[]
  cards: TodoCard[]
  goals: Goal[]
  projects: Project[]
  books: Book[]
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function normalizeHour(value: unknown) {
  const numeric = typeof value === 'string' ? Number(value) : value
  if (typeof numeric !== 'number' || !Number.isFinite(numeric)) return null
  const hour = Math.trunc(numeric)
  if (hour < 0 || hour > 23) return null
  return hour
}

type DateParts = {
  year: number
  month: number
  day: number
  hour: number
}

function getDatePartsInSummaryTimeZone(date: Date): DateParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SUMMARY_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date)

  const values = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
  )

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
  }
}

function summaryTimeToUtc(parts: DateParts, hour: number) {
  const localTimestamp = Date.UTC(parts.year, parts.month - 1, parts.day, hour)
  const initialOffset =
    Date.UTC(
      getDatePartsInSummaryTimeZone(new Date(localTimestamp)).year,
      getDatePartsInSummaryTimeZone(new Date(localTimestamp)).month - 1,
      getDatePartsInSummaryTimeZone(new Date(localTimestamp)).day,
      getDatePartsInSummaryTimeZone(new Date(localTimestamp)).hour,
    ) - localTimestamp
  const timestamp = localTimestamp - initialOffset
  const resolvedParts = getDatePartsInSummaryTimeZone(new Date(timestamp))
  const resolvedOffset =
    Date.UTC(resolvedParts.year, resolvedParts.month - 1, resolvedParts.day, resolvedParts.hour) - timestamp

  return localTimestamp - resolvedOffset
}

function nextAlarmAt(hour: number, now = new Date()) {
  const today = getDatePartsInSummaryTimeZone(now)
  let nextAlarm = summaryTimeToUtc(today, hour)

  if (nextAlarm <= now.getTime()) {
    const tomorrow = new Date(Date.UTC(today.year, today.month - 1, today.day + 1))
    nextAlarm = summaryTimeToUtc(
      {
        year: tomorrow.getUTCFullYear(),
        month: tomorrow.getUTCMonth() + 1,
        day: tomorrow.getUTCDate(),
        hour: 0,
      },
      hour,
    )
  }

  return nextAlarm
}

function buildEmailHtml(data: SummaryData) {
  const cardsByColumn = new Map<string, TodoCard[]>()
  for (const card of data.cards) {
    const list = cardsByColumn.get(card.columnId) ?? []
    list.push(card)
    cardsByColumn.set(card.columnId, list)
  }

  const todoSection = data.columns.length
    ? data.columns
        .map((column) => {
          const columnCards = cardsByColumn.get(column.id) ?? []
          const cardsList = columnCards.length
            ? `<ul>${columnCards.map((card) => `<li>${escapeHtml(card.text)}</li>`).join('')}</ul>`
            : '<p>No active cards.</p>'
          return `<h4>${escapeHtml(column.title)}</h4>${cardsList}`
        })
        .join('')
    : '<p>No todo columns yet.</p>'

  const goalsSection = data.goals.length
    ? `<ul>${data.goals
        .map((goal) => `<li>${escapeHtml(goal.title)} — ${goal.progress}%</li>`)
        .join('')}</ul>`
    : '<p>No in-progress goals.</p>'

  const projectsSection = data.projects.length
    ? `<ul>${data.projects
        .map((project) => `<li>${escapeHtml(project.title)}</li>`)
        .join('')}</ul>`
    : '<p>No in-progress projects.</p>'

  const booksSection = data.books.length
    ? `<ul>${data.books
        .map((book) => `<li>${escapeHtml(book.title)} — ${escapeHtml(book.author)}</li>`)
        .join('')}</ul>`
    : '<p>No books in progress.</p>'

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return `
    <div>
      <h2>Daily Summary</h2>
      <p>${escapeHtml(dateLabel)}</p>
      <h3>Active Todo Cards</h3>
      ${todoSection}
      <h3>Goals In Progress</h3>
      ${goalsSection}
      <h3>Projects In Progress</h3>
      ${projectsSection}
      <h3>Books In Progress</h3>
      ${booksSection}
    </div>
  `.trim()
}

export class DailySummary {
  private state: DurableObjectState
  private env: ServiceBindings

  constructor(state: DurableObjectState, env: ServiceBindings) {
    this.state = state
    this.env = env
    initDatabase(env.DB)
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/schedule' && request.method === 'POST') {
      return this.handleSchedule(request)
    }

    if (url.pathname === '/cancel' && request.method === 'POST') {
      return this.handleCancel()
    }

    if (url.pathname === '/status' && request.method === 'GET') {
      return this.handleStatus()
    }

    return jsonResponse({ error: 'Not found' }, 404)
  }

  async alarm(): Promise<void> {
    const config = await this.getConfig()
    if (!config) return

    const db = getDb()

    const [columns, cards, goalsRows, projectRows, bookRows] = await Promise.all([
      db
        .select()
        .from(todoColumns)
        .where(eq(todoColumns.userId, config.userId))
        .orderBy(asc(todoColumns.position)),
      db
        .select()
        .from(todoCards)
        .where(eq(todoCards.userId, config.userId))
        .orderBy(asc(todoCards.position)),
      db
        .select()
        .from(goals)
        .where(and(eq(goals.userId, config.userId), eq(goals.status, 'in-progress')))
        .orderBy(desc(goals.createdAt)),
      db
        .select()
        .from(projects)
        .where(and(eq(projects.userId, config.userId), eq(projects.status, 'in-progress')))
        .orderBy(desc(projects.createdAt)),
      db
        .select()
        .from(books)
        .where(and(eq(books.userId, config.userId), eq(books.dateFinished, '')))
        .orderBy(desc(books.createdAt)),
    ])

    const html = buildEmailHtml({
      columns,
      cards,
      goals: goalsRows,
      projects: projectRows,
      books: bookRows,
    })

    try {
      await this.sendEmail(config.email, html)
    } finally {
      await this.state.storage.setAlarm(nextAlarmAt(config.hour))
    }
  }

  private async handleSchedule(request: Request) {
    let body: { email?: string; hour?: number | string; userId?: string }
    try {
      body = await request.json()
    } catch {
      return jsonResponse({ error: 'Invalid JSON' }, 400)
    }

    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const hour = normalizeHour(body.hour)
    const headerUserId = request.headers.get('x-user-id') ?? ''
    const bodyUserId = typeof body.userId === 'string' ? body.userId : ''
    const userId = headerUserId || bodyUserId

    if (!userId) {
      return jsonResponse({ error: 'Missing userId' }, 400)
    }

    if (!email) {
      return jsonResponse({ error: 'Missing email' }, 400)
    }

    if (hour === null) {
      return jsonResponse({ error: 'Invalid hour' }, 400)
    }

    await this.state.storage.put({ userId, email, hour })
    const nextAlarm = nextAlarmAt(hour)
    await this.state.storage.setAlarm(nextAlarm)

    return jsonResponse({ ok: true, nextAlarm })
  }

  private async handleCancel() {
    await this.state.storage.delete(['userId', 'email', 'hour'])
    await this.state.storage.deleteAlarm()
    return jsonResponse({ ok: true })
  }

  private async handleStatus() {
    const [userId, email, hour, nextAlarm] = await Promise.all([
      this.state.storage.get<string>('userId'),
      this.state.storage.get<string>('email'),
      this.state.storage.get<number>('hour'),
      this.state.storage.getAlarm(),
    ])

    return jsonResponse({ userId, email, hour, nextAlarm })
  }

  private async getConfig(): Promise<SummaryConfig | null> {
    const [userId, email, hour] = await Promise.all([
      this.state.storage.get<string>('userId'),
      this.state.storage.get<string>('email'),
      this.state.storage.get<number>('hour'),
    ])

    if (!userId || !email || typeof hour !== 'number') {
      return null
    }

    return { userId, email, hour }
  }

  private async sendEmail(to: string, html: string) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.env.EMAIL_FROM.trim(),
        to,
        subject: 'Your Daily Summary',
        html,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Daily summary email failed', response.status, errorText)
    }
  }
}
