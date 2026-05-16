import { useState } from 'react'
import Layout from '@/components/Layout'
import ReadingLog from '@/pages/ReadingLog'
import ProgressTracker from '@/pages/ProgressTracker'
import Goals from '@/pages/Goals'
import TodoList from '@/pages/TodoList'

type Page = 'reading' | 'progress' | 'goals' | 'todo'

export default function App() {
  const [page, setPage] = useState<Page>('reading')

  return (
    <Layout current={page} onChange={setPage}>
      {page === 'reading' && <ReadingLog />}
      {page === 'progress' && <ProgressTracker />}
      {page === 'goals' && <Goals />}
      {page === 'todo' && <TodoList />}
    </Layout>
  )
}
