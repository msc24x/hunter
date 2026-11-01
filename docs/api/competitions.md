# Competitions

Contests on Hunter. Auth column: `auth` = session or token optional,
`login` = `loginRequired` (403 when anonymous).

## `GET /api/competitions` — list/search `auth`

Query params:

| Param | Values | Notes |
|---|---|---|
| `query` | string | matches title OR description (`contains`) |
| `selfOnly` | `true` | only contests you host (ignored when anonymous) |
| `invited` | `true` | contests you're invited to (INVITE visibility) |
| `liveStatus` | `all` `upcoming` `live` `always` `ended` | schedule filter, default `all` |
| `practice` | `true`/`false` | practice contests filter |
| `qtype` | `0`-`3` | contests containing a question type |
| `community_id` | int | filter by community |
| `orderBy` | `asc`/`desc` | by `created_at`, default `desc` |
| `after` | int | offset, default `0` |
| `limit` | int ≤50 | page size, default `20` |

Anonymous callers get `PUBLIC` contests only. `selfOnly` and `invited`
return all your visibilities.

Response: `{ data: Competition[], meta: { total } }`. Each item includes
`host_user{id,name,avatar_url}`, `community{id,name}` (APPROVED only),
`_count.questions`, and `question_type_counts` (type → count).

## `GET /api/competition/:id` — details `login`

Returns the contest if you're the host, or (PUBLIC/accepted-INVITE) you
have started it via a session. Includes your `competition_sessions`,
accepted `competition_invites`, and `community{id,name}`.

Errors: `404` missing/deleted, `403` no access.

## `POST /api/competition` — create `login`

```json
{ "title": "Weekly Sprint", "description": "...", "practice": false }
```

- `title` required, ≤120 chars. Contest starts `PRIVATE`.
- Response: the created competition (`id`, `host_user_id`, defaults).

## `PUT /api/competition` — update `login` (host only)

Body must include `id` and `host_user_id` (your user id). Fields:

| Field | Constraint |
|---|---|
| `title` | ≤120 chars |
| `description` | ≤456 chars |
| `visibility` | `PRIVATE` `PUBLIC` `INVITE` |
| `community_id` | null detaches |
| `community_only` | requires `community_id` |
| `hidden_scoreboard` | bool |
| `randomize_questions` | bool |
| `scheduled_at` / `scheduled_end_at` | ISO datetimes or null; end must be after start |
| `time_limit` | minutes, 0–5760 (ignored for practice) |

Validation errors come back as `{ field: message }` (`400`). Community
permission is checked (`MANAGE_COMPETITIONS` or admin).

**Publish semantics:** marking a contest `PUBLIC` while launch blockers
exist (see quality endpoint) forces it back to `PRIVATE`. First time a
contest goes PUBLIC, `first_public_at` is set and community members are
emailed.

## `DELETE /api/competition/:id` — delete `login` (host only)

## `POST /api/competition/:id/session` — join contest `login`

Creates your `competition_session` (starts the contest for you).
Requires PUBLIC visibility or an accepted invite, contest already
scheduled (or unscheduled), and community membership when
`community_only`. Idempotent: `200` if a session exists, `201` on create.

## `GET /api/competition/:id/quality` — readiness check `login`

Returns warnings + launch **blockers** per contest and per question:

```json
{
  "blockers": ["Competition has no questions."],
  "acceptable": false,
  "questionsAcceptable": false,
  "42": {
    "blockers": ["..."],
    "acceptable": false
  }
}
```

Checks (per type): title/description presence; code questions need a
solutions file + successful `question_verification`; mcq needs ≥2
choices with at least one correct; fill needs ≥1 answer. `acceptable`
fields are `false` when any warning exists.
