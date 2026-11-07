export const SHORTCUT_HELP_GROUPS = ['General', 'Todos', 'Go to'] as const
export type ShortcutHelpGroup = typeof SHORTCUT_HELP_GROUPS[number]
export const PALETTE_GROUPS = ['Actions', 'Pages', 'Projects', 'Todos', 'AI'] as const
export type PaletteGroup = typeof PALETTE_GROUPS[number]

export interface ShortcutItem {
  id: string
  label: string
  keys?: string[]
  displayKeys?: string[]
  helpGroup?: ShortcutHelpGroup
  paletteGroup: PaletteGroup
  keywords?: string[]
  enabled: boolean
  run: () => void
}

export interface ShortcutActions {
  togglePalette: () => void
  openHelp: () => void
  createTodo: () => void
  focusSearch: () => void
  goToBoard: () => void
  goToBacklog: () => void
  goToSprints: () => void
  openProjects: () => void
  createSprint: () => void
  startSprint: () => void
  completeSprint: () => void
  toggleTheme: () => void
  openAssistant: () => void
  generateTodos: () => void
  planSprint: () => void
  summarizeSprint: () => void
}

export function createShortcutRegistry(
  actions: ShortcutActions,
  context: {
    hasProject: boolean
    hasPlannedSprint: boolean
    hasActiveSprint: boolean
    isBacklogPage: boolean
    isBoardPage: boolean
  },
): ShortcutItem[] {
  return [
    {
      id: 'command-palette',
      label: 'Command palette',
      keys: ['Ctrl', 'K'],
      helpGroup: 'General',
      paletteGroup: 'Actions',
      enabled: true,
      run: actions.togglePalette,
    },
    {
      id: 'shortcuts-help',
      label: 'Keyboard shortcuts',
      keys: ['Shift', '?'],
      displayKeys: ['Shift', '?'],
      helpGroup: 'General',
      paletteGroup: 'Actions',
      enabled: true,
      run: actions.openHelp,
    },
    {
      id: 'create-todo',
      label: 'Create todo',
      keys: ['c'],
      helpGroup: 'Todos',
      paletteGroup: 'Actions',
      enabled: context.hasProject,
      run: actions.createTodo,
    },
    {
      id: 'focus-search',
      label: 'Focus search',
      keys: ['/'],
      helpGroup: 'Todos',
      paletteGroup: 'Actions',
      enabled: true,
      run: actions.focusSearch,
    },
    {
      id: 'go-board',
      label: 'Go to board',
      keys: ['g', 'b'],
      helpGroup: 'Go to',
      paletteGroup: 'Pages',
      enabled: context.hasProject,
      run: actions.goToBoard,
    },
    {
      id: 'go-backlog',
      label: 'Go to backlog',
      keys: ['g', 'l'],
      helpGroup: 'Go to',
      paletteGroup: 'Pages',
      enabled: context.hasProject,
      run: actions.goToBacklog,
    },
    {
      id: 'go-sprints',
      label: 'Go to sprints',
      keys: ['g', 's'],
      helpGroup: 'Go to',
      paletteGroup: 'Pages',
      enabled: context.hasProject,
      run: actions.goToSprints,
    },
    {
      id: 'projects-page',
      label: 'Projects',
      paletteGroup: 'Pages',
      keywords: ['home', 'projects'],
      enabled: true,
      run: actions.openProjects,
    },
    {
      id: 'create-sprint',
      label: 'Create sprint',
      paletteGroup: 'Actions',
      keywords: ['new sprint'],
      enabled: context.hasProject,
      run: actions.createSprint,
    },
    {
      id: 'start-sprint',
      label: 'Start planned sprint',
      paletteGroup: 'Actions',
      keywords: ['start sprint'],
      enabled: context.hasProject && context.hasPlannedSprint && !context.hasActiveSprint,
      run: actions.startSprint,
    },
    {
      id: 'complete-sprint',
      label: 'Complete active sprint',
      paletteGroup: 'Actions',
      keywords: ['finish sprint'],
      enabled: context.hasProject && context.hasActiveSprint,
      run: actions.completeSprint,
    },
    {
      id: 'toggle-theme',
      label: 'Toggle theme',
      paletteGroup: 'Actions',
      keywords: ['dark mode', 'light mode'],
      enabled: true,
      run: actions.toggleTheme,
    },
    {
      id: 'go-project-backlog',
      label: 'Current project backlog',
      paletteGroup: 'Pages',
      enabled: context.hasProject,
      run: actions.goToBacklog,
    },
    {
      id: 'go-project-board',
      label: 'Current project board',
      paletteGroup: 'Pages',
      enabled: context.hasProject,
      run: actions.goToBoard,
    },
    {
      id: 'go-project-sprints',
      label: 'Current project sprints',
      paletteGroup: 'Pages',
      enabled: context.hasProject,
      run: actions.goToSprints,
    },
    {
      id: 'open-assistant',
      label: 'Open assistant chat',
      paletteGroup: 'AI',
      keywords: ['chat', 'ask ai'],
      enabled: context.hasProject,
      run: actions.openAssistant,
    },
    {
      id: 'generate-todos',
      label: 'Generate todos with AI',
      paletteGroup: 'AI',
      keywords: ['ai generate'],
      enabled: context.hasProject && context.isBacklogPage,
      run: actions.generateTodos,
    },
    {
      id: 'plan-sprint',
      label: 'Plan sprint with AI',
      paletteGroup: 'AI',
      keywords: ['ai plan'],
      enabled: context.hasProject && context.isBacklogPage,
      run: actions.planSprint,
    },
    {
      id: 'summarize-sprint',
      label: 'Summarize sprint',
      paletteGroup: 'AI',
      keywords: ['summary', 'ai summary'],
      enabled: context.hasProject && context.hasActiveSprint && context.isBoardPage,
      run: actions.summarizeSprint,
    },
  ]
}
