import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { LoaderCircle } from 'lucide-react'
import { ApiError } from '../../../shared/api/errors'
import { getErrorMessage } from '../../../shared/api/errors'
import { validateProjectField, type ProjectValues } from '../schemas/projects.schemas'

type ProjectField = keyof ProjectValues

interface InlineProjectFieldProps {
  projectId: string
  projectName: string
  field: ProjectField
  label: string
  value: string
  emptyText?: string
  displayClassName: string
  multiline?: boolean
  onSave: (value: string) => Promise<unknown>
}

export function InlineProjectField({
  projectId,
  projectName,
  field,
  label,
  value,
  emptyText,
  displayClassName,
  multiline = false,
  onSave,
}: InlineProjectFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const displayRef = useRef<HTMLButtonElement>(null)
  const wasEditing = useRef(false)
  const saveLock = useRef(false)
  const inputId = `project-${projectId}-${field}`
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`
  const fieldLabel = `${label} for ${projectName}`

  useEffect(() => {
    if (wasEditing.current && !editing) displayRef.current?.focus()
    wasEditing.current = editing
  }, [editing])

  function startEditing() {
    setDraft(value)
    setError('')
    setEditing(true)
  }

  function cancelEditing() {
    setDraft(value)
    setError('')
    setEditing(false)
  }

  async function save() {
    if (saveLock.current || saving) return
    const parsed = validateProjectField(field, draft, field === 'key')
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid value')
      return
    }

    const nextValue = parsed.data
    if (nextValue === value) {
      setEditing(false)
      setError('')
      return
    }

    saveLock.current = true
    setSaving(true)
    setError('')
    try {
      await onSave(nextValue)
      setEditing(false)
    } catch (saveError) {
      setError(saveError instanceof ApiError && saveError.status === 409
        ? 'This key is already used'
        : getErrorMessage(saveError))
    } finally {
      saveLock.current = false
      setSaving(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      cancelEditing()
    } else if (event.key === 'Enter' && !(multiline && event.shiftKey)) {
      event.preventDefault()
      void save()
    }
  }

  if (!editing) {
    return (
      <button
        ref={displayRef}
        type="button"
        aria-label={`Edit ${fieldLabel}`}
        onClick={startEditing}
        className={`max-w-full rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${displayClassName}`}
      >
        {value || emptyText}
      </button>
    )
  }

  const describedBy = [
    field === 'key' ? hintId : undefined,
    error ? errorId : undefined,
  ].filter(Boolean).join(' ') || undefined
  const editorClassName = field === 'key'
    ? 'h-6 w-[7ch] min-w-0 rounded-xs border border-brand/20 bg-transparent px-0.5 font-mono text-caption font-medium uppercase leading-none text-brand-ink transition-colors focus:border-brand/50 focus:outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-brand/50'
    : 'h-8 w-full min-w-0 rounded-sm border border-line bg-surface px-2 text-small text-ink transition-colors focus:border-brand/50 focus:outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-brand/50'
  const inputProps = {
    id: inputId,
    autoFocus: true,
    'aria-label': fieldLabel,
    'aria-describedby': describedBy,
    invalid: Boolean(error),
    value: draft,
    disabled: saving,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const next = event.currentTarget.value
      setDraft(field === 'key' ? next.toUpperCase() : next)
      if (error) setError('')
    },
    onKeyDown: handleKeyDown,
    onBlur: () => void save(),
  }

  return (
    <div className={`min-w-0 ${field === 'key' ? 'inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 align-top' : 'grid w-full gap-1'}`}>
      {multiline
        ? <textarea {...inputProps} rows={2} className={`${editorClassName} h-auto min-h-16 resize-y py-1.5`} />
        : <input {...inputProps} className={editorClassName} maxLength={field === 'key' ? 6 : undefined} />}
      {field === 'key' && <p id={hintId} className="text-caption leading-snug text-muted">Changing the key does not change existing todo keys.</p>}
      {error && <p id={errorId} role="alert" className="text-caption text-danger">{error}</p>}
      {saving && (
        <span className="inline-flex items-center gap-1 text-caption text-muted" role="status">
          <LoaderCircle aria-hidden="true" className="size-3 animate-spin" />
          Saving…
        </span>
      )}
    </div>
  )
}
