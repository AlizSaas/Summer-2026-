import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { trpc } from '@/router'
import { authClient } from '@/lib/auth-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target, Code2, BookOpen, LayoutList, CheckCircle2, Clock, Star, TrendingUp } from 'lucide-react'

export const Route = createFileRoute('/_app/dashboard/')({
  component: Dashboard,
})

function StatCard({
  icon: Icon,
  title,
  value,
  sub,
  to,
  color,
}: {
  icon: typeof Target
  title: string
  value: number | string
  sub: string
  to: string
  color: string
}) {
  return (
    <Link to={to} className="block group">
      <Card className="transition-shadow group-hover:shadow-md">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-3xl font-bold tabular-nums">{value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

function Dashboard() {
  const { data: session } = authClient.useSession()
  const firstName = session?.user?.name?.split(' ')[0] ?? 'there'
  const { data: goals = [] } = useQuery(trpc.goals.list.queryOptions())
  const { data: books = [] } = useQuery(trpc.books.list.queryOptions())
  const { data: projects = [] } = useQuery(trpc.projects.list.queryOptions())
  const { data: board = [] } = useQuery(trpc.todos.getBoard.queryOptions())

  const goalsDone = goals.filter((g) => g.status === 'completed').length
  const goalsActive = goals.filter((g) => g.status === 'in-progress').length
  const avgRating =
    books.length > 0
      ? (books.reduce((acc, b) => acc + b.overallRating, 0) / books.length).toFixed(1)
      : '—'
  const projectsDone = projects.filter((p) => p.status === 'completed').length
  const totalCards = board.reduce((acc, col) => acc + col.cards.length, 0)
  const doneCards =
    board.find((col) => col.title.toLowerCase() === 'done')?.cards.length ?? 0

  // Recent items
  const recentGoals = goals.slice(0, 3)
  const recentBooks = books.slice(0, 3)
  const recentProjects = projects.slice(0, 3)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hey, {firstName} 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your Summer 2026 at a glance.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Target}
          title="Goals"
          value={goals.length}
          sub={`${goalsActive} active · ${goalsDone} completed`}
          to="/goals"
          color="bg-primary/15 text-primary"
        />
        <StatCard
          icon={BookOpen}
          title="Books Read"
          value={books.length}
          sub={books.length > 0 ? `avg rating ${avgRating}/10` : 'none logged yet'}
          to="/reading"
          color="bg-accent/60 text-accent-foreground"
        />
        <StatCard
          icon={Code2}
          title="Projects"
          value={projects.length}
          sub={`${projectsDone} completed`}
          to="/progress"
          color="bg-secondary text-secondary-foreground"
        />
        <StatCard
          icon={LayoutList}
          title="Todo Cards"
          value={totalCards}
          sub={`${doneCards} done`}
          to="/todo"
          color="bg-muted text-muted-foreground"
        />
      </div>

      {/* Recent sections */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent goals */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" /> Recent Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentGoals.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No goals yet.</p>
            ) : (
              recentGoals.map((g) => (
                <div key={g.id} className="flex items-start gap-2">
                  {g.status === 'completed' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{g.title}</p>
                    {g.progress > 0 && (
                      <div className="mt-0.5 h-1 w-full rounded-full bg-muted">
                        <div
                          className="h-1 rounded-full bg-primary"
                          style={{ width: `${g.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {goals.length > 3 && (
              <Link to="/goals" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                +{goals.length - 3} more →
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Recent books */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Recent Books
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentBooks.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No books logged yet.</p>
            ) : (
              recentBooks.map((b) => (
                <div key={b.id} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{b.title}</p>
                    <p className="text-xs text-muted-foreground truncate">by {b.author}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0 flex items-center gap-0.5">
                    <Star className="h-2.5 w-2.5" /> {b.overallRating}
                  </Badge>
                </div>
              ))
            )}
            {books.length > 3 && (
              <Link to="/reading" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                +{books.length - 3} more →
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Recent projects */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Recent Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentProjects.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Nothing tracked yet.</p>
            ) : (
              recentProjects.map((p) => (
                <div key={p.id} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground truncate capitalize">{p.type}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs shrink-0 ${
                      p.status === 'completed'
                        ? 'border-primary/30 text-primary'
                        : p.status === 'abandoned'
                          ? 'border-destructive/30 text-destructive'
                          : ''
                    }`}
                  >
                    {p.status}
                  </Badge>
                </div>
              ))
            )}
            {projects.length > 3 && (
              <Link to="/progress" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                +{projects.length - 3} more →
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
