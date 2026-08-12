/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { StatefulButton } from '@/components/motion/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'

export const Route = createFileRoute('/_auth/forgot-password/')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) {
      setError(error.message ?? 'Something went wrong')
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <Card className="w-full max-w-sm shadow-lg border-border/60">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex justify-center mb-2">
            <CheckCircle2 className="size-10 text-primary" />
          </div>
          <CardTitle className="text-xl font-semibold tracking-tight text-center">Check your email</CardTitle>
          <CardDescription className="text-center">
            We sent a password reset link to <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center border-t pt-4">
          <Link to="/login" className="text-sm font-medium text-foreground underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm shadow-lg border-border/60">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-semibold tracking-tight">Forgot password?</CardTitle>
        <CardDescription>Enter your email and we'll send you a reset link</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          <StatefulButton
            type="submit"
            className="w-full"
            state={loading ? 'loading' : 'idle'}
            loadingText="Sending…"
          >
            Send reset link
          </StatefulButton>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  )
}
