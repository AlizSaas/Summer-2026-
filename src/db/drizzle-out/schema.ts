import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// ─── Better-Auth required tables ────────────────────────────────────────────

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
})

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refreshTokenExpiresAt', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
})

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }),
})

// ─── App tables ──────────────────────────────────────────────────────────────

export const books = sqliteTable('books', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  author: text('author').notNull(),
  dateFinished: text('dateFinished').notNull().default(''),
  summary: text('summary').notNull().default(''),
  knowledgeRating: integer('knowledgeRating').notNull().default(5),
  learningDepth: integer('learningDepth').notNull().default(5),
  practicalValue: integer('practicalValue').notNull().default(5),
  overallRating: integer('overallRating').notNull().default(5),
  genre: text('genre').notNull().default(''),
  notes: text('notes').notNull().default(''),
  createdAt: text('createdAt').$defaultFn(() => new Date().toISOString()),
})

export const projects = sqliteTable('projects', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  type: text('type', { enum: ['project', 'open-source'] }).notNull().default('project'),
  description: text('description').notNull().default(''),
  link: text('link').notNull().default(''),
  techStack: text('techStack').notNull().default(''),
  status: text('status', { enum: ['in-progress', 'completed', 'abandoned'] })
    .notNull()
    .default('in-progress'),
  impact: text('impact').notNull().default(''),
  lessonsLearned: text('lessonsLearned').notNull().default(''),
  startDate: text('startDate').notNull().default(''),
  endDate: text('endDate').notNull().default(''),
  createdAt: text('createdAt').$defaultFn(() => new Date().toISOString()),
})

export const goals = sqliteTable('goals', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  category: text('category').notNull().default(''),
  description: text('description').notNull().default(''),
  status: text('status', { enum: ['not-started', 'in-progress', 'completed', 'paused'] })
    .notNull()
    .default('not-started'),
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).notNull().default('medium'),
  targetDate: text('targetDate').notNull().default(''),
  progress: integer('progress').notNull().default(0),
  notes: text('notes').notNull().default(''),
  createdAt: text('createdAt').$defaultFn(() => new Date().toISOString()),
})

export const todoColumns = sqliteTable('todo_columns', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  position: integer('position').notNull().default(0),
  createdAt: text('createdAt').$defaultFn(() => new Date().toISOString()),
})

export const todoCards = sqliteTable('todo_cards', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  columnId: text('columnId')
    .notNull()
    .references(() => todoColumns.id, { onDelete: 'cascade' }),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  position: integer('position').notNull().default(0),
  createdAt: text('createdAt').$defaultFn(() => new Date().toISOString()),
})
