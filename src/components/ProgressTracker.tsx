import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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
import { trpc } from '@/router'
import type { ProjectEntry } from '@/types'
import { useProjectsStore } from '@/store/projects'

const statusColors: Record<ProjectEntry['status'], string> = {
  'in-progress': 'bg-primary/15 text-primary border-primary/30',
  completed: 'bg-secondary text-secondary-foreground border-border',
  abandoned: 'bg-destructive/15 text-destructive border-destructive/30',
}

const statusLabels: Record<ProjectEntry['status'], string> = {
  'in-progress': 'In Progress',
  completed: 'Completed',
  abandoned: 'Abandoned',
}

export default function ProgressTracker() {
  const qc = useQueryClient()
  const listKey = () => trpc.projects.list.queryOptions().queryKey
  const { data: entries = [] } = useQuery(trpc.projects.list.queryOptions())

  const createProject = useMutation(trpc.projects.create.mutationOptions({
    onSuccess: () => { qc.invalidateQueries({ queryKey: listKey() }); toast.success('Entry added') },
    onError: () => toast.error('Failed to add entry'),
  }))
  const updateProject = useMutation(trpc.projects.update.mutationOptions({
    onSuccess: () => { qc.invalidateQueries({ queryKey: listKey() }); toast.success('Entry saved') },
    onError: () => toast.error('Failed to save entry'),
  }))
  const deleteProject = useMutation(trpc.projects.delete.mutationOptions({
    onSuccess: () => { qc.invalidateQueries({ queryKey: listKey() }); toast.success('Entry deleted') },
    onError: () => toast.error('Failed to delete entry'),
  }))

  const { open, editing, form, filter, openAdd, openEdit, close, setForm, setFilter } = useProjectsStore()

  function save() {
    if (!form.title.trim() || !form.description.trim()) return
    if (editing) {
      updateProject.mutate({ id: editing.id, ...form })
    } else {
      createProject.mutate(form)
    }
    close()
  }

  function remove(id: string) {
    deleteProject.mutate({ id })
  }

  const filtered = entries.filter((e) => filter === 'all' || e.type === filter)
  const projects = entries.filter((e) => e.type === 'project')
  const openSource = entries.filter((e) => e.type === 'open-source')
  const completed = entries.filter((e) => e.status === 'completed')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Code2 className="h-6 w-6" /> Progress Tracker
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
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
        <div className="text-center py-16 text-muted-foreground">
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
                    {entry.type === 'open-source' ? <GitMerge className="h-4 w-4 text-primary" /> : <Code2 className="h-4 w-4 text-muted-foreground" />}
                    {entry.title}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 pt-1 ">
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
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{entry.description}</p>
              </div>
              {entry.link && (
                <a
                  href={entry.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
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
                  <p className="text-sm text-muted-foreground leading-relaxed">{entry.impact}</p>
                </div>
              )}
              {entry.lessonsLearned && (
                <div>
                  <p className="text-sm font-medium mb-1">Lessons Learned</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{entry.lessonsLearned}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) close() }}>
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
                className="min-h-25"
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
                className="min-h-17.5"
              />
            </div>
            <div className="space-y-2">
              <Label>Lessons Learned</Label>
              <Textarea
                value={form.lessonsLearned}
                onChange={(e) => setForm({ ...form, lessonsLearned: e.target.value })}
                placeholder="What did you learn from this experience?"
                className="min-h-17.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={save} disabled={!form.title.trim() || !form.description.trim()}>
              {editing ? 'Save Changes' : 'Add Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
