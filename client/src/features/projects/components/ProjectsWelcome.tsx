export function ProjectsWelcome() {
  return (
    <section className="page-gutter pb-6 pt-6 text-center">
      <h2 className="font-heading text-title font-semibold text-ink">Pick a project to get started</h2>
      <p className="mt-1 text-small text-muted">
        Backlog, Active Sprint and Sprints open as soon as you choose a project.
      </p>
      <ol aria-label="Getting started" className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-small">
        <li aria-current="step" className="inline-flex items-center gap-2 font-medium text-ink">
          <span className="grid size-6 place-content-center rounded-full bg-brand text-caption font-semibold text-on-brand">1</span>
          Choose a project
        </li>
        <li aria-hidden="true" className="hidden h-px w-8 bg-line-strong sm:block" />
        <li className="inline-flex items-center gap-2 text-muted">
          <span className="grid size-6 place-content-center rounded-full border border-line-strong bg-surface text-caption font-medium">2</span>
          Plan in Backlog
        </li>
        <li aria-hidden="true" className="hidden h-px w-8 bg-line-strong sm:block" />
        <li className="inline-flex items-center gap-2 text-muted">
          <span className="grid size-6 place-content-center rounded-full border border-line-strong bg-surface text-caption font-medium">3</span>
          Run an Active Sprint
        </li>
      </ol>
    </section>
  )
}
