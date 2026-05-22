# Project Request Flow

## Stack Overview

- **Cloudflare Workers** — serverless runtime, hosts the entire backend
- **Hono** — HTTP router running inside the worker
- **Better-Auth** — session-based auth using email/password, persisted to D1
- **tRPC** — type-safe API layer, all app data goes through here
- **Drizzle ORM** — query builder for D1 (SQLite)
- **D1** — Cloudflare's serverless SQLite database

---

## Request Flow

```
Browser → Cloudflare Worker → Hono → Auth Middleware → tRPC → Your Procedure
```

---

## Step by Step

### 1. Cloudflare Worker — `src/worker/index.ts`
Every HTTP request hits here first.

- Calls `initDatabase(env.DB)` — takes the D1 binding Cloudflare injects and stores it as a singleton
- Hands the request off to the Hono app

### 2. Hono Router — `src/worker/hono/index.ts`
Hono looks at the URL path and decides what to do:

| Path | Handler |
|------|---------|
| `/trpc/*` | Auth middleware → tRPC handler |
| `/api/auth/*` | Better-Auth handler (login, register, logout) |

### 3. Auth Middleware (applied to `/trpc/*`)
Runs before any tRPC call reaches your code:

1. Creates a Better-Auth instance with the D1 database
2. Reads the session cookie from the request headers
3. If no valid session → returns `401 Unauthorized` immediately
4. If valid → extracts `userId` and attaches it to the Hono context for downstream use

### 4. tRPC — `src/worker/trpc/`
`fetchRequestHandler` translates the raw HTTP request into a tRPC procedure call.

- Calls `createContext()` which builds the context object every procedure receives:
  ```ts
  { req, env, db: getDb(), userId }
  ```
- `getDb()` returns the already-initialized D1 singleton — no new connection created per request
- `protectedProcedure` in `trpc-instance.ts` double-checks `ctx.userId` exists before allowing the procedure to run

### 5. Better-Auth — `/api/auth/*`
Handles all auth operations (login, register, logout, session management).

- Browser hits `/api/auth/sign-in/email` with credentials
- Better-Auth validates against the `user` / `account` tables in D1
- On success, sets a session cookie in the response
- That cookie is what the auth middleware reads on every subsequent request

---

## Example: Browser Makes a tRPC Call

```
1.  Browser calls GET /trpc/todos.getAll  (session cookie attached)
2.  Cloudflare Worker receives request, calls initDatabase(env.DB)
3.  Hono matches /trpc/* route
4.  authMiddleware reads session cookie → validates with Better-Auth → sets userId on context
5.  fetchRequestHandler creates tRPC context: { db, userId, req, env }
6.  protectedProcedure checks ctx.userId exists, throws UNAUTHORIZED if not
7.  Procedure runs: db.select().from(todos).where(eq(todos.userId, ctx.userId))
8.  tRPC serializes result and returns HTTP response to browser
```

---

## Example: User Logs In

```
1.  Browser POST /api/auth/sign-in/email  { email, password }
2.  Cloudflare Worker receives request, initializes DB
3.  Hono matches /api/auth/* route, passes to Better-Auth handler
4.  Better-Auth looks up user in D1, verifies hashed password
5.  Creates a new session row in the session table
6.  Returns response with Set-Cookie: session=...
7.  All future requests from this browser include that cookie automatically
```

---

## Key Design Points

- **DB is a singleton** — initialized once per request at the worker entry point, reused everywhere via `getDb()`
- **Layered auth protection** — the Hono middleware blocks unauthenticated requests before they reach tRPC; `protectedProcedure` is a second safety net at the procedure level
- **Auth is separate from tRPC** — `/api/auth/*` routes bypass the auth middleware intentionally (you can't be logged in yet)
- **No env variable needed for base URL** — `new URL(c.req.url).origin` derives it from the live request, adapting automatically to local dev and production
