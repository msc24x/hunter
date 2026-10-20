# AGENTS.md — Backend Operational Guide for Hunter API

## 1. Project Context & Stack

Express 4.19 + TypeScript 4.7.4 backend for Hunter contest platform, using Prisma 6.1 (MySQL ORM) + raw mysql2 pool (legacy scoring queries), typedi 0.10 (DI), cookie-based session auth, nodemailer SMTP email, node-cron scheduling, and an external Showdown judge API.

## 2. Architecture & Middleware Pipeline

**Request flow (src/app.ts):**
```
cookieParser → bodyParser.json(10mb) → fileUpload → morgan → /api routes (require('./api/routes'))
→ express.static(static/) → SPA fallback (* → index.html) → error handler (500)
```

**Morgan landmine:** `morgan('combined')` runs when `config.env !== 'local'`, THEN `morgan('dev')` always runs — double logging in production.

**Route mounting (src/api/routes/index.ts):** All routers use `require()` (CommonJS) via `router.use(require('./xxx'))`. NEVER use ESM `import` for route modules.

## 3. Auth System

- **Cookie-based:** Session UUID in `session` cookie. `authenticate` middleware queries `session.findUnique` and sets `res.locals.user` (UserInfo) + `res.locals.isAuthenticated` (boolean).
- **Login:** GitHub OAuth only (`/oauth/github`). Creates user if new via `getOrCreateUser()`. Updates social fields on first fetch only (gated by `github_fetched_at`).
- **Impersonation:** `/superuser/impersonate/:user_id` — gated by `config.staff_email`. Sets `impersonating` cookie.
- **Logout:** Deletes session row and clears cookies.

## 4. Data Access Patterns

### Primary (Prisma ORM)
```ts
const client = Container.get(DatabaseProvider).client();
const data = await client.competitions.findMany({ where: {...} });
```
Use for all CRUD. `DatabaseProvider` is `@Service({ global: true })`.

### Legacy (mysql2 raw pool) — Scoring
```ts
models.results.getCompetitionScores(callback, id, user, after, question_id, batch_size);
```
Callback-style, accessed via `src/database/containers/models.ts`. The `Results.getCompetitionScores` builds raw SQL with Prisma.$queryRaw + window functions for ranking.

### Legacy Models (raw mysql2) — src/database/models/
- `Competitions.ts` — mixed static/instance, gets PoolConnection from DI in constructor
- `Questions.ts` — CRUD via raw connection
- `Results.ts` — scoring queries with `$queryRaw` + hand-written SQL
- `User.ts` — basic CRUD
**Landmine:** `containers/models.ts` calls `Container.get(DatabaseProvider).loadModels()` at module scope — importing this file triggers DI initialization of all legacy models.

## 5. Code Style & Patterns

### DI (typedi)
**NEVER use `new` for services.** All services decorated with `@Service({ global: true })`:
```ts
// GOOD
const db = Container.get(DatabaseProvider).client();
const judgeService = Container.get(JudgeService);
```
**Legacy models** (`Competitions`, `Questions`, `Results`, `User`) are NOT decorated — they're constructed via `Container.get(DatabaseProvider).loadModels()` which does `Container.set(ModelName, new ModelName())`.

### Response Pattern
Always use `Util.sendResponse(res, code)` or `Util.sendResponseJson(res, code, body)`. The `Util.sendResponseJson` handles BigInt serialization.

### Route Pattern
```ts
var router = express.Router();
const client = Container.get(DatabaseProvider).client();

router.get('/path', authenticate, loginRequired, (req, res) => {
    client.model.findMany({...})
        .then((data) => Util.sendResponseJson(res, resCode.success, data))
        .catch((err) => Util.sendResponse(res, resCode.serverError, err));
});

module.exports = router;
```

### Question Types (config.ts)
| Type | Value | Description |
|---|---|---|
| code | 0 | Programming (judged via Showdown) |
| mcq | 1 | Multiple choice |
| fill | 2 | Fill in blank |
| long | 3 | Long answer (manual eval) |

### Scoreboard Logic (ScoreboardService)
- Once a user has ANY positive-scoring result for a question (`result > 0`), all subsequent submissions get `points = 0`.
- Long-answer questions set `evaluated_at: null` and `result: 0` until manual evaluation.

### Bad / Good (DI inconsistency)

```ts
// BAD: direct instantiation + mixed connection patterns
const resultModel = new Results();
resultModel.getCompetitionScores(callback, id, user);

// GOOD: typedi container + Prisma typed query
const db = Container.get(DatabaseProvider).client();
const scores = await db.results.findMany({ where: { user_id: user.id } });
```

