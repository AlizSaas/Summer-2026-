/* eslint-disable react-refresh/only-export-components */
import { buttonVariants } from '@/components/ui/button'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { ArrowLeft, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/common/theme-provider'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_auth')({
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
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

function RouteComponent() {
  return (
    <div className="relative min-h-screen ">
      <div className="absolute top-6 left-6">
        <Link
          to="/"
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          <ArrowLeft className="size-4 mr-1" />
          Home
        </Link>
      </div>
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      <div className="flex min-h-screen items-center justify-center px-4">
        <Outlet />
      </div>
    </div>
  )
}