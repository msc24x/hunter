# Communities

Groups that can host member-only contests and manage members.

| Endpoint | Auth | Description |
|---|---|---|
| `GET /api/communities` | `auth` | List/discover communities; `user_id` filters to a user's |
| `GET /api/communities/:id` | open | Community details |
| `POST /api/communities/create` | `login` | Create a community |
| `PATCH /api/communities/:id` | `login` admin | Update settings (e.g. `auto_approve_members`) |
| `GET /api/communities/memberships` | `login` | Caller's memberships |
| `GET /api/communities/:id/memberships/approved` | `login` | Approved members |
| `GET /api/communities/:id/memberships/pending` | `login` admin | Pending join requests |
| `POST /api/communities/:id/join` | `login` | Request/auto join |
| `POST /api/communities/:id/leave` | `login` | Leave |
| `PATCH /api/communities/:community_id/memberships/:operation` | `login` admin | Approve/reject/remove members |
| `PATCH /api/communities/:community_id/permissions` | `login` admin | Grant member permissions (`MANAGE_COMPETITIONS`) |

Member status: `PENDING_APPROVAL`, `APPROVED`, `NOT_APPROVED`,
`DISABLED` (community-level status also uses `CommunityStatus`).

Contests may set `community_id` + `community_only` to restrict
participation to approved members; see
[competitions.md](competitions.md).
