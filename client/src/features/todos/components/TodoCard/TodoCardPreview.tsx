import type { Todo } from '@/shared/types/api'
import { CardBody } from './CardBody'
import { CardHeader } from './CardHeader'

export function TodoCardPreview({
  todo,
  className = '',
}: {
  todo: Todo
  className?: string
}) {
  return (
    <article
      className={`theme-card board-card w-full border-brand p-3 ${className}`}
    >
      <CardHeader todo={todo} />
      <CardBody todo={todo} />
    </article>
  )
}
