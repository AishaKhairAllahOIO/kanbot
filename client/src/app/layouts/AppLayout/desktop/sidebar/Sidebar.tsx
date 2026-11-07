import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ChevronDown, ChevronUp, LogOut } from "lucide-react";
import { LogoutConfirmationDialog } from "@/features/auth/components/LogoutConfirmationDialog";
import { AllProjects } from "./components/AllProjects";
import { CurrentProject } from "./components/CurrentProject";
import { DailyQuote } from "./components/DailyQuote";
import { StarredProjects } from "./components/StarredProjects";

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);

  const updateScrollCue = useCallback(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const hasPreviousContent = scrollContainer.scrollTop > 8;
    const hasMoreContent =
      scrollContainer.scrollHeight >
      scrollContainer.clientHeight + scrollContainer.scrollTop + 8;
    setCanScrollUp((current) =>
      current === hasPreviousContent ? current : hasPreviousContent,
    );
    setCanScrollDown((current) =>
      current === hasMoreContent ? current : hasMoreContent,
    );
  }, []);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const scrollContent = scrollContentRef.current;
    if (!scrollContainer || !scrollContent) return;

    const resizeObserver = new ResizeObserver(updateScrollCue);
    resizeObserver.observe(scrollContainer);
    resizeObserver.observe(scrollContent);
    const frame = requestAnimationFrame(updateScrollCue);
    scrollContainer.addEventListener("scroll", updateScrollCue, {
      passive: true,
    });

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      scrollContainer.removeEventListener("scroll", updateScrollCue);
    };
  }, [updateScrollCue]);

  function handleSidebarKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (
      event.target instanceof HTMLElement &&
      event.target.closest(
        'button, [role="button"], input, select, textarea, [contenteditable="true"]',
      )
    ) {
      return;
    }

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let top: number;
    switch (event.key) {
      case "ArrowDown":
        top = 48;
        break;
      case "ArrowUp":
        top = -48;
        break;
      case "PageDown":
        top = scrollContainer.clientHeight * 0.8;
        break;
      case "PageUp":
        top = -scrollContainer.clientHeight * 0.8;
        break;
      case "Home":
        event.preventDefault();
        scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
        return;
      case "End":
        event.preventDefault();
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth",
        });
        return;
      default:
        return;
    }

    event.preventDefault();
    scrollContainer.scrollBy({ top, behavior: "smooth" });
  }

  return (
    <>
      <aside
        id="kanbot-sidebar"
        aria-label="Main sidebar"
        data-collapsed={collapsed}
        className="app-sidebar hidden min-h-0 shrink-0 flex-col overflow-hidden border-e border-line bg-surface transition-[width] duration-300 ease-[var(--ease)] xl:flex xl:h-full xl:w-[var(--sidebar-current)]"
      >
        <div className="relative min-h-0 flex-1">
          <div
            ref={scrollContainerRef}
            role="region"
            aria-label="Sidebar projects and navigation"
            tabIndex={0}
            onKeyDown={handleSidebarKeyDown}
            className="sidebar-content-scroll absolute inset-0 flex flex-col gap-5 overflow-x-hidden overflow-y-hidden p-3 focus-visible:outline-none"
          >
            <div ref={scrollContentRef} className="flex flex-col gap-5">
              <AllProjects />
              <CurrentProject />
              <StarredProjects />
            </div>
          </div>
          {canScrollUp && (
            <div className="pointer-events-none absolute inset-x-0 top-0 flex h-12 justify-center">
              <div
                aria-hidden="true"
                className="sidebar-scroll-cue-blur-top absolute inset-0"
              />
              <button
                type="button"
                aria-label="Scroll sidebar up"
                onClick={() =>
                  scrollContainerRef.current?.scrollBy({
                    top: -180,
                    behavior: "smooth",
                  })
                }
                className="pointer-events-auto relative mt-1 grid size-8 place-content-center rounded-full border border-line bg-surface/90 text-muted shadow-sm transition-colors hover:bg-sunken hover:text-ink"
              >
                <ChevronUp aria-hidden="true" className="size-4" />
              </button>
            </div>
          )}
          {canScrollDown && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-12 items-end justify-center">
              <div
                aria-hidden="true"
                className="sidebar-scroll-cue-blur-bottom absolute inset-0"
              />
              <button
                type="button"
                aria-label="Scroll sidebar down"
                onClick={() =>
                  scrollContainerRef.current?.scrollBy({
                    top: 180,
                    behavior: "smooth",
                  })
                }
                className="pointer-events-auto relative mb-1 grid size-8 place-content-center rounded-full border border-line bg-surface/90 text-muted shadow-sm transition-colors hover:bg-sunken hover:text-ink"
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
      <LogoutConfirmationDialog
        open={confirmLogout}
        onOpenChange={setConfirmLogout}
      />
    </>
  );
}
