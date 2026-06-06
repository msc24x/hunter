# AGENTS.md — Operational Guide for Hunter

## 1. Project Context & Stack

Hunter is a contest hosting platform with an Angular 16 frontend and Express/Prisma backend that supports coding, MCQ, fill-blank, and long-answer questions via an external judge service (Showdown).

- **Frontend:** Angular 16.0.2, TypeScript 4.9.3, Angular Material 16.2.14, RxJS 7.4, SCSS, Karma 6.3 + Jasmine 3.10
- **Backend:** Node.js (lts-slim), Express 4.19, TypeScript 4.7.4, Prisma 6.1 (MySQL), typedi 0.10 (DI), argon2, jsonwebtoken, nodemailer, morgan, ejs, node-cron
- **Tooling:** Angular CLI 16.0.2, ESLint 9 + typescript-eslint strictTypeChecked, Prettier (tabWidth 4)
- **Database:** MySQL via Prisma ORM + raw mysql2 pool (dual connection)

## 2. Core Dev Commands

| Context | Command | Notes |
|---|---|---|
| Frontend dev | `npm start` | `ng serve` — proxies `/api` → `http://127.0.0.1:8080` via `src/proxy.conf.json` |
| Frontend build | `npm run build` | Outputs to `build/`; LANdMINE uses `rm -rf /build` first (will try to delete `C:\build` on Windows) |
| Frontend test | `ng test` | Karma + Jasmine, single-run requires `--watch=false --browsers=ChromeHeadless` |
| Frontend lint | `npx eslint src/` | No script in package.json; ESLint 9 flat config at `eslint.config.mjs` |
| Backend dev | `npm run start-local` (in `backend/`) | Uses `ENV=local nodemon -L src/app.ts` loads `.env/.env.local` |
| Backend prod | `npm run start-prod` | `ENV=prod ts-node src/app.ts` loads `.env/.env.prod` |
| Backend win-prod | `npm run win-start-prod` | Windows-only: `set ENV=prod&& ts-node src/app.ts` |
| Backend lint | `npm run lint` (in `backend/`) | `eslint src/**/*.{ts,tsx}` |
| Backend typecheck | `npm run check-types` | `tsc --noemit` |
| Backend shell | `npm run shell` | Runs `src/scripts/shell.ts` (MUST restore from git if missing — file is gitignored) |
| DB migrate | `npx prisma migrate dev` (in `backend/`) | Prisma schema at `backend/prisma/schema.prisma` |
| Docker build | `npm run push-image` | `docker compose -f docker-compose.yml build --push` |
| Selfhost | `docker compose -f docker-compose-selfhost.yml up` | Standalone MySQL + backend stack |

## 3. Code Style & Patterns

- **Backend DI:** typedi `@Service({ global: true })` decorators + `Container.get()`. NEVER use `new` for services. Provider pattern: `DatabaseProvider` wraps both PrismaClient and raw mysql2 pool.
- **Backend routing:** Express router files in `backend/src/api/routes/` are required via `require('./api/routes')` (CommonJS).
- **Frontend:** Angular standalone app with `app.module.ts`. Sentry init occurs in `src/sentry-init.ts` imported BEFORE Angular bootstrap in `main.ts`. Env file replacement via angular.json (dev/prod).
- **Naming:** snake_case DB columns (Prisma models mirror MySQL), camelCase TypeScript. API routes use plural nouns (`/competitions`, `/communities`).
- **Question types (config.ts):** `code=0, mcq=1, fill=2, long=3`.
- **Env loading:** `backend/src/config/config.ts` loads `dotenv` from `.env/.env.${ENV}`. NEVER hardcode secrets.

**Bad / Good (Backend route handler):**

```ts
// BAD: direct new + no error propagation
const result = new Results().getAll(req.params.id);
res.json(result);

// GOOD: typedi DI + async/await + error boundary
const db = Container.get(DatabaseProvider).client();
const data = await db.competitions.findMany({ where: { id: +req.params.id } });
res.json({ success: true, data });
```

## 4. Guardrails & Boundaries

- **NEVER** commit or modify files under: `.env/`, `backend/.env/`, `backend/files/`, `backend/dist/`, `backend/static/`, `.ssh/`, `debug.log`
- **NEVER** modify `backend/src/scripts/shell.ts` — it is gitignored so changes are invisible; restore from git if missing
- **NEVER** commit real `.env` values or Sentry DSNs
- **NEVER** alter `backend/prisma/migrations/` directly; always use `npx prisma migrate`
- **NEVER** run `rm -rf /build` verbatim — on Windows this targets `C:\build`; use `Remove-Item -Recurse -Force build/` instead
- **NEVER** run `ng serve` or `nodemon` as background processes — they block the terminal (use `Start-Process` or a separate terminal)
- **NEVER** edit `node_modules/`, `.angular/`, or `dist/` in either root or `backend/`
- **ALWAYS** run backend commands from the `backend/` subdirectory
- **Editorconfig vs Prettier conflict:** `.editorconfig` says `indent_size=2`, `.prettierrc` says `tabWidth=4` — Prettier wins when run directly; editors may disagree. Prefer Prettier (tabWidth 4).
- **TSConfig path alias typo:** `tsconfig.app.json` maps `@assets/*` → `assests/*` (double 's'). Do NOT "fix" — updating it will break existing imports.

## 5. Progressive Disclosure Map

| Location | File | Purpose |
|---|---|---|
| `AGENTS.md` | root | This file — global rules |
| `backend/AGENTS.md` | does not exist yet | Would hold backend-specific override rules |
| `docs/` | `how_to_create_communities_on_hunter.md`, `system-design.pdf` | Feature docs & architecture |
| `.github/ISSUE_TEMPLATE/` | root | Issue templates |
| `backend/.env/presets/` |  | Env templates: `.env.selfhost`, `.env.planetscale.dev`, `.env.planetscale.prod`, `.env.azure` |
