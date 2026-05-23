import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DailySummary } from '../daily-summary'

// ── DB mock ───────────────────────────────────────────────────────────────────
// vi.hoisted ensures these are available inside the vi.mock() factory below,
// which is hoisted to the top of the file before any imports are evaluated.
const { mockOrderBy, mockGetDb } = vi.hoisted(() => {
  const mockOrderBy = vi.fn().mockResolvedValue([])
  const mockSelect = vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({ orderBy: mockOrderBy })),
      orderBy: mockOrderBy,
    })),
  }))
  const mockGetDb = vi.fn(() => ({ select: mockSelect }))
  return { mockOrderBy, mockGetDb }
})

vi.mock('@/db/database', () => ({
  initDatabase: vi.fn(),
  getDb: mockGetDb,
}))

// ── Mock helpers ──────────────────────────────────────────────────────────────

function createMockStorage() {
  const store = new Map<string, unknown>()
  let alarmTime: number | null = null

  return {
    // Test-only inspection helpers
    _store: store,
    _alarmTime: () => alarmTime,

    // DurableObjectStorage API (subset used by DailySummary)
    get: vi.fn(async <T>(key: string): Promise<T | undefined> =>
      store.get(key) as T | undefined,
    ),
    put: vi.fn(async (data: Record<string, unknown>) => {
      for (const [k, v] of Object.entries(data)) store.set(k, v)
    }),
    delete: vi.fn(async (keys: string[]) => {
      for (const k of keys) store.delete(k)
    }),
    setAlarm: vi.fn(async (ts: number) => {
      alarmTime = ts
    }),
    getAlarm: vi.fn(async () => alarmTime),
    deleteAlarm: vi.fn(async () => {
      alarmTime = null
    }),
  }
}

type MockStorage = ReturnType<typeof createMockStorage>

function makeDO(storage?: MockStorage) {
  const s = storage ?? createMockStorage()
  const state = { storage: s } as unknown as DurableObjectState
  const env = {
    DB: {} as D1Database,
    RESEND_API_KEY: 'test-resend-key',
    EMAIL_FROM: 'test@example.com',
  } as unknown as ServiceBindings
  return { instance: new DailySummary(state, env), storage: s }
}

