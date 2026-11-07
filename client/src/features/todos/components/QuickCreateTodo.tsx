import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Plus } from 'lucide-react'
import { getErrorMessage } from '@/shared/api/errors'
import { Button } from '@/shared/components/Button'
import { useTodoMutations } from '@/features/todos/hooks/useTodos'

interface QuickCreateTodoProps {
  projectId: string
  sprintId?: string
  variant?: 'default' | 'backlog'
}

export function QuickCreateTodo({ projectId, sprintId = '', variant = 'default' }: QuickCreateTodoProps) {
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const mutations = useTodoMutations(projectId)

  async function createTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    setError('')
    try {
      await mutations.create.mutateAsync({ title: trimmed, ...(sprintId ? { sprintId } : {}) })
      setTitle('')
      inputRef.current?.focus()
    } catch (cause) {
      setError(getErrorMessage(cause))
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setTitle('')
      setError('')
      inputRef.current?.blur()
    }
  }

  return (
    <div className={variant === 'backlog' ? '' : 'mt-3'}>
      <form onSubmit={createTodo} className={`flex items-center gap-2 ${variant === 'backlog' ? 'min-h-10' : ''}`}>
        <label htmlFor={`quick-create-${sprintId || 'backlog'}`} className="sr-only">Create todo</label>
        {variant === 'backlog' && (
          <span className="flex shrink-0 items-center gap-2 text-small font-medium text-ink">
            <Plus aria-hidden="true" className="size-4 text-brand-ink" />
            Create todo
          </span>
        )}
        <input
          ref={inputRef}
          data-shortcut-create
          id={`quick-create-${sprintId || 'backlog'}`}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={variant === 'backlog' ? 'Type a title and press Enter...' : '+ Create todo'}
          maxLength={200}
          className="min-h-9 min-w-0 flex-1 rounded-sm border border-transparent bg-transparent px-3 text-body text-ink placeholder:text-muted hover:border-line focus:bg-surface"
        />
        {variant === 'backlog' ? (
          <button type="submit" className="sr-only" disabled={!title.trim() || mutations.create.isPending}>
            Create todo
          </button>
        ) : (
          <Button type="submit" size="sm" variant="ghost" disabled={!title.trim()} loading={mutations.create.isPending} aria-label="Create todo">
            <Plus aria-hidden="true" className="size-4" />
          </Button>
        )}
      </form>
      {error && <p role="alert" className="mt-1 text-small text-danger">{error}</p>}
    </div>
  )
}
