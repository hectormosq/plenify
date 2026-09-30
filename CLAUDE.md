# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
# Start both client (port 3000) and server (port 3200) concurrently
npm run dev:windows   # Windows
npm run dev:macos     # macOS

# Run individually
cd client && npm run dev    # Next.js with Turbopack
cd server && npm run dev    # Express with hot reload (tsx watch)
```

### Testing
```bash
npm run test              # All tests
npm run test:client       # Client Jest tests
npm run test:server       # Server Jest tests

# Single test file (from client/ or server/ directory)
npx jest path/to/test.ts
npx jest --watch          # Watch mode
```

### Linting & Building
```bash
npm run lint              # Client ESLint
cd client && npm run build  # Next.js production build
```

## Architecture

**Monorepo** with two npm workspaces: `client/` (Next.js 15) and `server/` (Express), requiring Node >=18.18.0. The client rewrites `/api/v1/*` requests to the Express server.

### State Management — XState v5

All application state flows through a single XState actor defined in `client/app/machines/machine.ts`. The actor is created as a singleton in `client/app/context.ts` and consumed via the `usePlenifyState()` hook (`client/app/hooks/usePlenifyState.ts`), which is the primary interface for all pages and components.

Machine states: `initializing → initialized` (with nested `transactions.loading → loaded → transaction`).

### Local Database — TinyBase + IndexedDB

`PlenifyService` (`client/app/services/plenify.ts`) is a singleton wrapper around TinyBase's `mergeableStore`. All financial data lives in IndexedDB in the browser — there is no backend database.

Tables: `transactions`, `categories`, `transactionCategories` (junction table).  
Store values (settings): `autoSync`, `lastUpdated`, `lastSyncedRemoteVersion`.

### Google Drive Sync

`DriveService` (`client/app/services/driveService.ts`) handles backup upload/download using the Google Drive API v3. The backup file is `plenify_backup.json.enc` stored in the user's Drive. The `encryptionService.ts` exists but is **not currently wired in** — backups are plaintext JSON despite the `.enc` extension.

Sync is manual (triggered from `/profile`). Sync status (`synced`, `local_ahead`, `local_behind`, `unknown`) is determined by comparing `lastUpdated` timestamps.

### Authentication — NextAuth v4

Google OAuth with `drive.file` scope and offline access. `accessToken` and `refreshToken` are stored in the JWT and forwarded through the session object. Handler at `client/app/api/auth/[...nextauth]/route.ts`.

### Backend (Express)

The server is minimal — it serves hardcoded categories (`server/src/constants/categories.ts`) and a stub endpoint returning `[]`. Categories are fetched once during machine initialization and stored in TinyBase. CORS is set to wildcard `*`.

### Path Aliases (client)

```
@/*     → client root
@app/*  → client/app/
@styles/* → client/app/styles/
```

### Key Feature Routes

| Route | Purpose |
|---|---|
| `/dashboard` | Monthly overview, recent transactions, charts |
| `/overview` | Annual breakdown by category/month (expandable) |
| `/admin/add/[[...id]]` | Add or edit a transaction (dynamic route) |
| `/admin/upload` | 3-step CSV/XLSX import wizard (SheetJS) |
| `/admin/categories` | View/reset categories |
| `/profile` | Google Drive sync + OAuth sign-in |
| `/transaction-list` | Filterable list of all transactions |

### Styling

Pages use SCSS modules for layout. UI components use Material-UI v7 + Tailwind CSS. Both coexist — MUI for interactive components, Tailwind for utility spacing/layout, SCSS modules for page structure.

## Generated Artifacts

Files generated during a session (screenshots, exports, analysis notes, one-off scripts) are temporary/derived unless explicitly requested as a deliverable, and must never be left in the project root.

- **Default:** use the session scratchpad directory for anything ephemeral — debug scripts, intermediate output, one-off calculations. It's outside the repo, so nothing to clean up.
- **Safety net:** if a generated file needs to persist in the repo for the user to review or reference across sessions (e.g. verification screenshots, an exported report), store it under `artifacts/<task-name>-YYYY-MM-DD/` instead of the root. This directory is gitignored — treat its contents as disposable, not as the deliverable itself.
