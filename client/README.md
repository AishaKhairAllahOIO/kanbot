# Kanbot Client

React 19 + TypeScript + Vite + MUI. Sprint-based todo app: backlog, planned sprints, a drag-and-drop board, sprint history and an AI assistant. Talks to the Kanbot API in `../server`.

## Quick start

```bash
# 1. Backend (separate terminal)
cd ../server
npm install
cp .env.example .env
npm run seed     # demo@kanbot.dev / password123
npm run dev      # http://localhost:4000/api

# 2. Client
cd ../client
npm install
npm run dev      # http://localhost:5173
```

Demo account (after `npm run seed`): `demo@kanbot.dev` / `password123`

## Environment

`client/.env`:

| Variable       | Example                     | Purpose            |
| -------------- | --------------------------- | ------------------ |
| `VITE_API_URL` | `http://localhost:4000/api` | Base URL of the API |

The client never holds an AI key. It only reads `GET /ai/status` to show whether the server runs in **mock** or **real** AI mode. Keys live in `server/.env`.