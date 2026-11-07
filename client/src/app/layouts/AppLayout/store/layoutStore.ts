import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface AssistantPrompt {
  id: number
  projectId: string
  content: string
  todoReference?: { todoId: string; key: string }
}

export type AiPlanningTab = 'chat' | 'generate' | 'plan' | 'summarize'

interface LayoutState {
  isSidebarCollapsed: boolean
  isAllProjectsOpen: boolean
  isCurrentProjectOpen: boolean
  isPaletteOpen: boolean
  isShortcutsOpen: boolean
  aiPlanningTab: AiPlanningTab | null
  selectedHistorySprintId: string | null
  pendingAssistantPrompt: AssistantPrompt | null
  toggleSidebar: () => void
  toggleAllProjects: () => void
  toggleCurrentProject: () => void
  setPaletteOpen: (open: boolean) => void
  setShortcutsOpen: (open: boolean) => void
  setAiPlanningTab: (tab: AiPlanningTab | null) => void
  setSelectedHistorySprintId: (sprintId: string | null) => void
  requestAssistantPrompt: (
    projectId: string,
    content: string,
    todoReference?: { todoId: string; key: string },
  ) => void
  consumeAssistantPrompt: (id: number) => void
}

let promptSequence = 0

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      isSidebarCollapsed: false,
      isAllProjectsOpen: false,
      isCurrentProjectOpen: true,
      isPaletteOpen: false,
      isShortcutsOpen: false,
      aiPlanningTab: null,
      selectedHistorySprintId: null,
      pendingAssistantPrompt: null,
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      toggleAllProjects: () => set((state) => ({ isAllProjectsOpen: !state.isAllProjectsOpen })),
      toggleCurrentProject: () => set((state) => ({ isCurrentProjectOpen: !state.isCurrentProjectOpen })),
      setPaletteOpen: (isPaletteOpen) => set({ isPaletteOpen }),
      setShortcutsOpen: (isShortcutsOpen) => set({ isShortcutsOpen }),
      setAiPlanningTab: (aiPlanningTab) => set({ aiPlanningTab }),
      setSelectedHistorySprintId: (selectedHistorySprintId) => set({ selectedHistorySprintId }),
      requestAssistantPrompt: (projectId, content, todoReference) => {
        if (!projectId || !content.trim()) return
        promptSequence += 1
        set({
          pendingAssistantPrompt: { id: promptSequence, projectId, content, todoReference },
          aiPlanningTab: 'chat',
        })
      },
      consumeAssistantPrompt: (id) => set((state) => (
        state.pendingAssistantPrompt?.id === id ? { pendingAssistantPrompt: null } : state
      )),
    }),
    {
      name: 'kanbot:layout',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isSidebarCollapsed: state.isSidebarCollapsed,
        isAllProjectsOpen: state.isAllProjectsOpen,
        isCurrentProjectOpen: state.isCurrentProjectOpen,
      }),
    },
  ),
)