# Authentication

## GitHub OAuth (browser)

`GET /api/oauth/github`

- No `redirect` param → redirects to GitHub authorize URL; on callback, the
  backend creates/fetches the user, creates a `session` row, and sets the
  `session` cookie.
- Subsequent requests send the cookie automatically.

`GET /api/authenticate` — returns `202` + the current user object, or `403`.

`POST /api/logout` — deletes the session row, clears `session` +
`impersonating` cookies.

`GET /api/superuser/impersonate/:user_id` — staff-only (`staff_email`
config); sets an `impersonating` cookie.

## API tokens

Long-lived tokens for non-browser clients, created by a logged-in user and
scoped to them. Sent as `Authorization: Bearer hut_<64-hex>`.

- Only the **sha256 hash** is stored; the raw token is returned **once** at
  creation and cannot be recovered. Lost token → revoke + recreate.
- Optional expiry (`expires_in_days`, 1–3650) and `revoked_at` soft-revoke.
- `last_used_at` updates asynchronously on each use.
- Managed in the UI under Account → Settings, or via these endpoints
  (cookie or token auth, `loginRequired`):

### `POST /api/tokens`

```json
// request
{ "name": "my mcp client", "expires_in_days": 90 }
// response 200 — `token` is shown only here
{
  "id": 4, "name": "my mcp client", "created_at": "...",
  "last_used_at": null, "expires_at": "...", "revoked_at": null,
  "token": "hut_<64 hex>"
}
```

Errors: `400` missing/overlong `name` (>100 chars) or invalid
`expires_in_days`.

### `GET /api/tokens`

Lists the caller's tokens (metadata only — never the hash or raw token):

```json
[{ "id": 4, "name": "...", "created_at": "...",
   "last_used_at": "...", "expires_at": "...", "revoked_at": null }]
```

### `DELETE /api/tokens/:id`

Sets `revoked_at`. Scoped to the caller (`404` for other users' tokens or
already-revoked ones).

## Notes for clients

- Treat tokens like passwords: store in env vars or a secret manager, never
  commit them.
- Token auth adds one indexed DB lookup per request (same cost as sessions).
- All permission checks are identical for cookie and token auth — a token
  can do exactly what its owning user can do.
