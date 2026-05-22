import ProgressTracker from '@/components/ProgressTracker'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/progress/')({
  component: ProgressTracker
})


