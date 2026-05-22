import { create } from 'zustand'
import type { BookEntry } from '@/types'

type BookForm = Omit<BookEntry, 'id' | 'createdAt'>

export const emptyBook = (): BookForm => ({
  title: '',
  author: '',
  dateFinished: '',
  summary: '',
  knowledgeRating: 5,
  learningDepth: 5,
  practicalValue: 5,
  overallRating: 5,
  genre: '',
  notes: '',
})

interface BooksStore {
  open: boolean
  editing: BookEntry | null
  form: BookForm
  search: string
  openAdd: () => void
  openEdit: (book: BookEntry) => void
  close: () => void
  setForm: (form: BookForm) => void
  setSearch: (s: string) => void
}

export const useBooksStore = create<BooksStore>((set) => ({
  open: false,
  editing: null,
  form: emptyBook(),
  search: '',
  openAdd: () => set({ open: true, editing: null, form: emptyBook() }),
  openEdit: (book) => {
    const { id: _id, createdAt: _ca, ...rest } = book
    set({ open: true, editing: book, form: rest })
  },
  close: () => set({ open: false }),
  setForm: (form) => set({ form }),
  setSearch: (search) => set({ search }),
}))