/** Convenience: build a POST /schedule request */
function scheduleRequest(userId: string, body: Record<string, unknown>) {
  return new Request('https://daily-summary/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify(body),
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DailySummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOrderBy.mockResolvedValue([]) // reset to empty arrays between tests
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── POST /schedule ──────────────────────────────────────────────────────────

  describe('POST /schedule', () => {
    it('saves userId, email, hour to storage and sets an alarm', async () => {
      const { instance, storage } = makeDO()
      const res = await instance.fetch(
        scheduleRequest('u1', { email: 'user@test.com', hour: 9 }),
      )

      expect(res.status).toBe(200)
      const body = await res.json<{ ok: boolean; nextAlarm: number }>()
      expect(body.ok).toBe(true)
      expect(body.nextAlarm).toBeGreaterThan(Date.now() - 1000)

      expect(storage.put).toHaveBeenCalledWith({
        userId: 'u1',
        email: 'user@test.com',
        hour: 9,
      })
      expect(storage.setAlarm).toHaveBeenCalledWith(expect.any(Number))
    })

    it('accepts userId from request body when header is absent', async () => {
      const { instance, storage } = makeDO()
      const req = new Request('https://daily-summary/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'u2', email: 'user@test.com', hour: 0 }),
      })
      const res = await instance.fetch(req)
      expect(res.status).toBe(200)
      expect(storage.put).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u2', hour: 0 }),
      )
    })

    it('accepts string hour (e.g. "8") and coerces it', async () => {
      const { instance, storage } = makeDO()
      const res = await instance.fetch(
        scheduleRequest('u1', { email: 'user@test.com', hour: '8' }),
      )
      expect(res.status).toBe(200)
      expect(storage.put).toHaveBeenCalledWith(
        expect.objectContaining({ hour: 8 }),
      )
    })

    it('returns 400 when userId is missing', async () => {
      const { instance } = makeDO()
      const req = new Request('https://daily-summary/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@test.com', hour: 9 }),
      })
      const res = await instance.fetch(req)
      expect(res.status).toBe(400)
      expect(await res.json<{ error: string }>()).toMatchObject({ error: 'Missing userId' })
    })

    it('returns 400 when email is missing', async () => {
      const { instance } = makeDO()
      const res = await instance.fetch(scheduleRequest('u1', { hour: 9 }))
      expect(res.status).toBe(400)
      expect(await res.json<{ error: string }>()).toMatchObject({ error: 'Missing email' })
    })

    it('returns 400 when hour is out of range (25)', async () => {
      const { instance } = makeDO()
      const res = await instance.fetch(
        scheduleRequest('u1', { email: 'user@test.com', hour: 25 }),
      )
      expect(res.status).toBe(400)
      expect(await res.json<{ error: string }>()).toMatchObject({ error: 'Invalid hour' })
    })

    it('returns 400 when hour is negative', async () => {
      const { instance } = makeDO()
      const res = await instance.fetch(
        scheduleRequest('u1', { email: 'user@test.com', hour: -1 }),
      )
      expect(res.status).toBe(400)
    })

    it('returns 400 when body is not valid JSON', async () => {
      const { instance } = makeDO()
      const req = new Request('https://daily-summary/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'u1' },
        body: 'not-json',
      })
      const res = await instance.fetch(req)
      expect(res.status).toBe(400)
    })
  })

  // ── GET /status ─────────────────────────────────────────────────────────────

  describe('GET /status', () => {
    it('returns stored config and nextAlarm when a schedule exists', async () => {
      const storage = createMockStorage()
      storage._store.set('userId', 'u1')
      storage._store.set('email', 'user@test.com')
      storage._store.set('hour', 9)
      await storage.setAlarm(Date.now() + 3_600_000) // 1 hour from now

      const { instance } = makeDO(storage)
      const res = await instance.fetch(
        new Request('https://daily-summary/status', { method: 'GET' }),
      )

      expect(res.status).toBe(200)
      const body = await res.json<{
        userId: string
        email: string
        hour: number
        nextAlarm: number
      }>()
      expect(body.userId).toBe('u1')
      expect(body.email).toBe('user@test.com')
      expect(body.hour).toBe(9)
      expect(body.nextAlarm).toBeGreaterThan(Date.now())
    })

    it('returns undefined fields and null nextAlarm when nothing is scheduled', async () => {
      const { instance } = makeDO()
      const res = await instance.fetch(
        new Request('https://daily-summary/status', { method: 'GET' }),
      )

      expect(res.status).toBe(200)
      const body = await res.json<{ userId: unknown; nextAlarm: unknown }>()
      expect(body.userId).toBeUndefined()
      expect(body.nextAlarm).toBeNull()
    })
  })

  // ── POST /cancel ─────────────────────────────────────────────────────────────

  describe('POST /cancel', () => {
    it('deletes userId/email/hour from storage and cancels the alarm', async () => {
      const storage = createMockStorage()
      storage._store.set('userId', 'u1')
      storage._store.set('email', 'user@test.com')
      storage._store.set('hour', 9)

      const { instance } = makeDO(storage)
      const res = await instance.fetch(
        new Request('https://daily-summary/cancel', { method: 'POST' }),
      )

      expect(res.status).toBe(200)
      expect(await res.json()).toMatchObject({ ok: true })
      expect(storage.delete).toHaveBeenCalledWith(['userId', 'email', 'hour'])
      expect(storage.deleteAlarm).toHaveBeenCalled()
    })
  })

  // ── alarm() ───────────────────────────────────────────────────────────────────

  describe('alarm()', () => {
    it('exits early and does not call Resend when no config is stored', async () => {
      const { instance, storage } = makeDO()
      const fetchSpy = vi.spyOn(globalThis, 'fetch')

      await instance.alarm()

      expect(fetchSpy).not.toHaveBeenCalled()
      expect(storage.setAlarm).not.toHaveBeenCalled()
    })

    it('sends email to Resend with correct headers and reschedules 24h later', async () => {
      const storage = createMockStorage()
      storage._store.set('userId', 'u1')
      storage._store.set('email', 'user@test.com')
      storage._store.set('hour', 9)

      const { instance } = makeDO(storage)

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('{"id":"email-id-1"}', { status: 200 }),
      )

      const before = Date.now()
      await instance.alarm()
      const after = Date.now()

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-resend-key',
            'Content-Type': 'application/json',
          }),
        }),
      )

      // Verify the email payload
      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
      const payload = JSON.parse(init.body as string) as Record<string, unknown>
      expect(payload.to).toBe('user@test.com')
      expect(payload.from).toBe('test@example.com')
      expect(payload.subject).toBe('Your Daily Summary')
      expect(typeof payload.html).toBe('string')

      // Alarm must be rescheduled exactly 24 h later
      const ONE_DAY_MS = 24 * 60 * 60 * 1000
      const rescheduled = storage._alarmTime()
      expect(rescheduled).toBeGreaterThanOrEqual(before + ONE_DAY_MS - 100)
      expect(rescheduled).toBeLessThanOrEqual(after + ONE_DAY_MS + 100)
    })

    it('still reschedules 24h later even when Resend returns an error (finally block)', async () => {
      const storage = createMockStorage()
      storage._store.set('userId', 'u1')
      storage._store.set('email', 'user@test.com')
      storage._store.set('hour', 9)

      const { instance } = makeDO(storage)

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('{"error":"unauthorized"}', { status: 401 }),
      )

      await instance.alarm()

      // The `finally` block in alarm() must always fire
      expect(storage.setAlarm).toHaveBeenCalled()
    })

    it('includes todo cards, goals, and books from DB in the HTML email', async () => {
      const storage = createMockStorage()
      storage._store.set('userId', 'u1')
      storage._store.set('email', 'user@test.com')
      storage._store.set('hour', 9)

      const { instance } = makeDO(storage)

      // The alarm() runs 5 parallel DB queries via Promise.all.
      // mockOrderBy is called once per query in declaration order:
      // 1. todoColumns, 2. todoCards, 3. goals, 4. projects, 5. books
      mockOrderBy
        .mockResolvedValueOnce([{ id: 'col1', title: 'Doing', position: 0, userId: 'u1' }])
        .mockResolvedValueOnce([{ id: 'c1', columnId: 'col1', text: 'Fix auth bug', position: 0, userId: 'u1' }])
        .mockResolvedValueOnce([{ id: 'g1', title: 'Learn Rust', progress: 30, status: 'in-progress', userId: 'u1' }])
        .mockResolvedValueOnce([]) // projects — empty is fine
        .mockResolvedValueOnce([{ id: 'b1', title: 'SICP', author: 'Abelson', dateFinished: '', userId: 'u1' }])

      let capturedHtml = ''
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
        const body = JSON.parse((init as RequestInit).body as string) as Record<string, unknown>
        capturedHtml = body.html as string
        return new Response('{}', { status: 200 })
      })

      await instance.alarm()

      expect(capturedHtml).toContain('Fix auth bug')
      expect(capturedHtml).toContain('Learn Rust')
      expect(capturedHtml).toContain('30%')
      expect(capturedHtml).toContain('SICP')
      expect(capturedHtml).toContain('Abelson')
      expect(capturedHtml).toContain('No in-progress projects.')
    })

    it('HTML escapes malicious content in DB values', async () => {
      const storage = createMockStorage()
      storage._store.set('userId', 'u1')
      storage._store.set('email', 'user@test.com')
      storage._store.set('hour', 9)

      const { instance } = makeDO(storage)

      mockOrderBy
        .mockResolvedValueOnce([]) // columns
        .mockResolvedValueOnce([]) // cards
        .mockResolvedValueOnce([{
          id: 'g1',
          title: '<script>alert("xss")</script>',
          progress: 0,
          status: 'in-progress',
          userId: 'u1',
        }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])

      let capturedHtml = ''
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
        const body = JSON.parse((init as RequestInit).body as string) as Record<string, unknown>
        capturedHtml = body.html as string
        return new Response('{}', { status: 200 })
      })

      await instance.alarm()

      // Raw script tag must NOT appear in the email
      expect(capturedHtml).not.toContain('<script>')
      // Escaped version must be present
      expect(capturedHtml).toContain('&lt;script&gt;')
    })
  })

  // ── 404 fallback ─────────────────────────────────────────────────────────────

  it('returns 404 for unknown routes', async () => {
    const { instance } = makeDO()
    const res = await instance.fetch(
      new Request('https://daily-summary/unknown', { method: 'GET' }),
    )
    expect(res.status).toBe(404)
  })
})
