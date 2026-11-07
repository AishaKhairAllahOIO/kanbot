import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface UiPreferencesState {
  collapsedSections: Record<string, boolean>
  toggleCollapsed: (key: string, defaultCollapsed?: boolean) => void
  setCollapsed: (key: string, collapsed: boolean) => void
}

export const useUiPreferencesStore = create<UiPreferencesState>()(
  persist(
    (set) => ({
      collapsedSections: {},
      toggleCollapsed: (key, defaultCollapsed = false) =>
        set((state) => ({
          collapsedSections: {
            ...state.collapsedSections,
            [key]: !(state.collapsedSections[key] ?? defaultCollapsed),
          },
        })),
      setCollapsed: (key, collapsed) =>
        set((state) => ({
          collapsedSections: {
            ...state.collapsedSections,
            [key]: collapsed,
          },
        })),
    }),
    {
      name: 'kanbot:ui-preferences',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ collapsedSections: state.collapsedSections }),
    },
  ),
)