## 6. Reusable Components

| Component | Path | Notes |
|---|---|---|
| `Util` | `src/util/util.ts` | sendResponse, sendResponseJson, rowsToCsv, URL builders, file path helpers, `isValidExecRequest` |
| `Sanitizer` | `src/util/sanitizer/sanitizer.ts` | `isEmail`, `integer`, `rmEAlphabet` |
| `serverStorage` | `src/util/serverStorage.ts` | `createFile`, `deleteFile`, `fileExists`, `readFile` — all async/promise-based |
| `DatabaseProvider` | `src/services/databaseProvider.ts` | Wraps PrismaClient + mysql2 Pool. `client()` → PrismaClient, `getInstance()` → PoolConnection, `loadModels()` registers legacy models |
| `JudgeService` | `src/services/judgeService.ts` | Calls Showdown API (`SHOWDOWN_URL`, `SHOWDOWN_ACCESS_TOKEN`). Rate-limits by user (rejects concurrent requests for same user) |
| `ScoreboardService` | `src/services/scoreboardService.ts` | Creates result entries after judging. Handles all 4 question types |
| `sendInfoEmail` | `src/services/email.ts` | Nodemailer wrapper with multi-provider failover + 1s delay between sends (fake rate limiting). Providers are the ordered `smtpProviders` array in `src/config/config.ts` (index 0 = primary, uses `SMTP_*` vars); add entries there with creds in `SMTP_USER_N` / `SMTP_PASS_N`. Retries each provider `SMTP_MAX_RETRIES` (default 3) times, marks a dead provider down for `SMTP_FAILOVER_COOLDOWN_MS` (default 5m), and refuses to resend on ambiguous post-DATA failures to avoid duplicates |
| Email senders | `src/emails/*/sender.ts` | One module per email type, uses `renderer.ts` for ejs templates |

### File Storage Layout
```
backend/files/                                     ← config.filesPath ("files/")
  {competition_id}_{question_id}_testcases          ← Test case input files (uploaded by host)
  {competition_id}_{question_id}_solutions          ← Expected output files (uploaded by host)
  community_logo/{community_id}.{png|jpg}           ← Community logo images
  {competition_id}_{question_id}_{user_id}.{lang}   ← Draft code saves (saved per submission)
```

## 7. Guardrails & Boundaries

- **NEVER** commit `backend/.env/*`, `backend/files/*`, `backend/dist/`, `backend/static/`, `backend/src/scripts/shell.ts`
- **NEVER** edit `backend/prisma/migrations/` directly — always use `npx prisma migrate dev`
- **NEVER** import route files with ESM `import` — they're CommonJS (`module.exports`); use `require('./routes')`
- **NEVER** hardcode secrets (DB_URL, SMTP_PASS, SHOWDOWN_ACCESS_TOKEN, CID, CSEC) — they come from `backend/.env/.env.${ENV}`
- **NEVER** bypass `authenticate` + `loginRequired` for mutating endpoints
- **ALWAYS** use `parseInt()` for route params — they arrive as strings
- **ALWAYS** run commands from `backend/` directory (except `npx prisma` which also runs from `backend/`)
- **Vulnerability awareness:** no helmet, no cors, no rate limiting, 10mb body limit, global fileUpload

## 8. Cron Jobs

| Task | Schedule | Description |
|---|---|---|
| `new_submissions_reminder` | Daily 6 AM | Emails contest hosts about new submissions since last run |
| `new_community_memberships` | Every hour | Notifies community admins about pending memberships |
| `new_competitions_in_community` | Every hour | Notifies community members about new public contests |

All tracked via `cron_job` table — `last_run_at` determines query window.

## 9. Progressive Disclosure Map

| Location | Purpose |
|---|---|
| `../AGENTS.md` | Global project rules |
| `prisma/schema.prisma` | Full DB schema (single source of truth) |
| `src/config/config.ts` | Env loading + question types + file scopes |
| `src/config/settings.ts` | Status/result/exec code constants |
| `src/config/types.ts` | Shared TypeScript type definitions |
| `src/api/routes/` | All route handlers (11 route files) |
| `src/services/` | DI services: DatabaseProvider, JudgeService, ScoreboardService, email |
| `src/database/models/` | Legacy mysql2 callback-based models |
| `src/database/containers/models.ts` | Model initialization + DI registration |
| `src/emails/` | Email templates (ejs) + senders |
| `src/cron/` | Cron task registration + implementations |
| `src/util/` | Utility functions + sanitizer + file storage |
| `.env/presets/` | Environment templates for selfhost/planetscale/azure |
