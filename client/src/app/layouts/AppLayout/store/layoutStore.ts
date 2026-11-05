import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface AssistantPrompt {
  id: number
  projectId: string
  content: string
}

interface LayoutState {
  isSidebarCollapsed: boolean
  isPaletteOpen: boolean
  isShortcutsOpen: boolean
  isAssistantOpen: boolean
  pendingAssistantPrompt: AssistantPrompt | null
  toggleSidebar: () => void
  setPaletteOpen: (open: boolean) => void
  setShortcutsOpen: (open: boolean) => void
  setAssistantOpen: (open: boolean) => void
  requestAssistantPrompt: (projectId: string, content: string) => void
  consumeAssistantPrompt: (id: number) => void
}

let promptSequence = 0

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      isSidebarCollapsed: false,
      isPaletteOpen: false,
      isShortcutsOpen: false,
      isAssistantOpen: false,
      pendingAssistantPrompt: null,
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setPaletteOpen: (isPaletteOpen) => set({ isPaletteOpen }),
      setShortcutsOpen: (isShortcutsOpen) => set({ isShortcutsOpen }),
      setAssistantOpen: (isAssistantOpen) => set({ isAssistantOpen }),
      requestAssistantPrompt: (projectId, content) => {
        if (!projectId || !content.trim()) return
        promptSequence += 1
        set({
          pendingAssistantPrompt: { id: promptSequence, projectId, content },
          isAssistantOpen: true,
        })
      },
      consumeAssistantPrompt: (id) => set((state) => (
        state.pendingAssistantPrompt?.id === id ? { pendingAssistantPrompt: null } : state
      )),
    }),
    {
      name: 'kanbot:layout',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ isSidebarCollapsed: state.isSidebarCollapsed }),
    },
  ),
)