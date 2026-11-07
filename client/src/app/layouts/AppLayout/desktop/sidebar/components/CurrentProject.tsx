import { useId } from "react";
import { FolderKanban, Star } from "lucide-react";
import { useParams } from "react-router";
import { useCurrentProject } from "../../../shared/hooks/useCurrentProject";
import { useProjectNavItems } from "../../../shared/hooks/useProjectNavItems";
import { useStarredProjects } from "../hooks/useStarredProjects";
import { CollapseButton } from "./CollapseButton";
import { SidebarNavItem } from "./SidebarNavItem";
import { useLayoutStore } from "../../../store/layoutStore";

export function CurrentProject() {
  const headingId = useId();
  const listId = useId();
  const { projectId } = useParams();
  const { project } = useCurrentProject();
  const { isStarred, toggleStar } = useStarredProjects();
  const items = useProjectNavItems(projectId);
  const open = useLayoutStore((state) => state.isCurrentProjectOpen);
  const toggleOpen = useLayoutStore((state) => state.toggleCurrentProject);

  const starred = project ? isStarred(project.id) : false;
  const name = project ? ` ${project.name}` : "No project selected";

  return (
    <section
      aria-labelledby={headingId}
      className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1"
    >
      <h2
        id={headingId}
        className="px-3 pb-1 text-caption font-medium uppercase tracking-wide text-subtle"
      >
        Current project
      </h2>
      <div className="flex min-w-0 items-center gap-1">
        <div className="ms-[var(--sidebar-section-indent)] flex min-h-10 min-w-0 flex-1 items-center gap-3 rounded-sm px-3">
          {project ? (
            <button
              type="button"
              aria-pressed={starred}
              aria-label={starred ? "Unstar project" : "Star project"}
              onClick={() => toggleStar(project.id)}
              className="-m-2 grid size-8 shrink-0 place-content-center rounded-sm hover:bg-sunken"
            >
              <Star
                aria-hidden="true"
                className={`size-4 ${starred ? "fill-star text-star" : "text-muted hover:text-star"}`}
              />
            </button>
          ) : (
            <FolderKanban
              aria-hidden="true"
              className="size-4 shrink-0 text-muted"
            />
          )}
          <span
            title={name}
            className={`min-w-0 truncate text-body font-semibold ${project ? "text-ink" : "text-muted"}`}
          >
            {name}
          </span>
        </div>
        <CollapseButton
          open={open}
          onToggle={toggleOpen}
          controls={listId}
          label="project pages"
        />
      </div>
      {open && (
        <nav
          id={listId}
          aria-label="Project navigation"
          className="ms-[var(--sidebar-section-indent)] grid min-w-0 gap-1"
        >
          {items.map((item) => (
            <SidebarNavItem key={item.label} item={item} />
          ))}
          {!projectId && (
            <span id="sidebar-select-project-hint" className="px-3 text-caption text-muted">
              Select a project first to open project pages.
            </span>
          )}
        </nav>
      )}
    </section>
  );
}
