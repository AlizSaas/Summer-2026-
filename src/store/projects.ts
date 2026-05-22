import { create } from 'zustand'
import type { ProjectEntry } from '@/types'

type ProjectForm = Omit<ProjectEntry, 'id' | 'createdAt'>

export const emptyProject = (): ProjectForm => ({
  title: '',
  type: 'project',
  description: '',
  link: '',
  techStack: '',
  status: 'in-progress',
  impact: '',
  lessonsLearned: '',
  startDate: '',
  endDate: '',
})

interface ProjectsStore {
  open: boolean
  editing: ProjectEntry | null
  form: ProjectForm
  filter: 'all' | 'project' | 'open-source'
  openAdd: () => void
  openEdit: (entry: ProjectEntry) => void
  close: () => void
  setForm: (form: ProjectForm) => void
  setFilter: (f: 'all' | 'project' | 'open-source') => void
}

export const useProjectsStore = create<ProjectsStore>((set) => ({
  open: false,
  editing: null,
  form: emptyProject(),
  filter: 'all',
  openAdd: () => set({ open: true, editing: null, form: emptyProject() }),
  openEdit: (entry) => {
    const { id: _id, createdAt: _ca, ...rest } = entry
    set({ open: true, editing: entry, form: rest })
  },
  close: () => set({ open: false }),
  setForm: (form) => set({ form }),
  setFilter: (filter) => set({ filter }),
}))
