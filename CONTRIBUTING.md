# Contributing to Hunter

Thanks for your interest. Hunter is an open-source contest hosting platform
with an Angular frontend and an Express/Prisma backend.

By participating you agree to follow our
[Code of Conduct](CODE_OF_CONDUCT.md). Report unacceptable behavior to
contact@cambo.in.

## Project layout

| Path        | What it is                                   |
| ----------- | -------------------------------------------- |
| `src/`      | Angular 16 frontend                          |
| `backend/`  | Express + TypeScript API with Prisma (MySQL) |
| `docs/`     | Feature docs and API docs                    |
| `UI.md`     | Frontend UI conventions                      |
| `AGENTS.md` | Dev commands and project guardrails          |

The frontend dev server proxies `/api`, `/sitemap.xml`, and `/llms.txt` to the
backend at `http://127.0.0.1:8080`. See `src/proxy.conf.json`.

## Prerequisites

- Node.js 18 LTS. Angular 16 also supports Node 16.14+ and 20.9+.
- npm
- MySQL 8+
- Git

## Setup

```bash
git clone https://github.com/msc24x/hunter.git
cd hunter
npm install

cd backend
npm install
```

### Backend environment

Create `backend/.env/.env.local`. This file is gitignored. Put at least these
values in it:

```dotenv
ENV=local
DB_URL=mysql://USER:PASSWORD@localhost:3306/DATABASE_NAME
API_PORT=8080
PROTOCOL=http
FRONTEND_DOMAIN=http://localhost:4200
```

These optional variables enable extra features:

| Variable                                              | Feature                          |
| ----------------------------------------------------- | -------------------------------- |
| `STAFF_EMAIL`                                         | Superuser impersonation          |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`    | Outgoing email                   |
| `SHOWDOWN_URL`, `SHOWDOWN_ACCESS_TOKEN`               | Code judging via Showdown        |
| `CID`, `CSEC`                                         | GitHub OAuth login               |
| `SMTP_MAX_RETRIES`, `SMTP_FAILOVER_COOLDOWN_MS`       | Email retry tuning (has defaults)|

The app starts without them. Login, email, and code judging will not work
until you configure the matching variables.

### Database

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### Run

```bash
# backend on http://127.0.0.1:8080
cd backend && npm run start-local

# frontend on http://127.0.0.1:4200
cd hunter && npm start
```

`npm start` clears the Angular cache, runs `ng serve`, and regenerates the docs
manifest through the `prestart` hook.

## Commands

Frontend, from the repo root:

| Command             | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `npm start`         | Dev server with `/api` proxy                         |
| `npm run watch`     | Development build in watch mode                      |
| `npm run build`     | Production build into `build/`                       |
| `npx ng test`       | Unit tests (Karma/Jasmine)                           |
| `npx eslint src/`   | Lint                                                 |

`npm run build` deletes a `/build` directory first. That step comes from the
Windows deploy script. On Linux or macOS, `npx ng build --output-path build/`
does the same thing.

Backend, from `backend/`:

| Command                  | Purpose                            |
| ------------------------ | ---------------------------------- |
| `npm run start-local`    | Dev server, loads `.env.local`     |
| `npm run check-types`    | Typecheck                          |
| `npm run lint`           | Lint                               |
| `npx prisma migrate dev` | Create and apply migrations        |
| `npx prisma studio`      | Browse the database                |

The backend has no test suite. Use `check-types`, `lint`, and manual testing.

## Self-hosting

`docker-compose-selfhost.yml` runs MySQL and the backend together:

```bash
docker compose -f docker-compose-selfhost.yml --profile services up
```

## Style and conventions

- Prettier uses `tabWidth: 4` with spaces (`.prettierrc`). Run `npx prettier --write <file>` before committing.
- The frontend uses ESLint 9 flat config (`eslint.config.mjs`) with strictTypeChecked. The backend has its own config. Keep `npm run lint` clean in both.
- Backend routes in `backend/src/api/routes/` are CommonJS. Mount them with `require()`, not `import`.
- Backend services use typedi (`@Service({ global: true })` and `Container.get()`). Do not use `new`.
- Send API responses with `Util.sendResponse` or `Util.sendResponseJson`. Parse route params with `parseInt()`.
- Mutating endpoints need `authenticate` and `loginRequired`. Do not bypass them.
- Follow `UI.md` for frontend UI work. Reuse existing components and tokens before adding new ones.
- Do not commit `.env` files, `backend/files/`, `backend/dist/`, `backend/static/`, or secrets.

Question type IDs are in `backend/src/config/config.ts`: `code=0`, `mcq=1`,
`fill=2`, `long=3`.

## Testing

- Frontend: `npx ng test`, plus `npm start` for manual checks.
- Backend: `npm run check-types && npm run lint`, plus manual API testing.
- Update `README.md`, `docs/`, or `UI.md` if you change setup or user-facing
  behavior.

## Pull requests

1. Branch from `main`, for example `feat/short-description` or `fix/short-description`.
2. Use plain imperative commit messages or `feat:`/`fix:` prefixes. Both styles exist in the history.
3. Open a PR with the template. Explain the change, link the issue, and say how you tested it.
4. For changes to scoring, auth, or judging, describe the behavior change clearly.

For large or controversial changes, open an issue first.

## Finding work

- Look for issues labeled `good first issue` or `help wanted`.
- File bugs and feature requests with the issue templates. Search first to avoid duplicates.
- Questions: contact@cambo.in.
