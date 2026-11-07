import { Lock } from "lucide-react";
import { NavLink, useParams } from "react-router";
import { StarredProjectsMenu } from "../desktop/sidebar/components/StarredProjectsMenu";
import {
  PROJECTS_NAV_ITEM,
  useProjectNavItems,
} from "../shared/hooks/useProjectNavItems";
import { prefetchRoute } from "../../../providers/router/routeModules";
import { DailyFocusButton } from "../desktop/sidebar/components/DailyFocusButton";

const ITEM =
  "relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-nav font-medium transition-colors";

export function BottomNav() {
  const { projectId } = useParams();
  const projectItems = useProjectNavItems(projectId);
  const items = [PROJECTS_NAV_ITEM, ...projectItems];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-sticky box-content h-[var(--bottom-nav-h)] items-stretch border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden flex"
    >
      {items.map((item) => {
        const Icon = item.icon;

        if (!item.enabled) {
          return (
            <button
              key={item.label}
              type="button"
              aria-disabled="true"
              aria-describedby="select-project-hint"
              className={`${ITEM} cursor-not-allowed text-muted opacity-70`}
            >
              <Icon aria-hidden="true" className="size-5 shrink-0" />
              <span>{item.label}</span>
              <Lock
                aria-hidden="true"
                className="absolute right-[calc(50%-1.5rem)] top-2 size-3"
              />
            </button>
          );
        }

        return (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            onPointerEnter={() => prefetchRoute(item.to)}
            onFocus={() => prefetchRoute(item.to)}
            className={({ isActive }) =>
              `${ITEM} ${isActive ? "text-brand-ink" : "text-muted hover:text-ink"}`
            }
          >
            <Icon aria-hidden="true" className="size-5 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
      <StarredProjectsMenu
        side="top"
        showLabel
        className={`${ITEM} text-muted hover:text-ink`}
      />
      <DailyFocusButton
        showLabel
        className={`${ITEM} text-muted hover:text-ink`}
      />
      {items.some((item) => !item.enabled) && (
        <span id="select-project-hint" className="sr-only">
          Select a project first to open project pages.
        </span>
      )}
    </nav>
  );
}
