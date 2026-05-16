import { useState } from 'react'
import { BookOpen, Code2, Target, Menu, X, Kanban } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type Page = 'reading' | 'progress' | 'goals' | 'todo'

interface Props {
  current: Page
  onChange: (p: Page) => void
  children: React.ReactNode
}

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'reading', label: 'Reading Log', icon: <BookOpen className="h-4 w-4" /> },
  { id: 'progress', label: 'Progress Tracker', icon: <Code2 className="h-4 w-4" /> },
  { id: 'goals', label: 'Goals', icon: <Target className="h-4 w-4" /> },
  { id: 'todo', label: 'To Do List', icon: <Kanban className="h-4 w-4" /> },
]

export default function Layout({ current, onChange, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--background))]">
      <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold tracking-tight">Rahbe Abass's Tracker</span>
            </div>
            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onChange(item.id)}
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    current === item.id
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                      : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]'
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        {mobileOpen && (
          <div className="sm:hidden border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 pb-3 pt-2 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { onChange(item.id); setMobileOpen(false) }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  current === item.id
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                    : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]'
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
