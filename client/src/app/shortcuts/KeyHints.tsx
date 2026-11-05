export function KeyHints({ keys }: { keys?: string[] }) {
  if (!keys?.length) return null
  return (
    <span className="ms-auto flex shrink-0 items-center gap-1" dir="ltr">
      {keys.map((key, index) => (
        <kbd key={`${key}-${index}`} className="rounded-xs border border-line bg-sunken px-1.5 py-0.5 font-mono text-caption text-muted">
          {key}
        </kbd>
      ))}
    </span>
  )
}
