import { useState } from 'react'
import { Plus, Code2, GitMerge, Trash2, Pencil, ExternalLink } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import type { ProjectEntry } from '@/types'

const emptyProject = (): Omit<ProjectEntry, 'id' | 'createdAt'> => ({
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

const statusColors: Record<ProjectEntry['status'], string> = {
  'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  abandoned: 'bg-red-100 text-red-800 border-red-200',
}

const statusLabels: Record<ProjectEntry['status'], string> = {
  'in-progress': 'In Progress',
  completed: 'Completed',
  abandoned: 'Abandoned',
}

export default function ProgressTracker() {
  const [entries, setEntries] = useLocalStorage<ProjectEntry[]>('progress-tracker', [])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectEntry | null>(null)
  const [form, setForm] = useState(emptyProject())
  const [filter, setFilter] = useState<'all' | 'project' | 'open-source'>('all')

  function openAdd() {
    setEditing(null)
    setForm(emptyProject())
    setOpen(true)
  }

  function openEdit(entry: ProjectEntry) {
    setEditing(entry)
    const { id: _id, createdAt: _ca, ...rest } = entry
    setForm(rest)
    setOpen(true)
  }

  function save() {
    if (!form.title.trim() || !form.description.trim()) return
    if (editing) {
      setEntries(entries.map((e) => (e.id === editing.id ? { ...editing, ...form } : e)))
    } else {
      setEntries([{ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...form }, ...entries])
    }
    setOpen(false)
  }

  function remove(id: string) {
    setEntries(entries.filter((e) => e.id !== id))
  }

  const filtered = entries.filter((e) => filter === 'all' || e.type === filter)
  const projects = entries.filter((e) => e.type === 'project')
  const openSource = entries.filter((e) => e.type === 'open-source')
  const completed = entries.filter((e) => e.status === 'completed')

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Code2 className="h-6 w-6" /> Progress Tracker
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
            {projects.length} project{projects.length !== 1 ? 's' : ''} · {openSource.length} open-source · {completed.length} completed
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Entry
        </Button>
      </div>

      <div className="flex gap-2">
        {(['all', 'project', 'open-source'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'project' ? 'Projects' : 'Open Source'}
          </Button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-[hsl(var(--muted-foreground))]">
          <Code2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">{entries.length === 0 ? 'Nothing tracked yet' : 'No results'}</p>
          <p className="text-sm">{entries.length === 0 ? 'Log your first project or contribution.' : 'Try a different filter.'}</p>
        </div>
      )}

      <div className="grid gap-4">
        {filtered.map((entry) => (
          <Card key={entry.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {entry.type === 'open-source' ? <GitMerge className="h-4 w-4 text-purple-500" /> : <Code2 className="h-4 w-4 text-blue-500" />}
                    {entry.title}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge variant="outline">{entry.type === 'open-source' ? 'Open Source' : 'Project'}</Badge>
                    <Badge className={statusColors[entry.status]}>{statusLabels[entry.status]}</Badge>
                    {entry.startDate && (
                      <Badge variant="outline" className="text-xs">
                        {entry.startDate}{entry.endDate ? ` → ${entry.endDate}` : ' → present'}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(entry)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(entry.id)}
                    className="text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{entry.description}</p>
              </div>
              {entry.link && (
                <a
                  href={entry.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> {entry.link}
                </a>
              )}
              {entry.techStack && (
                <div>
                  <p className="text-sm font-medium mb-1">Tech Stack</p>
                  <div className="flex flex-wrap gap-1">
                    {entry.techStack.split(',').map((t) => (
                      <Badge key={t.trim()} variant="secondary" className="text-xs">{t.trim()}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {(entry.impact || entry.lessonsLearned) && <Separator />}
              {entry.impact && (
                <div>
                  <p className="text-sm font-medium mb-1">Impact</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{entry.impact}</p>
                </div>
              )}
              {entry.lessonsLearned && (
                <div>
                  <p className="text-sm font-medium mb-1">Lessons Learned</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{entry.lessonsLearned}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Entry' : 'Add Entry'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Project or repo name" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ProjectEntry['type'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project">Personal Project</SelectItem>
                    <SelectItem value="open-source">Open Source Contribution</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description / Summary *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe what you built or contributed, the problem it solves, and why it matters…"
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Link (GitHub, live URL, PR, etc.)</Label>
              <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://github.com/…" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tech Stack</Label>
                <Input value={form.techStack} onChange={(e) => setForm({ ...form, techStack: e.target.value })} placeholder="React, TypeScript, Node…" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProjectEntry['status'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="abandoned">Abandoned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Impact</Label>
              <Textarea
                value={form.impact}
                onChange={(e) => setForm({ ...form, impact: e.target.value })}
                placeholder="What was the real-world impact or outcome?"
                className="min-h-[70px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Lessons Learned</Label>
              <Textarea
                value={form.lessonsLearned}
                onChange={(e) => setForm({ ...form, lessonsLearned: e.target.value })}
                placeholder="What did you learn from this experience?"
                className="min-h-[70px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.title.trim() || !form.description.trim()}>
              {editing ? 'Save Changes' : 'Add Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
