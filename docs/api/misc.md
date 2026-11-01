# Materials, media, analytics

## Materials `/api/competitions/:comp_id/materials`

Attach reference materials (notes/links) to a contest; link them to
questions via `material_ids` on question update.

| Endpoint | Auth | Description |
|---|---|---|
| `GET .../materials` | auth | List materials of a contest |
| `GET .../materials/:id` | auth | One material |
| `POST .../materials` | login host | Create (type, title, content or file) |
| `PUT .../materials/:id` | login host | Update |
| `DELETE .../materials/:id` | login host | Soft-delete |

## `GET /api/media/*` open

Serves stored media (e.g. `community_logo/{id}.{png|jpg}`) from `files/`.

## `GET /api/status/:subject` open

Analytics/status counters (e.g. submission totals). Used for site
stats widgets.
