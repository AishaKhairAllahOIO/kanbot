import { useMemo, useState } from "react";
import { CircleAlert } from "lucide-react";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/EmptyState";
import { Modal } from "@/shared/components/Modal";
import { Spinner } from "@/shared/components/Spinner";
import type { ShortcutItem } from "../utils/shortcuts.registry";
import { PALETTE_GROUPS } from "../utils/shortcuts.registry";
import { KeyHints } from "./KeyHints";

interface PaletteItem {
  id: string;
  label: string;
  group: ShortcutItem["paletteGroup"];
  keys?: string[];
  keywords?: string[];
}

function highlightMatch(label: string, query: string) {
  const start = label.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
  if (!query || start < 0) return label;
  return (
    <>
      {label.slice(0, start)}
      <mark className="rounded-xs bg-brand-soft text-brand-ink">
        {label.slice(start, start + query.length)}
      </mark>
      {label.slice(start + query.length)}
    </>
  );
}

export function CommandPalette({
  open,
  onOpenChange,
  registry,
  projects,
  todos,
  recentIds,
  onSelect,
  dataLoading = false,
  dataError,
  onRetryData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registry: ShortcutItem[];
  projects: Array<{ id: string; name: string; key: string }>;
  todos: Array<{ id: string; key: string; title: string }>;
  recentIds: string[];
  onSelect: (id: string) => void;
  dataLoading?: boolean;
  dataError?: string;
  onRetryData?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const staticItems: PaletteItem[] = registry
    .filter((item) => item.enabled)
    .map(({ id, label, keys, keywords, paletteGroup }) => ({
      id,
      label,
      keys,
      keywords,
      group: paletteGroup,
    }));
  const projectItems: PaletteItem[] = projects.map((project) => ({
    id: `project:${project.id}`,
    label: `${project.name}  ${project.key}`,
    group: "Projects",
    keywords: [project.name, project.key],
  }));
  const todoItems: PaletteItem[] = todos.map((todo) => ({
    id: `todo:${todo.id}`,
    label: `${todo.key}  ${todo.title}`,
    group: "Todos",
    keywords: [todo.key, todo.title],
  }));

  const groups = useMemo(() => {
    const allItems = [...staticItems, ...projectItems, ...todoItems];
    const matches = (item: PaletteItem) =>
      `${item.label} ${item.keywords?.join(" ") ?? ""}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase());
    return PALETTE_GROUPS.map((group) => ({
      group,
      items: allItems
        .filter((item) => item.group === group && matches(item))
        .slice(0, 5),
    })).filter(({ items }) => items.length > 0);
  }, [staticItems, projectItems, todoItems, query]);
  const visibleItems = groups.flatMap(({ items }) => items);
  const recentItems = !query
    ? recentIds
        .map((id) =>
          [...staticItems, ...projectItems, ...todoItems].find(
            (item) => item.id === id,
          ),
        )
        .filter((item): item is PaletteItem => item !== undefined)
        .slice(0, 5)
    : [];

  function runItem(item: PaletteItem) {
    setQuery("");
    setActiveIndex(0);
    onOpenChange(false);
    onSelect(item.id);
  }

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setQuery("");
          setActiveIndex(0);
        }
      }}
      title="Command palette"
      description="Search pages, projects, todos, and actions."
      size="wide"
    >
      <div className="grid gap-4">
        <input
          autoFocus
          type="search"
          role="combobox"
          aria-label="Search commands"
          aria-expanded={visibleItems.length > 0}
          aria-controls="command-palette-list"
          aria-activedescendant={
            visibleItems[activeIndex]
              ? `command-${visibleItems[activeIndex].id}`
              : undefined
          }
          value={query}
          onChange={(event) => {
            setQuery(event.currentTarget.value);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) =>
                Math.min(index + 1, visibleItems.length - 1),
              );
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter" && visibleItems[activeIndex]) {
              event.preventDefault();
              runItem(visibleItems[activeIndex]);
            }
          }}
          placeholder="Search…"
          className="h-10 w-full rounded-sm  border-line bg-surface ps-9 pe-3 text-body text-ink placeholder:text-subtle"
        />
        {dataLoading && (
          <div className="py-3" role="status" aria-label="Loading project items">
            <Spinner label="Loading project items" />
          </div>
        )}
        {dataError && (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-sm border border-danger/30 bg-danger/10 p-3 text-small text-ink"
          >
            <CircleAlert
              aria-hidden="true"
              className="size-5 shrink-0 text-danger"
            />
            <p className="min-w-0 flex-1">{dataError}</p>
            {onRetryData && (
              <Button size="sm" onClick={onRetryData}>
                Try again
              </Button>
            )}
          </div>
        )}
        <div
          id="command-palette-list"
          role="listbox"
          className="max-h-[55dvh] overflow-y-auto"
        >
          {!query && recentItems.length > 0 && (
            <section className="mb-3 grid gap-1">
              <h2 className="px-2 text-caption font-semibold text-muted">
                Recent
              </h2>
              {recentItems.map((item) => (
                <PaletteOption
                  key={`recent-${item.id}`}
                  item={item}
                  query={query}
                  onRun={() => runItem(item)}
                />
              ))}
            </section>
          )}
          {groups.map(({ group, items }) => (
            <section key={group} className="mb-3 grid gap-1">
              <h2 className="px-2 text-caption font-semibold text-muted">
                {group}
              </h2>
              {items.map((item) => (
                <PaletteOption
                  key={item.id}
                  item={item}
                  query={query}
                  active={visibleItems[activeIndex]?.id === item.id}
                  onRun={() => runItem(item)}
                />
              ))}
            </section>
          ))}
          {visibleItems.length === 0 && !dataLoading && !dataError && (
            <EmptyState
              title="No matching commands"
              description="Try a different search or clear the search field."
            />
          )}
        </div>
      </div>
    </Modal>
  );
}

function PaletteOption({
  item,
  query,
  active = false,
  onRun,
}: {
  item: PaletteItem;
  query: string;
  active?: boolean;
  onRun: () => void;
}) {
  return (
    <button
      id={`command-${item.id}`}
      type="button"
      role="option"
      aria-selected={active}
      onClick={onRun}
      className={`flex min-h-10 w-full items-center gap-3 rounded-sm px-2 text-start text-small ${
        active ? "bg-brand-soft text-brand-ink" : "text-ink hover:bg-sunken"
      }`}
    >
      <span className="min-w-0 flex-1 truncate">
        {highlightMatch(item.label, query)}
      </span>
      <KeyHints keys={item.keys} />
    </button>
  );
}
