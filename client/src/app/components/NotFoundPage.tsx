import { CircleAlert } from 'lucide-react'
import { Link } from 'react-router'
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle('Page not found')

  return (
    <main className="grid min-h-dvh place-content-center justify-items-center gap-4 px-4 py-8 text-center">
      <CircleAlert aria-hidden="true" className="size-8 text-danger" />
      <div className="grid gap-2">
        <h1 className="font-heading text-heading font-semibold">Page not found</h1>
        <p className="text-body text-muted">The page you are looking for does not exist or was moved.</p>
      </div>
      <Link to="/projects" className="text-small font-medium text-brand-ink underline underline-offset-4">
        Go to projects
      </Link>
    </main>
  )
}