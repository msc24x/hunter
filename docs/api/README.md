# Hunter API

REST API for the Hunter contest platform. Express + Prisma (MySQL), cookie
sessions or Bearer API tokens for auth.

- **Base URL:** `/api` (same origin as the app; dev proxy: `http://127.0.0.1:8080/api`)
- **Format:** JSON requests and responses. Multipart only for file uploads.
- **MCP:** a Model Context Protocol endpoint is exposed at `POST /api/mcp`
  for agent clients; see [mcp.md](mcp.md).

## Authentication

Two mechanisms (see [authentication.md](authentication.md)):

| Method | How | Use |
|---|---|---|
| Session cookie | `session` cookie, issued via GitHub OAuth | Browser frontend |
| API token | `Authorization: Bearer hut_<64 hex>` | Scripts, MCP, integrations |

`authenticate` middleware resolves either. `loginRequired` endpoints return
`403` when unauthenticated. When `Authorization: Bearer` is present it takes
precedence; an invalid token does not fall back to a cookie identity.

## Response envelope

Responses are returned via `Util.sendResponse` / `sendResponseJson`:

- `2xx` — body is the resource/data directly (or empty for no-content ops)
- `400` — validation errors, often an object mapping `field -> message`
- `403` — not authenticated, or insufficient permission
- `404` — resource missing or not visible to you
- `503` — server error

Most write/read access is owner-scoped via `host_user_id` / `user_id`
checks inside the handlers, not via scopes on the token.

## Conventions

- IDs are integers passed as path params (always parsed with `parseInt`).
- Pagination is offset-based: `after` (offset) + `limit`.
- Visibility enum: `PRIVATE`, `PUBLIC`, `INVITE`.
- Question types: `0=code`, `1=mcq`, `2=fill`, `3=long`.

## Endpoint index

| Doc | Covers |
|---|---|
| [authentication.md](authentication.md) | OAuth, sessions, API tokens |
| [competitions.md](competitions.md) | Contest CRUD, listing, sessions, quality |
| [questions.md](questions.md) | Question CRUD, choices, files, import, verification |
| [results.md](results.md) | Scoreboards, progress, evaluations |
| [users.md](users.md) | Profiles |
| [communities.md](communities.md) | Communities, memberships, permissions |
| [invites.md](invites.md) | Contest invites |
| [judging.md](judging.md) | Submission + draft fetch |
| [misc.md](misc.md) | Materials, media, analytics status |
| [mcp.md](mcp.md) | MCP endpoint for AI agents |
