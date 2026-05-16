import { useState, useRef } from 'react'
import { Plus, X, GripVertical, Trash2 } from 'lucide-react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { cn } from '@/lib/utils'

interface Card {
  id: string
  text: string
}

interface Column {
  id: string
  title: string
  cards: Card[]
}

const COLUMN_COLORS: Record<string, string> = {
  'To Do': 'bg-blue-50 border-blue-200',
  'In Progress': 'bg-yellow-50 border-yellow-200',
  'Done': 'bg-green-50 border-green-200',
}

const DEFAULT_COLUMNS: Column[] = [
  { id: 'todo', title: 'To Do', cards: [] },
  { id: 'inprogress', title: 'In Progress', cards: [] },
  { id: 'done', title: 'Done', cards: [] },
]

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export default function TodoList() {
  const [columns, setColumns] = useLocalStorage<Column[]>('kanban-columns', DEFAULT_COLUMNS)
  const [addingCardTo, setAddingCardTo] = useState<string | null>(null)
  const [newCardText, setNewCardText] = useState('')
  const [addingColumn, setAddingColumn] = useState(false)
  const [newColTitle, setNewColTitle] = useState('')
  const [editingColId, setEditingColId] = useState<string | null>(null)
  const [editingColTitle, setEditingColTitle] = useState('')

  const dragCard = useRef<{ cardId: string; fromColId: string } | null>(null)
  const dragOverColId = useRef<string | null>(null)

  function addCard(colId: string) {
    const text = newCardText.trim()
    if (!text) return
    setColumns((cols) =>
      cols.map((col) =>
        col.id === colId
          ? { ...col, cards: [...col.cards, { id: uid(), text }] }
          : col
      )
    )
    setNewCardText('')
    setAddingCardTo(null)
  }

  function deleteCard(colId: string, cardId: string) {
    setColumns((cols) =>
      cols.map((col) =>
        col.id === colId
          ? { ...col, cards: col.cards.filter((c) => c.id !== cardId) }
          : col
      )
    )
  }

  function addColumn() {
    const title = newColTitle.trim()
    if (!title) return
    setColumns((cols) => [...cols, { id: uid(), title, cards: [] }])
    setNewColTitle('')
    setAddingColumn(false)
  }

  function deleteColumn(colId: string) {
    setColumns((cols) => cols.filter((c) => c.id !== colId))
  }

  function startRenameCol(col: Column) {
    setEditingColId(col.id)
    setEditingColTitle(col.title)
  }

  function saveRenameCol(colId: string) {
    const title = editingColTitle.trim()
    if (title) {
      setColumns((cols) =>
        cols.map((col) => (col.id === colId ? { ...col, title } : col))
      )
    }
    setEditingColId(null)
  }

  function onDragStart(cardId: string, fromColId: string) {
    dragCard.current = { cardId, fromColId }
  }

  function onDragOver(e: React.DragEvent, colId: string) {
    e.preventDefault()
    dragOverColId.current = colId
  }

  function onDrop(toColId: string) {
    if (!dragCard.current) return
    const { cardId, fromColId } = dragCard.current
    if (fromColId === toColId) return

    setColumns((cols) => {
      const card = cols.find((c) => c.id === fromColId)?.cards.find((c) => c.id === cardId)
      if (!card) return cols
      return cols.map((col) => {
        if (col.id === fromColId) return { ...col, cards: col.cards.filter((c) => c.id !== cardId) }
        if (col.id === toColId) return { ...col, cards: [...col.cards, card] }
        return col
      })
    })
    dragCard.current = null
    dragOverColId.current = null
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">To Do List</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Drag cards between columns to track progress.
        </p>
      </div>

      <div className="flex gap-4 items-start overflow-x-auto pb-4">
        {columns.map((col) => {
          const colorClass = COLUMN_COLORS[col.title] ?? 'bg-gray-50 border-gray-200'
          return (
            <div
              key={col.id}
              className={cn(
                'flex-shrink-0 w-72 rounded-xl border-2 flex flex-col',
                colorClass
              )}
              onDragOver={(e) => onDragOver(e, col.id)}
              onDrop={() => onDrop(col.id)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 pt-3 pb-2">
                {editingColId === col.id ? (
                  <input
                    autoFocus
                    className="flex-1 text-sm font-semibold bg-white border border-[hsl(var(--border))] rounded px-2 py-0.5 mr-2"
                    value={editingColTitle}
                    onChange={(e) => setEditingColTitle(e.target.value)}
                    onBlur={() => saveRenameCol(col.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRenameCol(col.id)
                      if (e.key === 'Escape') setEditingColId(null)
                    }}
                  />
                ) : (
                  <button
                    className="flex-1 text-left text-sm font-semibold text-[hsl(var(--foreground))] hover:underline"
                    onDoubleClick={() => startRenameCol(col)}
                    title="Double-click to rename"
                  >
                    {col.title}
                    <span className="ml-2 text-xs font-normal text-[hsl(var(--muted-foreground))]">
                      {col.cards.length}
                    </span>
                  </button>
                )}
                <button
                  onClick={() => deleteColumn(col.id)}
                  className="p-1 rounded hover:bg-black/10 text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-colors"
                  title="Delete column"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 px-3 min-h-[60px]">
                {col.cards.map((card) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={() => onDragStart(card.id, col.id)}
                    className="group flex items-start gap-2 bg-white rounded-lg border border-[hsl(var(--border))] px-3 py-2.5 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                  >
                    <GripVertical className="h-4 w-4 mt-0.5 flex-shrink-0 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="flex-1 text-sm leading-snug break-words">{card.text}</span>
                    <button
                      onClick={() => deleteCard(col.id, card.id)}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-50 hover:text-red-500 text-[hsl(var(--muted-foreground))]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add card */}
              <div className="px-3 pt-2 pb-3">
                {addingCardTo === col.id ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      autoFocus
                      className="w-full text-sm bg-white border border-[hsl(var(--border))] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                      rows={2}
                      placeholder="Card title..."
                      value={newCardText}
                      onChange={(e) => setNewCardText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          addCard(col.id)
                        }
                        if (e.key === 'Escape') {
                          setAddingCardTo(null)
                          setNewCardText('')
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => addCard(col.id)}
                        className="flex-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
                      >
                        Add card
                      </button>
                      <button
                        onClick={() => { setAddingCardTo(null); setNewCardText('') }}
                        className="px-3 py-1.5 text-sm text-[hsl(var(--muted-foreground))] rounded-lg hover:bg-black/5 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddingCardTo(col.id); setNewCardText('') }}
                    className="w-full flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-black/5 rounded-lg px-2 py-1.5 transition-colors"
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
        <div className="flex-shrink-0 w-72">
          {addingColumn ? (
            <div className="bg-[hsl(var(--secondary))] rounded-xl border-2 border-[hsl(var(--border))] p-3 flex flex-col gap-2">
              <input
                autoFocus
                className="w-full text-sm bg-white border border-[hsl(var(--border))] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
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
                  className="flex-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
                >
                  Add column
                </button>
                <button
                  onClick={() => { setAddingColumn(false); setNewColTitle('') }}
                  className="px-3 py-1.5 text-sm text-[hsl(var(--muted-foreground))] rounded-lg hover:bg-black/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingColumn(true)}
              className="w-full flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--accent))] border-2 border-dashed border-[hsl(var(--border))] rounded-xl px-4 py-3 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add column
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
