import { useId } from "react";
import { Star } from "lucide-react";
import { NavLink } from "react-router";
import { useCurrentProject } from "../../../shared/hooks/useCurrentProject";
import { useStarredProjects } from "../hooks/useStarredProjects";
import { prefetchRoute } from "../../../../../providers/router/routeModules";

/** Starred projects for quick switching. Always visible; shows a hint when empty. */
export function StarredProjects() {
  const headingId = useId();
  const { projects } = useCurrentProject();
  const { starredIds, toggleStar } = useStarredProjects();
  const starredProjects = projects.filter((project) =>
    starredIds.includes(project.id),
  );

  return (
    <section
      aria-labelledby={headingId}
      className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1"
    >
      <h2
        id={headingId}
        className="flex items-center justify-between px-3 pb-1 text-caption font-medium uppercase tracking-wide text-subtle"
      >
        <span>Starred</span>
        <span>{starredProjects.length}</span>
      </h2>
      {starredProjects.length === 0 ? (
        <p className="ms-[var(--sidebar-section-indent)] px-3 py-2 text-caption leading-relaxed text-muted">
          Star a project to pin it here.
        </p>
      ) : (
        starredProjects.map((project) => (
          <div
            key={project.id}
            className="ms-[var(--sidebar-section-indent)] flex min-h-10 min-w-0 items-center gap-3 rounded-sm px-3 transition-colors hover:bg-sunken"
          >
            <button
              type="button"
              aria-label={`Unstar ${project.name}`}
              onClick={() => toggleStar(project.id)}
              className="-m-2 grid size-8 shrink-0 place-content-center rounded-sm"
            >
              <Star
                aria-hidden="true"
                className="size-4 fill-star text-star"
              />
            </button>
            <NavLink
              to={`/projects/${project.id}/backlog`}
              onPointerEnter={() => prefetchRoute(`/projects/${project.id}/backlog`)}
              onFocus={() => prefetchRoute(`/projects/${project.id}/backlog`)}
              className="flex min-h-10 min-w-0 flex-1 items-center text-body text-muted hover:text-ink"
            >
              <span className="truncate">{project.name}</span>
            </NavLink>
          </div>
        ))
      )}
    </section>
  );
}
