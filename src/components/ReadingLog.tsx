import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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
import { trpc } from '@/router'
import { useBooksStore } from '@/store/books'

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`text-lg transition-colors ${n <= value ? 'text-primary' : 'text-muted-foreground/40 hover:text-primary/60'}`}
          >
            ★
          </button>
        ))}
        <span className="ml-1 text-sm text-muted-foreground self-center">{value}/10</span>
      </div>
    </div>
  )
}

function RatingDisplay({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <span key={n} className={`text-sm ${n <= value ? 'text-primary' : 'text-muted-foreground/25'}`}>★</span>
        ))}
      </div>
      <span className="text-xs font-semibold">{value}/10</span>
    </div>
  )
}

export default function ReadingLog() {
  const qc = useQueryClient()
  const listKey = () => trpc.books.list.queryOptions().queryKey
  const { data: books = [] } = useQuery(trpc.books.list.queryOptions())

  const createBook = useMutation(trpc.books.create.mutationOptions({
    onSuccess: () => { qc.invalidateQueries({ queryKey: listKey() }); toast.success('Book added') },
    onError: () => toast.error('Failed to add book'),
  }))
  const updateBook = useMutation(trpc.books.update.mutationOptions({
    onSuccess: () => { qc.invalidateQueries({ queryKey: listKey() }); toast.success('Book saved') },
    onError: () => toast.error('Failed to save book'),
  }))
  const deleteBook = useMutation(trpc.books.delete.mutationOptions({
    onSuccess: () => { qc.invalidateQueries({ queryKey: listKey() }); toast.success('Book deleted') },
    onError: () => toast.error('Failed to delete book'),
  }))

  const { open, editing, form, search, openAdd, openEdit, close, setForm, setSearch } = useBooksStore()

  function save() {
    if (!form.title.trim() || !form.summary.trim()) return
    if (editing) {
      updateBook.mutate({ id: editing.id, ...form })
    } else {
      createBook.mutate(form)
    }
    close()
  }

  function remove(id: string) {
    deleteBook.mutate({ id })
  }

  const filtered = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      b.genre.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" /> Reading Log
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
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
        <div className="text-center py-16 text-muted-foreground">
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
                  <p className="text-sm text-muted-foreground">by {book.author}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {book.genre && <Badge variant="secondary">{book.genre}</Badge>}
                    {book.dateFinished && (
                      <Badge variant="outline">Finished: {book.dateFinished}</Badge>
                    )}
                    <Badge className="bg-accent text-accent-foreground border-accent/50">
                      <Star className="h-3 w-3 mr-1" /> {book.overallRating}/10
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(book)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(book.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Summary</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{book.summary}</p>
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
                    <p className="text-sm text-muted-foreground leading-relaxed">{book.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) close() }}>
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
                className="min-h-30"
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
                className="min-h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={save} disabled={!form.title.trim() || !form.summary.trim()}>
              {editing ? 'Save Changes' : 'Add Book'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
