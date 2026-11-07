import { Modal } from "@/shared/components/Modal";
import type { ShortcutItem } from "../utils/shortcuts.registry";
import { SHORTCUT_HELP_GROUPS } from "../utils/shortcuts.registry";
import { KeyHints } from "./KeyHints";

export function ShortcutsHelpDialog({
  open,
  onOpenChange,
  registry,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registry: ShortcutItem[];
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Keyboard shortcuts"
      size="wide"
    >
      <div className="grid gap-5">
        {SHORTCUT_HELP_GROUPS.map((group) => {
          const items = registry.filter(
            (item) => item.helpGroup === group && item.enabled,
          );
          if (items.length === 0) return null;
          return (
            <section key={group} className="grid gap-2">
              <h2 className="text-small font-semibold text-muted">{group}</h2>
              <ul className="grid gap-1">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-sm px-2 py-2 text-body"
                  >
                    <span>{item.label}</span>
                    <KeyHints keys={item.displayKeys ?? item.keys} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </Modal>
  );
}
