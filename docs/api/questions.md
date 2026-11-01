# Questions

Base path: `/api/competitions/:comp_id/questions`. Question types:
`0=code`, `1=mcq`, `2=fill`, `3=long`. All writes are host-only
(`competitions.host_user_id` must match the caller).

## `GET /api/competitions/:comp_id/questions/:id?` `auth`

Returns the competition with `questions` (incl. `question_choices`,
`question_materials`), `host_user`, `community`.

Access shaping (participant view):

- `PRIVATE` contests → `404` for non-hosts.
- Statements/choices are **blanked** unless the contest is live AND
  (practice or the caller has a `competition_session`).
- Correct answers are stripped (`is_correct=false`, `correct_count`
  exposed instead); fill answers are removed.
- **Host view:** when the caller is the host AND the request `Referer`
  contains `/editor/`, the full editor payload is returned, including
  answers and invites. (MCP/tools use this header for host reads.)

Optional `/:id` limits to one question. `randomize_questions` shuffles
order for participants with an active session.

## `POST /api/competitions/:comp_id/questions` `login` (host)

```json
{ "type": 1 }
```

Creates an empty question (`points: 2`). Fill it in via PUT.

## `PUT /api/competitions/:comp_id/questions/:id` `login` (host)

Fields: `title` ≤400, `statement` ≤4000 (HTML sanitized), `points`,
`neg_points` (0–40 each), `case_sensitive` (fill), `char_limit` (long),
`sample_cases` / `sample_sols` ≤1000 (code), `type`.

`question_choices` (mcq/fill) syncs the full set:

```json
[
  { "id": 12, "text": "A", "is_correct": true },
  { "text": "new choice" },
  { "id": 13, "delete": true }
]
```

`material_ids` (array) replaces the material link set; ids must be
materials of the same contest.

Validation errors: `{ field: message }` (`400`).

## `DELETE /api/competitions/:comp_id/questions/:id` `login` (host)

Soft-delete (`deleted_at`).

## `POST /api/competitions/:comp_id/questions/:id/:fileType` `login` (host)

`fileType` ∈ `testcases` | `solutions`. Multipart upload, field `file`,
≤1.5MB. Stored as `{comp}_{ques}_{fileType}` under `files/`. Side
effects: deletes `verification_output` and resets
`question_verification.success` — re-verify afterward.

`GET .../questions/:id/:fileType/:op?` fetches them back (`login`).

## `POST /api/competitions/:comp_id/questions/:id/verification` `login` (host)

```json
{ "solution": { "code": "int main(){...}", "lang": "cpp" } }
```

`lang` ∈ `c cpp py js ts go java`. Executes via the judge against the
uploaded testcases, stores `verification_output`, upserts
`question_verification` (response includes `success`, `reason`).
Requires the solutions file to exist first.

`GET .../verification` returns the stored verification.

## `GET /api/competitions/questions/import/schema` `login`

Returns `config.importSchema` — the documented JSON shape for bulk
import (per-type fields and limits).

## `POST /api/competitions/:comp_id/questions/import` `login` (host)

```json
{
  "delete_existing": false,
  "default_points": 2,
  "default_neg_points": 0,
  "questions": [ { "type": 1, "title": "...", "question_choices": [...] } ]
}
```

≤10 questions per call. Runs in a transaction (choices created with
questions). For `code` questions, `test_cases`/`solutions` are written
as files after commit; `solution_code`+`solution_lang` triggers
automatic verification. Errors: `{ "questions[i].field": msg }` (`400`),
`403` not host.
