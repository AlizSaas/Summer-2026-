/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/common/theme-provider'
import { Moon, Sun, LogOut, Target, Code2, BookOpen, LayoutList, LayoutDashboard } from 'lucide-react'
import { Toaster } from 'sonner'
import { Chat } from '@/components/Chat'

const navLinks = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/progress', label: 'Progress', icon: Code2 },
  { to: '/reading', label: 'Reading', icon: BookOpen },
  { to: '/todo', label: 'Todo', icon: LayoutList },
] as const

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}

function UserAvatar({ name }: { name?: string | null }) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'
  return (
    <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold select-none shrink-0">
      {initials}
    </div>
  )
}

export const Route = createFileRoute('/_app')({
  beforeLoad: async () => {
    const session = await authClient.getSession().catch(() => null)
    if (!session?.data?.user) {
      throw redirect({ to: '/login' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { data: session } = authClient.useSession()
  const user = session?.user
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <nav className="flex items-center gap-0.5">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="[&.active]:bg-accent [&.active]:text-foreground inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Icon className="size-3.5" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-2">
                <UserAvatar name={user.name} />
                <span className="text-sm font-medium hidden sm:block">{user.name}</span>
              </div>
            )}
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              title="Sign out"
              onClick={() => authClient.signOut().then(() => { window.location.href = '/login' })}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
      <Toaster richColors position="bottom-right" />
      <Chat />
    </div>
  )
}
