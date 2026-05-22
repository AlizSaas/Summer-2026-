import ReadingLog from '@/components/ReadingLog'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/reading/')({
  component: ReadingLog
})

