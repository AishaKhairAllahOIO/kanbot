import { useEffect, useRef, useState } from 'react'
import { Check, Copy, RefreshCw, Sparkles } from 'lucide-react'
import type { ChatMessage } from '../../../shared/types/api'
import { useTypewriter } from '../hooks/useTypewriter'
import { copyText } from '../utils/clipboard'
import { AssistantMarkdown } from './AssistantMarkdown'

interface AssistantMessageProps {
  message: ChatMessage
  animate: boolean
  isLatest: boolean
  busy: boolean
  onRegenerate: () => void
}

export function AssistantMessage({
  message,
  animate,
  isLatest,
  busy,
  onRegenerate,
}: AssistantMessageProps) {
  const { text, isTyping, skip } = useTypewriter(
    message.content,
    message.role === 'assistant' && animate,
  )
  const [copied, setCopied] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const copiedTimeout = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (copiedTimeout.current !== null) window.clearTimeout(copiedTimeout.current)
    },
    [],
  )

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-chat-bubble rounded-md rounded-br-xs bg-brand px-3 py-2 text-body text-on-brand">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
    )
  }

  async function handleCopy() {
    const success = await copyText(message.content)
    setAnnouncement(success ? 'Message copied to clipboard' : 'Could not copy message')
    if (!success) return

    setCopied(true)
    if (copiedTimeout.current !== null) window.clearTimeout(copiedTimeout.current)
    copiedTimeout.current = window.setTimeout(() => {
      setCopied(false)
      copiedTimeout.current = null
    }, 2000)
  }

  const showActions = !isTyping && !busy

  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 grid size-8 shrink-0 place-content-center rounded-md bg-brand-soft text-brand-ink">
        <Sparkles aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <AssistantMarkdown content={text} />
        {isTyping && (
          <button
            type="button"
            onClick={skip}
            className="mt-1 text-caption text-brand-ink underline underline-offset-4"
            aria-label="Show the full AI response"
          >
            Skip typing
          </button>
        )}
        {showActions && (
          <div className="mt-1 flex items-center gap-1">
            <button
              type="button"
              onClick={() => void handleCopy()}
              aria-label={copied ? 'Copied' : 'Copy message'}
              title={copied ? 'Copied' : 'Copy message'}
              className="grid size-11 place-content-center rounded-sm text-muted transition-colors hover:bg-sunken hover:text-ink"
            >
              {copied ? (
                <Check aria-hidden="true" className="size-4 text-success" />
              ) : (
                <Copy aria-hidden="true" className="size-4" />
              )}
            </button>
            {isLatest && (
              <button
                type="button"
                onClick={onRegenerate}
                disabled={busy}
                aria-label="Regenerate response"
                title="Regenerate response"
                className="grid size-11 place-content-center rounded-sm text-muted transition-colors hover:bg-sunken hover:text-ink disabled:opacity-50"
              >
                <RefreshCw aria-hidden="true" className="size-4" />
              </button>
            )}
          </div>
        )}
        <span className="sr-only" aria-live="polite">
          {announcement}
        </span>
      </div>
    </div>
  )
}
