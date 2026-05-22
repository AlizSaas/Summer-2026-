import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, X, GripVertical, Trash2 } from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { trpc } from '@/router'
import { cn } from '@/lib/utils'

const COLUMN_COLORS: Record<string, string> = {
  'To Do': 'bg-secondary/50 border-border',
  'In Progress': 'bg-accent/40 border-accent/60',
  Done: 'bg-primary/10 border-primary/25',
}

type CardItem = {
  id: string
  text: string
  position: number
  columnId: string
  userId: string
  createdAt: string | null
}

// ─── SortableCard ─────────────────────────────────────────────────────────────

function SortableCard({
  card,
  onDelete,
}: {
  card: CardItem
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group flex items-start gap-2 bg-card rounded-lg border border-border px-3 py-2.5 shadow-sm hover:shadow-md transition-shadow',
        isDragging && 'opacity-40 border-dashed'
      )}
      {...attributes}
    >
      <div
        {...listeners}
        className="cursor-grab active:cursor-grabbing mt-0.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <span className="flex-1 text-sm leading-snug wrap-break-word">{card.text}</span>
      <button
        onClick={() => onDelete(card.id)}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ─── DragOverlay ghost card ───────────────────────────────────────────────────

function CardOverlay({ card }: { card: CardItem }) {
  return (
    <div className="flex items-start gap-2 bg-card rounded-lg border-2 border-primary/40 px-3 py-2.5 shadow-xl rotate-1 cursor-grabbing w-72">
      <GripVertical className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
      <span className="flex-1 text-sm leading-snug wrap-break-word">{card.text}</span>
    </div>
  )
}

// ─── Droppable column body ────────────────────────────────────────────────────

