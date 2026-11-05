import ReactMarkdown from 'react-markdown'

interface AssistantMarkdownProps {
  content: string
  className?: string
}

/** Renders assistant Markdown. Raw HTML is skipped, never injected. */
export function AssistantMarkdown({ content, className = '' }: AssistantMarkdownProps) {
  return (
    <div className={`markdown-content text-body text-ink ${className}`}>
      <ReactMarkdown
        skipHtml
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
