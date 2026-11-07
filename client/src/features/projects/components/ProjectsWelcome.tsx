import { useEffect, useState } from 'react'

const STEPS = [
  'Choose a project',
  'Plan in Backlog',
  'Track work on the Board',
  'Review Sprints history',
]

const STEP_DURATION = 1800 // ms بين كل خطوة والتانية

export function ProjectsWelcome() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    // إذا المستخدم مفعّل "تقليل الحركة" منوقف الأنيميشن
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const id = setInterval(() => {
      setActive((current) => (current + 1) % STEPS.length)
    }, STEP_DURATION)

    return () => clearInterval(id)
  }, [])

  return (
    <section className="page-gutter pb-6 pt-6 text-center">
      <h2 className="font-heading text-title font-semibold text-ink">Pick a project to get started</h2>
      <p className="mt-1 text-small text-muted">
        Backlog, Board and Sprints open as soon as you choose a project.
      </p>

      <ol
        aria-label="Getting started"
        className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-3 text-small"
      >
        {STEPS.map((label, i) => {
          const isDone = i < active
          const isActive = i === active

          return (
            <li key={label} className="contents">
              <div
                aria-current={isActive ? 'step' : undefined}
                className={`group inline-flex items-center gap-2 transition-colors duration-500 ${
                  isActive ? 'font-medium text-ink' : isDone ? 'text-ink' : 'text-muted'
                }`}
              >
                <span className="relative grid size-6 place-content-center">
                  {/* حلقة النبض حوالين الخطوة الحالية */}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-brand/40 animate-ping motion-reduce:animate-none"
                    />
                  )}
                  <span
                    className={`relative grid size-6 place-content-center rounded-full border text-caption font-semibold transition-all duration-500 ${
                      isActive
                        ? 'scale-110 border-brand bg-brand text-on-brand'
                        : isDone
                          ? 'border-brand bg-brand text-on-brand'
                          : 'border-line-strong bg-surface text-muted'
                    }`}
                  >
                    {isDone ? (
                      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3.5 8.5l3 3 6-7" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </span>
                </span>
                {label}
              </div>

              {/* الخط بين الخطوات */}
              {i < STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className="relative hidden h-0.5 w-12 overflow-hidden rounded-full bg-line-strong sm:block"
                >
                  <div
                    className={`absolute inset-0 origin-left rounded-full bg-brand transition-transform ease-out ${
                      isDone ? 'scale-x-100 duration-700' : 'scale-x-0 duration-300'
                    }`}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}