function DroppableColumnBody({
  colId,
  cards,
  onDelete,
}: {
  colId: string
  cards: CardItem[]
  onDelete: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: colId })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col gap-2 px-3 min-h-15 rounded-lg transition-colors duration-150',
        isOver && cards.length === 0 && 'bg-accent/30'
      )}
    >
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        {cards.map((card) => (
          <SortableCard key={card.id} card={card} onDelete={onDelete} />
        ))}
      </SortableContext>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TodoList() {
  const qc = useQueryClient()
  const boardKey = () => trpc.todos.getBoard.queryOptions().queryKey
  const { data: columns = [] } = useQuery(trpc.todos.getBoard.queryOptions())

  const createColumn = useMutation(
    trpc.todos.createColumn.mutationOptions({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: boardKey() })
        toast.success('Column added')
      },
      onError: () => toast.error('Failed to add column'),
    })
  )
  const renameColumn = useMutation(
    trpc.todos.renameColumn.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: boardKey() }),
    })
  )
  const deleteColumn = useMutation(
    trpc.todos.deleteColumn.mutationOptions({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: boardKey() })
        toast.success('Column deleted')
      },
      onError: () => toast.error('Failed to delete column'),
    })
  )
  const createCard = useMutation(
    trpc.todos.createCard.mutationOptions({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: boardKey() })
        toast.success('Card added')
      },
      onError: () => toast.error('Failed to add card'),
    })
  )
  const deleteCard = useMutation(
    trpc.todos.deleteCard.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: boardKey() }),
      onError: () => toast.error('Failed to delete card'),
    })
  )
  const moveCard = useMutation(
    trpc.todos.moveCard.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: boardKey() }),
      onError: () => toast.error('Failed to move card'),
    })
  )

  const [addingCardTo, setAddingCardTo] = useState<string | null>(null)
  const [newCardText, setNewCardText] = useState('')
  const [addingColumn, setAddingColumn] = useState(false)
  const [newColTitle, setNewColTitle] = useState('')
  const [editingColId, setEditingColId] = useState<string | null>(null)
  const [editingColTitle, setEditingColTitle] = useState('')
  const [activeCardId, setActiveCardId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const allCards = columns.flatMap((c) => c.cards)
  const activeCard = activeCardId ? (allCards.find((c) => c.id === activeCardId) ?? null) : null

  function addCard(colId: string) {
    const text = newCardText.trim()
    if (!text) return
    const col = columns.find((c) => c.id === colId)
    const position = col ? col.cards.length : 0
    createCard.mutate({ columnId: colId, text, position })
    setAddingCardTo(null)
    setNewCardText('')
  }

  function addColumn() {
    const title = newColTitle.trim()
    if (!title) return
    createColumn.mutate({ title, position: columns.length })
    setAddingColumn(false)
    setNewColTitle('')
  }

  function saveRenameCol(colId: string) {
    const title = editingColTitle.trim()
    if (title) renameColumn.mutate({ id: colId, title })
    setEditingColId(null)
    setEditingColTitle('')
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveCardId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCardId(null)
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    const sourceCol = columns.find((col) => col.cards.some((c) => c.id === activeId))
    if (!sourceCol) return

    const overIsColumn = columns.some((col) => col.id === overId)

    if (overIsColumn) {
      const destCol = columns.find((col) => col.id === overId)
      if (!destCol) return
      moveCard.mutate({ id: activeId, toColumnId: overId, position: destCol.cards.length })
    } else {
      const destCol = columns.find((col) => col.cards.some((c) => c.id === overId))
      if (!destCol) return
      const targetIndex = destCol.cards.findIndex((c) => c.id === overId)
      if (targetIndex === -1) return
      moveCard.mutate({ id: activeId, toColumnId: destCol.id, position: targetIndex })
    }
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">To Do List</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Drag cards between columns to track progress.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 items-start overflow-x-auto pb-4">
          {columns.map((col) => {
            const colorClass = COLUMN_COLORS[col.title] ?? 'bg-gray-50 border-gray-200'
            return (
              <div
                key={col.id}
                className={cn('shrink-0 w-72 rounded-xl border-2 flex flex-col', colorClass)}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-3 pt-3 pb-2">
                  {editingColId === col.id ? (
                    <input
                      autoFocus
                      className="flex-1 text-sm font-semibold bg-background border border-border rounded px-2 py-0.5 mr-2"
                      value={editingColTitle}
                      onChange={(e) => setEditingColTitle(e.target.value)}
                      onBlur={() => saveRenameCol(col.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRenameCol(col.id)
                        if (e.key === 'Escape') { setEditingColId(null); setEditingColTitle('') }
                      }}
                    />
                  ) : (
                    <button
                      className="flex-1 text-left text-sm font-semibold hover:underline"
                      onDoubleClick={() => { setEditingColId(col.id); setEditingColTitle(col.title) }}
                      title="Double-click to rename"
                    >
                      {col.title}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {col.cards.length}
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => deleteColumn.mutate({ id: col.id })}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete column"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Cards */}
                <DroppableColumnBody
                  colId={col.id}
                  cards={col.cards}
                  onDelete={(id) => deleteCard.mutate({ id })}
                />

                {/* Add card */}
                <div className="px-3 pt-2 pb-3">
                  {addingCardTo === col.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        autoFocus
                        className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        rows={2}
                        placeholder="Card title..."
                        value={newCardText}
                        onChange={(e) => setNewCardText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            addCard(col.id)
                          }
                          if (e.key === 'Escape') { setAddingCardTo(null); setNewCardText('') }
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => addCard(col.id)}
                          className="flex-1 bg-primary text-primary-foreground text-sm font-medium rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
                        >
                          Add card
                        </button>
                        <button
                          onClick={() => { setAddingCardTo(null); setNewCardText('') }}
                          className="px-3 py-1.5 text-sm text-muted-foreground rounded-lg hover:bg-accent transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddingCardTo(col.id); setNewCardText('') }}
                      className="w-full flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-lg px-2 py-1.5 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add a card
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* Add column */}
          <div className="shrink-0 w-72">
            {addingColumn ? (
              <div className="bg-secondary/50 rounded-xl border-2 border-border p-3 flex flex-col gap-2">
                <input
                  autoFocus
                  className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Column title..."
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addColumn()
                    if (e.key === 'Escape') { setAddingColumn(false); setNewColTitle('') }
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={addColumn}
                    className="flex-1 bg-primary text-primary-foreground text-sm font-medium rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
                  >
                    Add column
                  </button>
                  <button
                    onClick={() => { setAddingColumn(false); setNewColTitle('') }}
                    className="px-3 py-1.5 text-sm text-muted-foreground rounded-lg hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingColumn(true)}
                className="w-full flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-accent/60 border-2 border-dashed border-border rounded-xl px-4 py-3 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add column
              </button>
            )}
          </div>
        </div>

        <DragOverlay>{activeCard ? <CardOverlay card={activeCard} /> : null}</DragOverlay>
      </DndContext>
    </div>
  )
}
