# Results & scoreboards

## `GET /api/competitions/:id/results` `auth`

Scoreboard rows for a contest, ranked via window functions. Visible when
`hidden_scoreboard=false` or you're the host.

Query: `after` (offset), `question` (filter by question id).

## `GET /api/competitions/:id/results/download` `auth`

Same access rules; batches up to 5000 rows (500 per batch) as a
download. Query: `question`, pagination internals.

## `GET /api/competitions/:id/results/:ques_id` `login`

Per-question results.

## `GET /api/competitions/:id/progress` `login`

Caller’s own progress within a contest.

## `GET /api/competitions/:id/evaluations/:ques_id?` `login`

Long-answer evaluations (manual grading queue).

## `PUT /api/competitions/:id/evaluations/:eval_id` `login` (evaluator)

Assigns the manual score for a long-answer result.
