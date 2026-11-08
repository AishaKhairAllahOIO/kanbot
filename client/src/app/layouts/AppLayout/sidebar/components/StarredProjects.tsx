import { useId } from "react";
import { Star } from "lucide-react";
import { NavLink } from "react-router";
import { useCurrentProject } from "../../shared/hooks/useCurrentProject";
import { useStarredProjects } from "../hooks/useStarredProjects";
import { prefetchRoute } from "../../../../providers/router/routeModules";
import { CollapseButton } from "./CollapseButton";
import { useLayoutStore } from "../../shared/store/layoutStore";

export function StarredProjects() {
  const headingId = useId();
  const listId = useId();
  const { projects } = useCurrentProject();
  const { starredIds, toggleStar } = useStarredProjects();
  const open = useLayoutStore((state) => state.isStarredProjectsOpen);
  const toggleOpen = useLayoutStore((state) => state.toggleStarredProjects);
  const starredProjects = projects.filter((project) =>
    starredIds.includes(project.id),
  );

  return (
    <section
      aria-labelledby={headingId}
      className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1"
    >
      <div className="flex min-w-0 items-center gap-1">
        <h2 id={headingId} className="min-w-0 flex-1">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={open ? listId : undefined}
            onClick={toggleOpen}
            className="flex min-h-9 w-full min-w-0 items-center gap-2 rounded-sm px-3 text-start text-caption font-medium uppercase tracking-wide text-subtle transition-colors hover:bg-sunken hover:text-ink"
          >
            <Star aria-hidden="true" className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">Starred</span>
            <span>{starredProjects.length}</span>
          </button>
        </h2>
        <CollapseButton
          open={open}
          onToggle={toggleOpen}
          controls={listId}
          label="starred projects"
        />
      </div>
      {open && (
        <div id={listId} className="grid min-w-0 gap-1">
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
        </div>
      )}
    </section>
  );
}
