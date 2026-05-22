import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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
import { trpc } from '@/router'
import type { Goal } from '@/types'
import { useGoalsStore } from '@/store/goals'
import { useQueryState } from 'nuqs'

const statusConfig: Record<Goal['status'], { label: string; color: string }> = {
  'not-started': { label: 'Not Started', color: 'bg-muted text-muted-foreground border-border' },
  'in-progress': { label: 'In Progress', color: 'bg-primary/15 text-primary border-primary/30' },
  completed: { label: 'Completed', color: 'bg-secondary text-secondary-foreground border-border' },
  paused: { label: 'Paused', color: 'bg-accent text-accent-foreground border-accent/50' },
}

const priorityConfig: Record<Goal['priority'], { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-muted text-muted-foreground border-border' },
  medium: { label: 'Medium', color: 'bg-accent text-accent-foreground border-accent/50' },
  high: { label: 'High Priority', color: 'bg-destructive/15 text-destructive border-destructive/30' },
}

const goalStatuses = ['not-started', 'in-progress', 'completed', 'paused'] as const
const goalPriorities = ['low', 'medium', 'high'] as const

function isGoalStatus(value: string | null): value is Goal['status'] {
  return value !== null && (goalStatuses as readonly string[]).includes(value)
}

function isGoalPriority(value: string | null): value is Goal['priority'] {
  return value !== null && (goalPriorities as readonly string[]).includes(value)
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Progress</span>
        <span>{value}%</span>
      </div>
      <div className="w-full bg-secondary rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export default function Goals() {
  const qc = useQueryClient()
  const [statusParam, setStatusParam] = useQueryState('status')
  const [priorityParam, setPriorityParam] = useQueryState('priority')

  const filterStatus = isGoalStatus(statusParam) ? statusParam : 'all'
  const filterPriority = isGoalPriority(priorityParam) ? priorityParam : 'all'

  const listFilters = {
    status: filterStatus === 'all' ? undefined : filterStatus,
    priority: filterPriority === 'all' ? undefined : filterPriority,
  }

  const listQuery = trpc.goals.list.queryOptions(listFilters)
  const { data: goals = [] } = useQuery(listQuery)
  const listKey = listQuery.queryKey

  const createGoal = useMutation(trpc.goals.create.mutationOptions({
    onSuccess: () => { qc.invalidateQueries({ queryKey: listKey }); toast.success('Goal added') },
    onError: () => toast.error('Failed to add goal'),
  }))
  const updateGoal = useMutation(trpc.goals.update.mutationOptions({
    onSuccess: () => { qc.invalidateQueries({ queryKey: listKey }); toast.success('Goal saved') },
    onError: () => toast.error('Failed to save goal'),
  }))
  const deleteGoal = useMutation(trpc.goals.delete.mutationOptions({
    onSuccess: () => { qc.invalidateQueries({ queryKey: listKey }); toast.success('Goal deleted') },
    onError: () => toast.error('Failed to delete goal'),
  }))

  const { open, editing, form, openAdd, openEdit, close, setForm } = useGoalsStore()

  function save() {
    if (!form.title.trim()) return
    if (editing) {
      updateGoal.mutate({ id: editing.id, ...form })
    } else {
      createGoal.mutate(form)
    }
    close()
  }

  function remove(id: string) {
    deleteGoal.mutate({ id })
  }

  function quickComplete(id: string) {
    updateGoal.mutate({ id, status: 'completed', progress: 100 })
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" /> Miscellaneous Goals
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {goals.length} total · {inProgress} in progress · {completed} completed
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Goal
        </Button>
      </div>

      {(goals.length > 0 || filterStatus !== 'all' || filterPriority !== 'all') && (
        <div className="flex flex-wrap gap-2">
          <Select
            value={filterStatus}
            onValueChange={(value) => setStatusParam(value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="not-started">Not Started</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filterPriority}
            onValueChange={(value) => setPriorityParam(value === 'all' ? null : value)}
          >
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
          <span className="text-xs text-muted-foreground self-center mr-1">Categories:</span>
          {categories.map((cat) => (
            <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
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
                    {goal.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-primary" />}
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
                    <Button variant="ghost" size="icon" onClick={() => quickComplete(goal.id)} title="Mark complete" className="text-primary hover:text-primary">
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
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {goal.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{goal.description}</p>
              )}
              <ProgressBar value={goal.progress} />
              {goal.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{goal.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) close() }}>
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
                className="min-h-22.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Goal['status'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className='opacity-105'>
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
                className="w-full accent-primary"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional notes, milestones, or reflections…"
                className="min-h-17.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={save} disabled={!form.title.trim()}>
              {editing ? 'Save Changes' : 'Add Goal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
