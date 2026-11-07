import { Lock } from "lucide-react";
import { NavLink } from "react-router";
import type { NavigationItem } from "../../../shared/types/navigation-item";
import { prefetchRoute } from "../../../../../providers/router/routeModules";

const BASE =
  "flex min-h-10 items-center gap-3 rounded-sm px-3 text-body font-medium transition-colors";

export function SidebarNavItem({ item }: { item: NavigationItem }) {
  const Icon = item.icon;

  if (!item.enabled) {
    return (
      <button
        type="button"
        aria-disabled="true"
        aria-describedby="sidebar-select-project-hint"
        className={`${BASE} cursor-not-allowed text-muted`}
      >
        <Icon aria-hidden="true" className="size-4 shrink-0" />
        <span className="flex-1">{item.label}</span>
        <Lock aria-hidden="true" className="size-3.5 shrink-0" />
      </button>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onPointerEnter={() => prefetchRoute(item.to)}
      onFocus={() => prefetchRoute(item.to)}
      className={({ isActive }) =>
        `${BASE} ${isActive ? "bg-brand-soft text-brand-ink" : "text-muted hover:bg-sunken hover:text-ink"}`
      }
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  );
}
