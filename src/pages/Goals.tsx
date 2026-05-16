import { useState } from 'react'
import { Plus, Target, Trash2, Pencil, CheckCircle2 } from 'lucide-react'
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
import type { Goal } from '@/types'

const emptyGoal = (): Omit<Goal, 'id' | 'createdAt'> => ({
  title: '',
  category: '',
  description: '',
  status: 'not-started',
  priority: 'medium',
  targetDate: '',
  progress: 0,
  notes: '',
})

const statusConfig: Record<Goal['status'], { label: string; color: string }> = {
  'not-started': { label: 'Not Started', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800 border-green-200' },
  paused: { label: 'Paused', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
}

const priorityConfig: Record<Goal['priority'], { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  medium: { label: 'Medium', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  high: { label: 'High Priority', color: 'bg-red-100 text-red-700 border-red-200' },
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
        <span>Progress</span>
        <span>{value}%</span>
      </div>
      <div className="w-full bg-[hsl(var(--secondary))] rounded-full h-2">
        <div
          className="bg-[hsl(var(--primary))] h-2 rounded-full transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export default function Goals() {
  const [goals, setGoals] = useLocalStorage<Goal[]>('misc-goals', [])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [form, setForm] = useState(emptyGoal())
  const [filterStatus, setFilterStatus] = useState<Goal['status'] | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<Goal['priority'] | 'all'>('all')

  function openAdd() {
    setEditing(null)
    setForm(emptyGoal())
    setOpen(true)
  }

  function openEdit(goal: Goal) {
    setEditing(goal)
    const { id: _id, createdAt: _ca, ...rest } = goal
    setForm(rest)
    setOpen(true)
  }

  function save() {
    if (!form.title.trim()) return
    if (editing) {
      setGoals(goals.map((g) => (g.id === editing.id ? { ...editing, ...form } : g)))
    } else {
      setGoals([{ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...form }, ...goals])
    }
    setOpen(false)
  }

  function remove(id: string) {
    setGoals(goals.filter((g) => g.id !== id))
  }

  function quickComplete(id: string) {
    setGoals(goals.map((g) => (g.id === id ? { ...g, status: 'completed', progress: 100 } : g)))
  }

  const filtered = goals.filter((g) => {
    const matchStatus = filterStatus === 'all' || g.status === filterStatus
    const matchPriority = filterPriority === 'all' || g.priority === filterPriority
    return matchStatus && matchPriority
  })

  const completed = goals.filter((g) => g.status === 'completed').length
  const inProgress = goals.filter((g) => g.status === 'in-progress').length

  const categories = [...new Set(goals.map((g) => g.category).filter(Boolean))]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" /> Miscellaneous Goals
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
            {goals.length} total · {inProgress} in progress · {completed} completed
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Goal
        </Button>
      </div>

      {goals.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="not-started">Not Started</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as typeof filterPriority)}>
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="All priorities" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-[hsl(var(--muted-foreground))] self-center mr-1">Categories:</span>
          {categories.map((cat) => (
            <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-[hsl(var(--muted-foreground))]">
          <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">{goals.length === 0 ? 'No goals yet' : 'No results'}</p>
          <p className="text-sm">{goals.length === 0 ? 'Set your first goal and start tracking.' : 'Try different filters.'}</p>
        </div>
      )}

      <div className="grid gap-4">
        {filtered.map((goal) => (
          <Card key={goal.id} className={goal.status === 'completed' ? 'opacity-75' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {goal.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {goal.title}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {goal.category && <Badge variant="outline">{goal.category}</Badge>}
                    <Badge className={statusConfig[goal.status].color}>{statusConfig[goal.status].label}</Badge>
                    <Badge className={priorityConfig[goal.priority].color}>{priorityConfig[goal.priority].label}</Badge>
                    {goal.targetDate && (
                      <Badge variant="outline" className="text-xs">Target: {goal.targetDate}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {goal.status !== 'completed' && (
                    <Button variant="ghost" size="icon" onClick={() => quickComplete(goal.id)} title="Mark complete" className="text-green-600 hover:text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => openEdit(goal)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(goal.id)}
                    className="text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {goal.description && (
                <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{goal.description}</p>
              )}
              <ProgressBar value={goal.progress} />
              {goal.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-1">Notes</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{goal.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Goal' : 'Add Goal'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What do you want to achieve?" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Health, Career, Skills" />
              </div>
              <div className="space-y-2">
                <Label>Target Date</Label>
                <Input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the goal, why it matters, and how you plan to achieve it…"
                className="min-h-[90px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Goal['status'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-started">Not Started</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Goal['priority'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Progress: {form.progress}%</Label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={form.progress}
                onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
                className="w-full accent-[hsl(var(--primary))]"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional notes, milestones, or reflections…"
                className="min-h-[70px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.title.trim()}>
              {editing ? 'Save Changes' : 'Add Goal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
