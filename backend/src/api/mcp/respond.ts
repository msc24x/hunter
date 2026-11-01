// Maps a Hunter API response to an MCP tool result. Successful payloads
// are returned as JSON text; errors become isError results with a short
// actionable message. Never includes stack traces or credentials.
export function respond(status: number, data: any) {
    if (status >= 200 && status < 300) {
        return {
            content: [
                {
                    type: 'text' as const,
                    text:
                        typeof data === 'string'
                            ? data
                            : JSON.stringify(data ?? { ok: true }),
                },
            ],
        };
    }

    var detail =
        typeof data === 'string'
            ? data
            : data?.message || JSON.stringify(data ?? '');

    if (detail === '""' || detail === '{}') {
        detail = '';
    }

    const hints: Record<number, string> = {
        400: 'Invalid input',
        403: 'Not authorized (check your API token and ownership of the resource)',
        404: 'Not found',
        503: 'Upstream server error',
    };

    return {
        isError: true,
        content: [
            {
                type: 'text' as const,
                text: `${hints[status] ?? `HTTP ${status}`}${
                    detail && detail !== '{}' ? `: ${detail}` : ''
                }`,
            },
        ],
    };
}
