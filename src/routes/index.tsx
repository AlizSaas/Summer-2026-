import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/common/theme-provider'
import {
  Moon, Sun, Target, Code2, BookOpen, LayoutList,
  ArrowRight, CheckCircle2, Star, Kanban,
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}

const features = [
  {
    icon: Target,
    title: 'Goals',
    description:
      'Set and track personal goals with priorities, deadlines, and progress bars. Mark milestones and stay accountable.',
  },
  {
    icon: Code2,
    title: 'Progress Tracker',
    description:
      'Log every project and open-source contribution. Record your tech stack, impact, and lessons learned.',
  },
  {
    icon: BookOpen,
    title: 'Reading Log',
    description:
      'Document every book you finish. Rate your knowledge gained, learning depth, and practical value.',
  },
  {
    icon: LayoutList,
    title: 'Todo Board',
    description:
      'A drag-and-drop kanban board to manage daily tasks. Create custom columns and move cards as you make progress.',
  },
]

function RouteComponent() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-serif text-lg font-bold tracking-tight">
            Summer <span className="text-primary">2026</span>
          </span>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 gap-6">
        <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-accent text-accent-foreground border border-border">
          <Star className="size-3 text-primary" /> Personal tracker for Summer 2026
        </div>
        <h1 className="font-serif text-5xl sm:text-6xl font-bold tracking-tight max-w-2xl leading-tight">
          Make this summer <span className="text-primary">count</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
          One place to track your goals, log what you read, document your projects,
          and manage your daily tasks — all through the summer.
        </p>
        <div className="flex items-center gap-3 pt-2">
          <Button size="lg" asChild>
            <Link to="/register">
              Start tracking <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 pb-24 w-full">
        <div className="grid sm:grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-lg border border-border bg-card p-6 flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="font-serif font-semibold text-lg">{title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="border-t border-border bg-accent/30">
        <div className="max-w-5xl mx-auto px-4 py-16 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="font-serif text-2xl font-bold">Ready to track your summer?</h2>
            <p className="text-muted-foreground text-sm">
              Free, private, and built for you.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex flex-col gap-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle2 className="size-3 text-primary" /> Goals & milestones</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="size-3 text-primary" /> Books & ratings</span>
              <span className="flex items-center gap-1"><Kanban className="size-3 text-primary" /> Kanban board</span>
            </div>
            <Button size="lg" asChild>
              <Link to="/register">
                Create account <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between text-xs text-muted-foreground">
          <span>Summer 2026</span>
          <span>Built with ☕ and Cloudflare Workers</span>
        </div>
      </footer>
    </div>
  )
}
