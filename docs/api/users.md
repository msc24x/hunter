# Users

## `GET /api/users/:id` `login`

Public profile of a user: `id`, `name`, `avatar_url`, `blog_url`,
`github_url`, `linkedin_url`, plus stats:

- `hunt_points` — total score across non-practice contests
- `competitions` — their PUBLIC contests (with per-question result counts)
- `participated` — PUBLIC contests they have results in

## `PUT /api/users` `login`

Update own profile:

```json
{
  "id": 1,
  "name": "Display name",
  "blog_url": "https://...",
  "linkedin_url": "https://...",
  "email": "...",
  "email_updates_disabled_at": "ISO date or null"
}
```
