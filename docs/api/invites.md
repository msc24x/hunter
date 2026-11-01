# Contest invites

For `INVITE`-visibility contests, hosts invite specific users; accepting
creates `accepted_at` which unlocks joining.

| Endpoint | Auth | Description |
|---|---|---|
| `POST /api/competitions/:id/invites` | `login` host | Create invites; body is an array of invite objects (user/email to invite) |
| `GET /api/competitions/invites/:invite_id` | open | Resolve an invite link — `:invite_id` is base64 `id-uuid` |
| `POST /api/competitions/invites/:invite_id` | `login` | Accept an invite |
| `DELETE /api/competitions/:id/invites/:invite_id` | `login` host | Revoke; notifies the user by email |
