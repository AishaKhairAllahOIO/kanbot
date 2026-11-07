import { lazy, Suspense } from 'react'

interface AssistantMarkdownProps {
  content: string
  className?: string
}

const MarkdownRenderer = lazy(() => import('./MarkdownRenderer'))

export function AssistantMarkdown({ content, className = '' }: AssistantMarkdownProps) {
  return (
    <div className={`markdown-content text-body text-ink ${className}`}>
      <Suspense fallback={<p className="whitespace-pre-wrap break-words">{content}</p>}>
        <MarkdownRenderer content={content} />
      </Suspense>
    </div>
  )
}
