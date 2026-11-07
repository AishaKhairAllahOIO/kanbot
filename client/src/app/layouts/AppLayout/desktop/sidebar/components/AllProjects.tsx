import { useId, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AlertCircle, FolderKanban, MoreVertical, Pencil, Star, Trash2 } from "lucide-react";
import { Link, NavLink, useParams } from "react-router";
import { paths } from "@/shared/config/paths";
import { useStarredProjects } from "../hooks/useStarredProjects";
import { useProjectActions } from "@/features/projects/hooks/useProjectActions";
import { useCurrentProject } from "../../../shared/hooks/useCurrentProject";
import { CollapseButton } from "./CollapseButton";
import { prefetchRoute } from "../../../../../providers/router/routeModules";
import { useLayoutStore } from "../../../store/layoutStore";
import { ProjectReminderToggle } from "@/features/notifications/components/ProjectReminderToggle";

export function AllProjects() {
  const listId = useId();
  const { projectId } = useParams();
  const { projects, projectsLoading, projectsError, retryProjects } = useCurrentProject();
  const { isStarred, toggleStar } = useStarredProjects();
  const projectActions = useProjectActions();
  const open = useLayoutStore((state) => state.isAllProjectsOpen);
  const toggleOpen = useLayoutStore((state) => state.toggleAllProjects);
  const [menuOpenProjectId, setMenuOpenProjectId] = useState<string | null>(null);

  return (
    <section
      aria-label="All projects"
      className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1"
    >
      <div className="flex min-w-0 items-center gap-1">
        <NavLink
          to={paths.projects}
          end
          className={({ isActive }) =>
            `flex min-h-10 min-w-0 flex-1 items-center gap-3 rounded-sm px-3 text-body font-medium transition-colors ${
              isActive
                ? "bg-brand-soft text-brand-ink"
                : "text-muted hover:bg-sunken hover:text-ink"
            }`
          }
        >
          <FolderKanban aria-hidden="true" className="size-4 shrink-0" />
          <span className="truncate">All projects</span>
        </NavLink>
        <CollapseButton
          open={open}
          onToggle={toggleOpen}
          controls={listId}
          label="project list"
        />
      </div>

      {open && (
        <ul id={listId} className="ms-[var(--sidebar-section-indent)] grid min-w-0 gap-1">
          {projects.map((project) => {
            const active = project.id === projectId;
            const starred = isStarred(project.id);
            return (
              <li key={project.id} className="group min-w-0">
                <div className="flex min-h-9 min-w-0 items-center gap-1 rounded-sm transition-colors hover:bg-sunken">
                  <Link
                    to={`/projects/${project.id}/backlog`}
                    onPointerEnter={() => prefetchRoute(`/projects/${project.id}/backlog`)}
                    onFocus={() => prefetchRoute(`/projects/${project.id}/backlog`)}
                    aria-current={active ? "page" : undefined}
                    title={`${project.key} · ${project.name}`}
                    className={`flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded-sm px-3 text-small transition-colors ${
                      active
                        ? "font-semibold text-brand-ink"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">{project.name}</span>
                    <span className={`shrink-0 font-mono text-key text-subtle group-hover:hidden ${menuOpenProjectId === project.id ? "hidden" : ""}`}>
                      {project.key}
                    </span>
                  </Link>
                  <ProjectReminderToggle
                    projectId={project.id}
                    projectName={project.name}
                    compact
                  />
                  <DropdownMenu.Root
                    open={menuOpenProjectId === project.id}
                    onOpenChange={(open) => setMenuOpenProjectId(open ? project.id : null)}
                  >
                    <DropdownMenu.Trigger asChild>
                      <button
                        type="button"
                        aria-label={`Options for ${project.name}`}
                        onClick={(event) => event.stopPropagation()}
                        className="grid size-8 shrink-0 place-content-center rounded-sm text-muted opacity-100 outline-none transition-opacity hover:bg-sunken hover:text-ink focus:opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100 md:data-[state=open]:opacity-100"
                      >
                        <MoreVertical aria-hidden="true" className="size-4" />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        align="end"
                        sideOffset={4}
                        className="z-popover rounded-md border border-line bg-raised p-1 shadow-pop"
                      >
                        <DropdownMenu.Item
                          className="menu-item"
                          onSelect={() => toggleStar(project.id)}
                        >
                          <Star aria-hidden="true" className={`size-4 ${starred ? "fill-star text-star" : ""}`} />
                          {starred ? "Unstar" : "Star"}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          className="menu-item"
                          onSelect={() => projectActions.openEdit(project)}
                        >
                          <Pencil aria-hidden="true" className="size-4" />
                          Edit
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          className="menu-item text-danger"
                          onSelect={() => projectActions.openDelete(project)}
                        >
                          <Trash2 aria-hidden="true" className="size-4" />
                          Delete
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              </li>
            );
          })}
          {projectsLoading && (
            <li className="px-3 py-2 text-caption text-muted" role="status">
              Loading projects…
            </li>
          )}
          {!projectsLoading && projects.length === 0 && !projectsError && (
            <li className="flex items-center gap-2 px-3 py-2 text-caption text-muted">
              <FolderKanban aria-hidden="true" className="size-4 shrink-0" />
              <span>No projects yet. Create one to get started.</span>
            </li>
          )}
          {projectsError && (
            <li className="grid gap-2 px-3 py-2 text-caption text-danger" role="alert">
              <span className="flex items-center gap-2">
                <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
                Projects could not be loaded.
              </span>
              <button type="button" className="w-fit font-medium text-brand-ink underline" onClick={() => void retryProjects()}>
                Try again
              </button>
            </li>
          )}
        </ul>
      )}
      {projectActions.dialogs}
    </section>
  );
}
