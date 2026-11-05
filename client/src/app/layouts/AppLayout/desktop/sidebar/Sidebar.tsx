import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, LogOut } from "lucide-react";
import { LogoutConfirmationDialog } from "@/features/profile/components/LogoutConfirmationDialog";
import { AllProjects } from "./components/AllProjects";
import { CurrentProject } from "./components/CurrentProject";
import { DailyQuote } from "./components/DailyQuote";
import { StarredProjects } from "./components/StarredProjects";

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollContentRef = useRef<HTMLDivElement>(null)

  const updateScrollCue = useCallback(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return
    const hasPreviousContent = scrollContainer.scrollTop > 8
    const hasMoreContent = scrollContainer.scrollHeight
      > scrollContainer.clientHeight + scrollContainer.scrollTop + 8
    setCanScrollUp((current) => current === hasPreviousContent ? current : hasPreviousContent)
    setCanScrollDown((current) => current === hasMoreContent ? current : hasMoreContent)
  }, [])

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    const scrollContent = scrollContentRef.current
    if (!scrollContainer || !scrollContent) return

    const resizeObserver = new ResizeObserver(updateScrollCue)
    resizeObserver.observe(scrollContainer)
    resizeObserver.observe(scrollContent)
    const frame = requestAnimationFrame(updateScrollCue)
    scrollContainer.addEventListener("scroll", updateScrollCue, { passive: true })

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      scrollContainer.removeEventListener("scroll", updateScrollCue)
    }
  }, [updateScrollCue])

  return (
    <>
      <aside
        id="kanbot-sidebar"
        aria-label="Main sidebar"
        data-collapsed={collapsed}
        className="app-sidebar hidden min-h-0 shrink-0 flex-col overflow-hidden border-e border-line bg-surface transition-[width] duration-300 ease-[var(--ease)] md:flex md:h-full md:w-[var(--sidebar-current)]"
      >
        <div className="relative min-h-0 flex-1">
          <div
            ref={scrollContainerRef}
            onScroll={updateScrollCue}
            className="sidebar-content-scroll absolute inset-0 flex flex-col gap-5 overflow-y-auto overflow-x-hidden p-3"
          >
            <div ref={scrollContentRef} className="flex flex-col gap-5">
              <AllProjects />
              <CurrentProject />
              <StarredProjects />
            </div>
          </div>
          {canScrollUp && (
            <div className="pointer-events-none absolute inset-x-0 top-0 flex h-12 items-start justify-center bg-gradient-to-b from-surface via-surface/90 to-transparent pt-1 backdrop-blur-[2px]">
              <button
                type="button"
                aria-label="Scroll sidebar up"
                onClick={() => scrollContainerRef.current?.scrollBy({ top: -180, behavior: "smooth" })}
                className="pointer-events-auto grid size-8 place-content-center rounded-full border border-line bg-surface text-muted shadow-sm transition-colors hover:bg-sunken hover:text-ink"
              >
                <ChevronUp aria-hidden="true" className="size-4" />
              </button>
            </div>
          )}
          {canScrollDown && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 flex h-12 items-end justify-center bg-gradient-to-t from-surface via-surface/90 to-transparent pb-1 backdrop-blur-[2px]"
            >
              <button
                type="button"
                aria-label="Scroll sidebar down"
                onClick={() => scrollContainerRef.current?.scrollBy({ top: 180, behavior: "smooth" })}
                className="pointer-events-auto grid size-8 place-content-center rounded-full border border-line bg-surface text-muted shadow-sm transition-colors hover:bg-sunken hover:text-ink"
              >
                <ChevronDown aria-hidden="true" className="size-4" />
              </button>
            </div>
          )}
        </div>

        <div className="shrink-0 space-y-2 p-3">
          <DailyQuote />
          <div className="border-t border-line pt-2">
            <button
              type="button"
              onClick={() => setConfirmLogout(true)}
              className="flex min-h-10 w-full items-center gap-2 rounded-sm px-3 text-small font-medium text-danger transition-colors hover:bg-danger/10"
            >
              <LogOut aria-hidden="true" className="size-4" />
              Log out
            </button>
          </div>
        </div>
      </aside>
      <LogoutConfirmationDialog open={confirmLogout} onOpenChange={setConfirmLogout} />
    </>
  )
}
