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

The client runs at `http://localhost:5173`. The seeded demo account is `demo@kanbot.dev` / `password123`.

Set `VITE_API_URL` in `client/.env` to override the API base URL. It defaults to `http://localhost:4000/api`. AI keys belong in the backend environment; the client only reads the AI mode from `GET /ai/status`.

## Design and implementation

- **Visual direction:** a calm workbench. Backlog entries use flat divided rows; work-in-progress appears on raised board cards; the sprint ribbon is the primary progress visualization.
- **Theme:** the wireframes define screen structure; `design/design.md` defines appearance. Light and dark themes use semantic CSS variables mapped into Tailwind v4 utilities. User theme preference is stored as `kanbot-theme`.
- **Logo:** brand assets are isolated in `src/assets/brand`, and `src/shared/components/Logo.tsx` is their only UI importer.
- **Fonts:** self-hosted Bricolage Grotesque, Instrument Sans, and JetBrains Mono variable fonts.
- **Components:** Radix Dialog, Dropdown Menu, and Tooltip primitives provide accessible interactions. Shared components live in `src/shared/components`.
- **Data:** feature hooks own TanStack Query state and mutations; feature API modules use the shared Axios client. The API contract is mirrored in `src/shared/types/api.ts`.
- **Drag and drop:** dnd-kit supports pointer and keyboard sensors. Backlog row menus and board card menus provide non-drag alternatives, with optimistic updates and rollback.
- **AI:** AI responses are user-reviewed drafts. Markdown is rendered without raw HTML, and the UI displays the mock mode and review disclaimer.

## Implemented workflows

- Register, log in, persist the session, handle expired sessions, and log out.
- Create, edit, switch, and delete projects.
- Search and filter the backlog; quick-create, edit, delete, reorder, and move todos.
- Create, edit, delete, and start planned sprints; view the active board; move cards between statuses; complete sprints and carry unfinished work.
- View sprint history and details, and generate sprint summaries.
- Chat with the AI assistant, generate editable todo drafts, and plan a sprint from backlog todos.
- Responsive navigation, theme toggle, loading/error/empty states, keyboard interaction, and mutation feedback.

## Validation

```powershell
npm run lint
npm run build
```
