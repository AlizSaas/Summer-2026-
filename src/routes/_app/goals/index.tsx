import Goals from '@/components/Goals'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/goals/')({
  component: Goals,
})


