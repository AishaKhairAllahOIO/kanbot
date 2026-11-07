# Kanbot client

Kanbot is a personal sprint board with a backlog, a four-column board, sprint history, and an AI teammate. The client uses React 19, TypeScript, Vite, React Router, TanStack Query, and Axios to communicate with the API in `../server`.

## Run locally

Start the backend in a separate terminal:

```powershell
cd ..\server
npm install
Copy-Item .env.example .env
npm run seed
npm run dev
```

Then start the client:

```powershell
cd ..\client
npm install
npm run dev
```

## Validation

```powershell
npm run lint
npm run build
```

The client runs at `http://localhost:5173`. The seeded demo account is `demo@kanbot.dev` / `password123`.

Set `VITE_API_URL` in `client/.env` to override the API base URL. It defaults to `http://localhost:4000/api`. AI keys belong in the backend environment; the client only reads the AI mode from `GET /ai/status`.

## Requirements status and known issues

- The core v1 requirements and the enhancements listed below are implemented in the client.

## Additional features

### Navigation and personalization

- Dark mode with a theme toggle; the selected theme is remembered in `localStorage`.
- Keyboard shortcuts:
  - `Ctrl/Cmd + K` opens the command palette.
  - `?` opens keyboard shortcut help.
  - `c` creates a todo in the current project.
  - `/` focuses the current page's search field, when available.
  - `g` then `b` opens the current project's board.
  - `g` then `l` opens the current project's backlog.
  - `g` then `s` opens the current project's sprint history.
- Command palette (`Ctrl/Cmd + K`) supports searching and jumping to:
  - **Projects:** any project in the account; selecting one opens that project.
  - **Todos:** todos by key or title.
  - **Pages:** Projects, and the current project's backlog, board, or sprint history.
  - **Actions:** create a todo or sprint, start/complete a sprint when available, and toggle the theme.
  - **AI:** open chat, generate todos, plan a sprint, or summarize the active sprint when available.
  - Recent selections are remembered locally. Use `Arrow Up` / `Arrow Down` to select a result and `Enter` to run it; type to filter by command, project name/key, or todo key/title.
- Responsive navigation with a collapsible sidebar, mobile bottom navigation, and swipeable board columns.
- Sidebar layout preferences, including collapsed sidebar and project groups, are persisted with Zustand. Collapsed backlog and sprint sections are also remembered.
- Board columns can be collapsed individually; their expanded/collapsed state is remembered locally.
- Starred projects are saved in `localStorage`.
- Project name, key, and description can be edited inline on project cards.
- Daily Focus displays a quote from a built-in local list, selected by day; its refresh button shows the next quote for the current session. It does not fetch quotes from a service or persist the refreshed selection.
- Browser-only preferences and personal UI state are stored locally; project and todo data continue to come from the API.

### Productivity

- Undo actions for todo deletion and movement.
- Due-date indicators for overdue and due-today todos.
- Optional browser reminders for enabled projects. Configure the reminder time and whether to remind on the due day or one day earlier from the profile page. Reminders run while the app is open in a browser tab.
- An in-app notification center stores reminders locally, shows unread counts, supports marking one or all as read and clearing notifications, and links to the related project board.
- Colored label management and filtering by label.
- Bulk todo actions for selecting multiple todos and changing their sprint, priority, or deleting them.
- Active sprint burndown chart based on todo completion dates.
- Export backlog and sprint summaries to Markdown or CSV.
- Sprint templates with configurable default length and capacity.
- A Pomodoro-style focus timer with focus, short-break, and long-break sessions. Timer state is saved locally, and plant/coffee illustrations reflect the session.

### Profile and activity

- Profile page with account details, copyable name/email, locally saved profile photo, and a customizable status with an optional expiration.
- “My Week” activity view showing daily completed-todo counts and the todos completed on each day.
- Reminder settings and current browser notification permission state.

### AI assistant enhancements

- “Improve this todo” and “Estimate” actions that prepare contextual prompts for the AI chat.
- Suggested chat prompts based on the current page.
- Chat history saved locally per project.
- Simulated typewriter effect for assistant replies.

## UI and design libraries

- **Tailwind CSS ** is used for responsive utility styling and integrated into Vite with `@tailwindcss/vite`. Shared design tokens, theme colors, typography, motion, and reusable utilities are defined in `src/app/styles/theme.css`; focused CSS Modules are used for custom illustrations.
- **Radix UI** provides accessible dialog, dropdown-menu, popover, and tooltip primitives. This keeps keyboard and focus behavior reliable while allowing the components to use Kanbot’s own visual style.
- **Lucide React** supplies consistent, lightweight interface icons.
- **Fonts:** Bricolage Grotesque for headings, Instrument Sans for interface text, and JetBrains Mono for todo keys and code-like values.
- **React Markdown** renders AI responses as Markdown without enabling raw HTML.
