# Leaderboard

## `GET /api/leaderboard` `public`

Global leaderboard — top 100 users ranked by total points (`SUM(results.result)`)
across all rated contests. Same scoring as the `hunt_points` shown on profiles.

Eligible results: non-deleted questions and competitions, `practice=false`.
Private contest points count; a host's own results count too.

Query params:

- `community_id` (optional int) — scope the leaderboard to contests belonging
  to that community.
- `nocache=true` — bypass the 12-hour server-side cache and regenerate.

Response:

```json
{
    "meta": { "total": 1537 },
    "rows": [
        {
            "user_rank": 1,
            "user_id": 12,
            "user_name": " hunter ",
            "user_avatar_url": "https://...",
            "result": 1840
        }
    ]
}
```

- `meta.total` — total number of ranked users (rows are capped at 100).
- `user_rank` — `RANK()` over `total_points DESC` — tied users share a
  rank and the following rank is skipped (1224-style); ties display in
  `user_id` order.
- Cached in memory for 12 hours per scope (`global` / `community:<id>`);
  stale cache is served if the database is unreachable.
