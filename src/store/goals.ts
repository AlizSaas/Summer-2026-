import { create } from 'zustand'
import type { Goal } from '@/types'

type GoalForm = Omit<Goal, 'id' | 'createdAt'>

export const emptyGoal = (): GoalForm => ({
  title: '',
  category: '',
  description: '',
  status: 'not-started',
  priority: 'medium',
  targetDate: '',
  progress: 0,
  notes: '',
})

interface GoalsStore {
  open: boolean
  editing: Goal | null
  form: GoalForm
  filterStatus: Goal['status'] | 'all'
  filterPriority: Goal['priority'] | 'all'
  openAdd: () => void
  openEdit: (goal: Goal) => void
  close: () => void
  setForm: (form: GoalForm) => void
  setFilterStatus: (s: Goal['status'] | 'all') => void
  setFilterPriority: (p: Goal['priority'] | 'all') => void
}

export const useGoalsStore = create<GoalsStore>((set) => ({
  open: false,
  editing: null,
  form: emptyGoal(),
  filterStatus: 'all',
  filterPriority: 'all',
  openAdd: () => set({ open: true, editing: null, form: emptyGoal() }),
  openEdit: (goal) => {
    const { id: _id, createdAt: _ca, ...rest } = goal
    set({ open: true, editing: goal, form: rest })
  },
  close: () => set({ open: false }),
  setForm: (form) => set({ form }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setFilterPriority: (filterPriority) => set({ filterPriority }),
}))
