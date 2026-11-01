# Judging & submissions

Submissions execute on the external Showdown judge via `JudgeService`
(which rate-limits concurrent runs per user). Only contest participants
submit.

## `POST /api/submit` `login`

```json
{
  "exec": {
    "for": { "competition_id": 10, "question_id": 42, "type": 0 },
    "solution": { "code": "...", "lang": "cpp" }
  }
}
```

`lang` ∈ `c cpp py js ts go java`. Runs against the question's uploaded
testcases; a `results` row is created (via `ScoreboardService`). Once a
user has any positive-scoring result for a question, later submissions
score `0`. Long-answer questions stay `result: 0` until manual evaluation.

## `GET /api/submission/:lang` `login`

Fetch your saved draft for a question.

Query: `competition_id`, `question_id` (required).

Reads `{comp_id}_{ques_id}_{user_id}.{lang}` from `files/`.
