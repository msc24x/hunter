# MCP endpoint

`POST /api/mcp` — [Model Context Protocol](https://modelcontextprotocol.io)
server, Streamable HTTP transport, **stateless** (a fresh server is built
per request, bound to the authenticated user).

## Auth

`authenticate` + `loginRequired` — same as every other route:

- `Authorization: Bearer hut_...` (API token — the intended method)
- or the `session` cookie

Non-POST methods return `405` JSON-RPC errors. Unauthenticated → `403`.

## How it works

Each tool call is forwarded to the REST API over loopback
(`http://127.0.0.1:$API_PORT/api`) with the caller's credential
forwarded as-is. Tools therefore inherit the exact permission and
business rules of the HTTP endpoints — nothing is re-implemented.
Code lives in `src/api/mcp/` (`server.ts`, `tools/*`, `hunter-client.ts`,
`respond.ts`).

## Client configuration

```jsonc
// e.g. ~/.config/devin/mcp_config.json
{
  "mcpServers": {
    "hunter": {
      "url": "https://your-hunter-host/api/mcp",
      "headers": { "Authorization": "Bearer hut_..." }
    }
  }
}
```

## Tools

| Tool | Purpose |
|---|---|
| `get_contests` | List your contests (query, liveStatus, practice, qtype, community_id, orderBy, after/limit≤50) |
| `get_contest` | Full details of one of your contests |
| `get_contest_quality` | Warnings + launch blockers — call before publishing |
| `create_contest` | Create a PRIVATE contest (title, description, practice) |
| `update_contest` | Update settings incl. visibility/schedule/time_limit |
| `get_questions` | Host view of questions (statements, answers, materials) |
| `get_question_import_schema` | JSON shape for bulk import |
| `create_question` | Create an empty question by type (0–3) |
| `update_question` | Update fields, sync choices/material links |
| `delete_question` | Soft-delete a question |
| `import_questions` | Bulk create ≤10 questions (files + auto-verify for code) |
| `upload_question_file` | Upload `testcases`/`solutions` file content (≤1.5MB). These are the real judging files: generate many varied cases covering edge cases, not just samples |
| `verify_question` | Judge-run a solution to prove the question solvable; the solution must match every test case |

Host workflow: `create_contest` → `import_questions` /
`create_question`+`update_question` → `upload_question_file` →
`verify_question` → `get_contest_quality` → `update_contest`
(`visibility: PUBLIC`).

## Notes

- All tools are host-scoped: they act on contests you own.
- `verify_question` and `import_questions` (with solution code) execute
  on the real judge — they use a 120s timeout vs 15s elsewhere.
- Errors map to MCP `isError` results with HTTP status context; no stack
  traces or credentials are returned.
