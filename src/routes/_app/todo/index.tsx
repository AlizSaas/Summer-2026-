import TodoList from '@/components/TodoList'
import {createFileRoute,} from '@tanstack/react-router'


export const Route = createFileRoute('/_app/todo/')({
  component: TodoList,
})
