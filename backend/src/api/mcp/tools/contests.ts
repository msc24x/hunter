import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { HunterClient } from '../hunter-client';
import { respond } from '../respond';

export function registerContestTools(
    server: McpServer,
    hunter: HunterClient,
) {
    server.registerTool(
        'get_contests',
        {
            title: 'List contests you host',
            description:
                'Lists contests owned by the authenticated Hunter user. Only your own contests are returned.',
            inputSchema: {
                query: z
                    .string()
                    .optional()
                    .describe(
                        'Search text matched against contest title and description',
                    ),
                liveStatus: z
                    .enum(['all', 'upcoming', 'live', 'always', 'ended'])
                    .optional()
                    .describe(
                        'Filter by schedule: upcoming (starts later), live (started), always (no end date), ended',
                    ),
                practice: z
                    .boolean()
                    .optional()
                    .describe('Filter to practice contests only'),
                qtype: z
                    .number()
                    .int()
                    .min(0)
                    .max(3)
                    .optional()
                    .describe(
                        'Only contests containing a question type: 0=code, 1=mcq, 2=fill, 3=long',
                    ),
                community_id: z
                    .number()
                    .int()
                    .optional()
                    .describe('Filter by community'),
                orderBy: z
                    .enum(['asc', 'desc'])
                    .optional()
                    .describe('Order by creation date (default desc)'),
                after: z
                    .number()
                    .int()
                    .min(0)
                    .optional()
                    .describe('Pagination offset (default 0)'),
                limit: z
                    .number()
                    .int()
                    .min(1)
                    .max(50)
                    .optional()
                    .describe('Page size, max 50 (default 20)'),
            },
        },
        async (args) => {
            const { status, data } = await hunter.call(
                'GET',
                '/competitions',
                {
                    query: {
                        selfOnly: 'true',
                        query: args.query,
                        liveStatus: args.liveStatus,
                        practice: args.practice,
                        qtype: args.qtype,
                        community_id: args.community_id,
                        orderBy: args.orderBy,
                        after: args.after,
                        limit: args.limit,
                    },
                },
            );
            return respond(status, data);
        },
    );

    server.registerTool(
        'get_contest',
        {
            title: 'Get contest details',
            description:
                'Returns full details of one of your contests (metadata, schedule, visibility, community).',
            inputSchema: {
                id: z.number().int().describe('Contest id'),
            },
        },
        async (args) => {
            const { status, data } = await hunter.call(
                'GET',
                `/competition/${args.id}`,
            );
            return respond(status, data);
        },
    );

    server.registerTool(
        'get_contest_quality',
        {
            title: 'Check contest readiness',
            description:
                'Returns warnings and launch blockers for one of your contests, e.g. missing questions, unverified coding questions, or incomplete choices. Use before publishing.',
            inputSchema: {
                id: z.number().int().describe('Contest id'),
            },
        },
        async (args) => {
            const { status, data } = await hunter.call(
                'GET',
                `/competition/${args.id}/quality`,
            );
            return respond(status, data);
        },
    );

    server.registerTool(
        'create_contest',
        {
            title: 'Create a contest',
            description:
                'Creates a new contest owned by you (starts PRIVATE). After creating, add questions with import_questions or create_question, upload files for coding questions, then check readiness with get_contest_quality before making it public via update_contest.',
            inputSchema: {
                title: z.string().min(1).max(120).describe('Contest title'),
                description: z
                    .string()
                    .max(456)
                    .optional()
                    .describe('Contest description'),
                practice: z
                    .boolean()
                    .optional()
                    .describe(
                        'Practice contests can be attempted anytime without scheduling',
                    ),
            },
        },
        async (args) => {
            const { status, data } = await hunter.call(
                'POST',
                '/competition',
                {
                    body: {
                        title: args.title,
                        description: args.description,
                        practice: args.practice,
                    },
                },
            );
            return respond(status, data);
        },
    );

    server.registerTool(
        'update_contest',
        {
            title: 'Update a contest',
            description:
                'Updates settings of one of your contests. Setting visibility to PUBLIC publishes it (the API keeps it PRIVATE if launch blockers exist, and notifies community members on first publish).',
            inputSchema: {
                id: z.number().int().describe('Contest id'),
                title: z.string().max(120).optional(),
                description: z.string().max(456).optional(),
                visibility: z
                    .enum(['PRIVATE', 'PUBLIC', 'INVITE'])
                    .optional()
                    .describe(
                        'PRIVATE: only you. PUBLIC: anyone. INVITE: invited users only.',
                    ),
                community_id: z
                    .number()
                    .int()
                    .nullable()
                    .optional()
                    .describe('Associate with a community (null to detach)'),
                community_only: z
                    .boolean()
                    .optional()
                    .describe('Restrict to members of the community'),
                hidden_scoreboard: z
                    .boolean()
                    .optional()
                    .describe('Hide standings from participants'),
                randomize_questions: z
                    .boolean()
                    .optional()
                    .describe('Shuffle question order per participant'),
                scheduled_at: z
                    .string()
                    .nullable()
                    .optional()
                    .describe(
                        'ISO datetime when the contest opens (null = always open)',
                    ),
                scheduled_end_at: z
                    .string()
                    .nullable()
                    .optional()
                    .describe(
                        'ISO datetime when submissions close (null = no end)',
                    ),
                time_limit: z
                    .number()
                    .int()
                    .min(0)
                    .max(96 * 60)
                    .nullable()
                    .optional()
                    .describe(
                        'Per-participant time limit in minutes (ignored for practice contests)',
                    ),
            },
        },
        async (args) => {
            const { id, ...fields } = args;

            // PUT /competition is full-replace: absent fields are reset
            // ('' or null). Fetch the current contest and merge so this
            // tool behaves like a patch.
            const current = await hunter.call(
                'GET',
                `/competition/${id}`,
            );
            if (current.status !== 200) {
                return respond(current.status, current.data);
            }
            const comp = current.data;

            const { status, data } = await hunter.call(
                'PUT',
                '/competition',
                {
                    body: {
                        id,
                        host_user_id: hunter.user.id,
                        title: fields.title ?? comp.title,
                        description:
                            fields.description ?? comp.description,
                        visibility: fields.visibility ?? comp.visibility,
                        community_id:
                            fields.community_id !== undefined
                                ? fields.community_id
                                : comp.community_id,
                        community_only:
                            fields.community_only ?? comp.community_only,
                        hidden_scoreboard:
                            fields.hidden_scoreboard ??
                            comp.hidden_scoreboard,
                        randomize_questions:
                            fields.randomize_questions ??
                            comp.randomize_questions,
                        scheduled_at:
                            fields.scheduled_at !== undefined
                                ? fields.scheduled_at
                                : comp.scheduled_at,
                        scheduled_end_at:
                            fields.scheduled_end_at !== undefined
                                ? fields.scheduled_end_at
                                : comp.scheduled_end_at,
                        time_limit:
                            fields.time_limit !== undefined
                                ? fields.time_limit
                                : comp.time_limit,
                    },
                },
            );
            return respond(status, data);
        },
    );
}
