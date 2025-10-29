---
applyTo: "**"
---

# Copilot / AI-agent instructions — Tether (concise)

Purpose: give an AI coding agent the minimal, concrete knowledge to be productive in this repo. Use the examples and file references below when proposing edits.

- Big picture
  - Frontend: Next.js (app folder). Edit pages under `app/` and UI components under `components/`.
  - Backend: TypeScript Express API in `backend/` (composition root: `backend/src/app.ts`; server bootstrap: `backend/src/server.ts`). DB is MySQL via `mysql2` and a simple DatabaseService abstraction.
  - Realtime: WebSocket hub in `backend/src/realtime/WebSocketHub.ts`. Clients connect to `/ws?userId=<id>` and use simple JSON messages {type: 'subscribe'|'unsubscribe', matchId}.

- Key conventions (concrete)
  - Layers: controllers are thin (HTTP I/O), services contain business logic, repositories encapsulate DB access (DIP via interfaces like `IDatabase`), middleware handles cross-cutting concerns (see `backend/src/middleware/errorHandler.ts`).
  - Composition: `createApp()` in `backend/src/app.ts` wires routers (`backend/src/routes/index.ts`), middleware, and logging. `server.ts` calls `bootstrapDatabase()` and `WebSocketHub.init(server)`.
  - Schema bootstrapping: `backend/src/services/BootstrapService.ts` creates DB and tables idempotently — prefer updating schema here or instructing the developer to apply manual SQL in `backend/README.md` if privileges are missing.
  - Realtime guarantees: WebSocketHub verifies match membership before allowing subscription. When editing event names or payloads, update `WebSocketHub.broadcastToMatch` / `sendToUser` and any service code that triggers those broadcasts.

- Developer workflows (discoverable commands & behavior)
  - Frontend dev: run the Next dev server from repo root (README: `npm run dev` in root). Edit `app/page.tsx` for pages.
  - Backend dev: cd into `backend/`, install deps, `npm run dev` starts the API on port 4000 (see `backend/README.md`). The server bootstraps DB tables on start via `bootstrapDatabase()`.
  - WebSocket: connects to `ws://localhost:4000/ws?userId=<id>`; subscribe/unsubscribe messages are JSON `{type:'subscribe',matchId}`.

- What to inspect when making changes
  - Routing & composition: `backend/src/app.ts`, `backend/src/routes/index.ts`, and individual route modules under `backend/src/routes/`.
  - Business logic: `backend/src/services/*` (e.g., `MatchService.ts`, `MessageService.ts`). Keep controllers skinny and add logic to services.
  - DB access: `backend/src/repositories/*` (e.g., `MatchRepository.ts`, `UserRepository.ts`) and `backend/src/interfaces/IDatabase.ts`.
  - Realtime: `backend/src/realtime/WebSocketHub.ts` (connection auth via userId query param, subscription checks).

- Agent-specific editing rules (follow these exactly)
  1. Preserve public API shapes. When changing route request/response shapes, update controller, DTO validation, and the README examples. Prefer adding new routes rather than changing existing contract unless requested.
  2. Database changes: if adding fields/tables, update `BootstrapService.ts` (idempotent CREATE TABLE SQL) and include SQL snippets in `backend/README.md` for local dev instructions.
  3. Real-time changes: when renaming events or payloads, update `WebSocketHub.ts` and any service code that emits events (search for .broadcastToMatch / .sendToUser usages).
  4. Tests: repository currently does not include automated tests; do not add large test scaffolding without asking. Small unit tests are OK under a new `backend/test/` folder.

- Quick examples you can reference in patches
  - Add a new API route: create `backend/src/routes/myFeature.routes.ts`, export a router, then import/register it in `backend/src/routes/index.ts` which is used by `app.ts`.
  - Use DB: prefer repository helpers (e.g., `new MatchRepository(db).findById(id)`) instead of raw queries in controllers.
  - WebSocket: valid connect URL `ws://localhost:4000/ws?userId=123`; subscription flow handled in `WebSocketHub.ts`.

- Files to open first (high signal)
  - `backend/src/app.ts` (composition root)
  - `backend/src/server.ts` (bootstrap + WebSocket init)
  - `backend/src/services/BootstrapService.ts` (schema bootstrap)
  - `backend/src/realtime/WebSocketHub.ts` (realtime messaging)
  - `backend/src/repositories/*` and `backend/src/controllers/*` (patterns for DB and HTTP)

If anything in these sections is unclear or you'd like more examples (route skeleton, service template, or a safe refactor checklist), tell me which area to expand and I will iterate. 

---
Preserved: naming and error-handling rules already present in the repo (PascalCase for components/ types, camelCase for functions/vars, try/catch for async). Use this document as the authoritative short guide for automated agents. 

Request: please review and tell me which sections need more precision (for example: preferred log format, exact npm scripts to run in root vs backend). 
---
applyTo: "**"
---
# Project general coding standards

## Naming Conventions
- Use PascalCase for component names, interfaces, and type aliases
- Use camelCase for variables, functions, and methods
- Prefix private class members with hash (#)
- Use ALL_CAPS for constants

## Error Handling
- Use try/catch blocks for async operations
- Implement proper error boundaries in React components
- Always log errors with contextual information

## Project Context
- The project is called Tether and it's about building an MVP for a dating app, this contains matching algorithms, recommendation system, and basic CRUD
- The technology we're going to use is Next.js, Node.js (Backend), MySQL for persistent DB

## Folder Structures
- for private folders prefix it with underscore (_)
- when creating a file or folder check the workspace if there is already available, then check if there is a grouping folders (example (landing) folder is a folder that next doesn't take on its route but it can be used to group folders that can be routed)

## Writing README.md
- write a guide on how to setup the project
- make sure each documented piece is concisely written