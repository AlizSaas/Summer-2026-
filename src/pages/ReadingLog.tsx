import { useState } from 'react'
import { Plus, BookOpen, Trash2, Pencil, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import type { BookEntry } from '@/types'

const emptyBook = (): Omit<BookEntry, 'id' | 'createdAt'> => ({
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

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-[hsl(var(--muted-foreground))]">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`text-lg transition-colors ${n <= value ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'}`}
          >
            ★
          </button>
        ))}
        <span className="ml-1 text-sm text-[hsl(var(--muted-foreground))] self-center">{value}/10</span>
      </div>
    </div>
  )
}

function RatingDisplay({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[hsl(var(--muted-foreground))] w-28 shrink-0">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <span key={n} className={`text-sm ${n <= value ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
        ))}
      </div>
      <span className="text-xs font-semibold">{value}/10</span>
    </div>
  )
}

export default function ReadingLog() {
  const [books, setBooks] = useLocalStorage<BookEntry[]>('reading-log', [])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<BookEntry | null>(null)
  const [form, setForm] = useState(emptyBook())
  const [search, setSearch] = useState('')

  function openAdd() {
    setEditing(null)
    setForm(emptyBook())
    setOpen(true)
  }

  function openEdit(book: BookEntry) {
    setEditing(book)
    const { id: _id, createdAt: _ca, ...rest } = book
    setForm(rest)
    setOpen(true)
  }

  function save() {
    if (!form.title.trim() || !form.summary.trim()) return
    if (editing) {
      setBooks(books.map((b) => (b.id === editing.id ? { ...editing, ...form } : b)))
    } else {
      setBooks([{ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...form }, ...books])
    }
    setOpen(false)
  }

  function remove(id: string) {
    setBooks(books.filter((b) => b.id !== id))
  }

  const filtered = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      b.genre.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" /> Reading Log
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
            {books.length} book{books.length !== 1 ? 's' : ''} documented
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Book
        </Button>
      </div>

      <Input
        placeholder="Search by title, author, or genre…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {filtered.length === 0 && (
        <div className="text-center py-16 text-[hsl(var(--muted-foreground))]">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">{books.length === 0 ? 'No books yet' : 'No results found'}</p>
          <p className="text-sm">{books.length === 0 ? 'Add your first book to get started.' : 'Try a different search.'}</p>
        </div>
      )}

      <div className="grid gap-4">
        {filtered.map((book) => (
          <Card key={book.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{book.title}</CardTitle>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">by {book.author}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {book.genre && <Badge variant="secondary">{book.genre}</Badge>}
                    {book.dateFinished && (
                      <Badge variant="outline">Finished: {book.dateFinished}</Badge>
                    )}
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                      <Star className="h-3 w-3 mr-1" /> {book.overallRating}/10
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(book)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(book.id)} className="text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))]">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Summary</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{book.summary}</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Ratings</p>
                <RatingDisplay value={book.knowledgeRating} label="New Knowledge" />
                <RatingDisplay value={book.learningDepth} label="Learning Depth" />
                <RatingDisplay value={book.practicalValue} label="Practical Value" />
                <RatingDisplay value={book.overallRating} label="Overall" />
              </div>
              {book.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-1">Notes</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{book.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Book' : 'Add Book'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Book title" />
              </div>
              <div className="space-y-2">
                <Label>Author *</Label>
                <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Author name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Genre</Label>
                <Input value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} placeholder="e.g. Non-fiction, Sci-fi" />
              </div>
              <div className="space-y-2">
                <Label>Date Finished</Label>
                <Input type="date" value={form.dateFinished} onChange={(e) => setForm({ ...form, dateFinished: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Summary *</Label>
              <Textarea
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="Write a summary of the book, key takeaways, and what you found most valuable…"
                className="min-h-[120px]"
              />
            </div>
            <Separator />
            <div className="space-y-3">
              <p className="text-sm font-medium">Ratings (1–10)</p>
              <StarRating value={form.knowledgeRating} onChange={(v) => setForm({ ...form, knowledgeRating: v })} label="New Knowledge Gained" />
              <StarRating value={form.learningDepth} onChange={(v) => setForm({ ...form, learningDepth: v })} label="Depth of Learning" />
              <StarRating value={form.practicalValue} onChange={(v) => setForm({ ...form, practicalValue: v })} label="Practical Value" />
              <StarRating value={form.overallRating} onChange={(v) => setForm({ ...form, overallRating: v })} label="Overall Rating" />
            </div>
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any other thoughts, quotes, or references…"
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.title.trim() || !form.summary.trim()}>
              {editing ? 'Save Changes' : 'Add Book'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
