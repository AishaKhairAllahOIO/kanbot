import { useEffect, useRef } from "react";
import type { ShortcutItem } from "../utils/shortcuts.registry";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [role="textbox"]',
    ),
  );
}

export function useAppHotkeys(registry: ShortcutItem[]) {
  const registryRef = useRef(registry);

  useEffect(() => {
    registryRef.current = registry;
  }, [registry]);

  useEffect(() => {
    let sequenceTimeout: number | undefined;
    let sequencePrefix: string | undefined;

    function resetSequence() {
      sequencePrefix = undefined;
      if (sequenceTimeout !== undefined) window.clearTimeout(sequenceTimeout);
      sequenceTimeout = undefined;
    }

    function run(item: ShortcutItem | undefined) {
      if (item?.enabled) item.run();
    }

    function handleKeyDown(event: KeyboardEvent) {
      const currentRegistry = registryRef.current;
      const modifierShortcut = currentRegistry.find(
        (item) =>
          item.keys?.length === 2 &&
          item.keys[0].toLowerCase() === "ctrl" &&
          (event.ctrlKey || event.metaKey) &&
          item.keys[1].toLowerCase() === event.key.toLowerCase(),
      );
      if (modifierShortcut) {
        event.preventDefault();
        resetSequence();
        run(modifierShortcut);
        return;
      }

      if (
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        event.isComposing ||
        isEditableTarget(event.target)
      ) {
        resetSequence();
        return;
      }

      const pressedKey =
        event.key === "?" || (event.code === "Slash" && event.shiftKey)
          ? "?"
          : event.key;

      if (sequencePrefix !== undefined) {
        const prefix = sequencePrefix;
        resetSequence();
        const sequenceShortcut = currentRegistry.find(
          (item) =>
            item.keys?.length === 2 &&
            item.keys[0] === prefix &&
            item.keys[1].toLowerCase() === pressedKey.toLowerCase(),
        );
        if (!sequenceShortcut) return;
        event.preventDefault();
        run(sequenceShortcut);
        return;
      }

      const sequence = currentRegistry.find(
        (item) =>
          item.keys?.length === 2 &&
          item.keys[0].toLowerCase() !== "ctrl" &&
          item.keys[0] === pressedKey,
      );
      if (sequence) {
        sequencePrefix = sequence.keys?.[0];
        sequenceTimeout = window.setTimeout(resetSequence, 1000);
        return;
      }

      const shortcut = currentRegistry.find(
        (item) =>
          item.keys?.length === 1 &&
          (item.keys[0] === "c"
            ? item.keys[0] === pressedKey.toLowerCase()
            : item.keys[0] === pressedKey),
      );
      if (!shortcut) return;
      if (
        shortcut.id === "focus-search" &&
        !document.querySelector("[data-shortcut-search]")
      )
        return;
      event.preventDefault();
      run(shortcut);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      resetSequence();
    };
  }, []);
}
