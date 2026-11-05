import { Send } from 'lucide-react'

interface AssistantComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled: boolean
}

export function AssistantComposer({ value, onChange, onSubmit, disabled }: AssistantComposerProps) {
  const canSend = Boolean(value.trim()) && !disabled

  return (
    <div>
      <form
        className="rounded-md border border-line bg-surface p-1.5 focus-within:border-line-strong"
        onSubmit={(event) => {
          event.preventDefault()
          if (canSend) onSubmit()
        }}
      >
        <div className="flex items-end gap-2">
          <label htmlFor="assistant-message" className="sr-only">
            Message the assistant
          </label>
          <textarea
            id="assistant-message"
            rows={1}
            maxLength={4000}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault()
                if (canSend) onSubmit()
              }
            }}
            placeholder="Ask anything about your sprint..."
            className="min-h-11 max-h-32 flex-1 resize-none bg-transparent px-2 py-2 text-body text-ink outline-none placeholder:text-subtle focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!canSend}
            className="grid size-11 shrink-0 place-content-center rounded-sm bg-brand text-on-brand transition-colors hover:bg-brand-hover active:bg-brand-active disabled:opacity-50"
          >
            <Send aria-hidden="true" className="size-4" />
          </button>
        </div>
      </form>
      <div className="mt-2 grid gap-0.5 px-1 text-caption text-muted">
        <span>Enter to send · Shift+Enter for a new line</span>
        <span>AI can make mistakes. Review before saving.</span>
      </div>
    </div>
  )
}
