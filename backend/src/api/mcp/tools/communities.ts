import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { HunterClient } from '../hunter-client';
import { respond } from '../respond';

export function registerCommunityTools(
    server: McpServer,
    hunter: HunterClient,
) {
    server.registerTool(
        'list_communities',
        {
            title: 'List communities you can use',
            description:
                'Lists communities visible to you: all APPROVED communities plus communities you administer. Each entry includes admin_user (the owner) and members[].permissions — your own permission codes when you are a member. Use a community id as community_id in update_contest to link a contest. You can only link a contest to a community you own or hold permissions in; the API enforces this server-side.',
            inputSchema: {},
        },
        async () => {
            const { status, data } = await hunter.call('GET', '/communities');
            return respond(status, data);
        },
    );

    server.registerTool(
        'list_memberships',
        {
            title: 'List your community memberships',
            description:
                'Lists your memberships across communities (status, permissions, community_id). Pass community_id to filter to one community. Useful to check whether you can link contests to a given community.',
            inputSchema: {
                community_id: z
                    .number()
                    .int()
                    .optional()
                    .describe('Only return memberships for this community'),
            },
        },
        async (args) => {
            const { status, data } = await hunter.call(
                'GET',
                '/communities/memberships',
                { query: { community_id: args.community_id } },
            );
            return respond(status, data);
        },
    );

    server.registerTool(
        'get_community',
        {
            title: 'Get community details',
            description:
                'Returns details of one community: metadata, admin user, contests, and member/contest counts.',
            inputSchema: {
                id: z.number().int().describe('Community id'),
            },
        },
        async (args) => {
            const { status, data } = await hunter.call(
                'GET',
                `/communities/${args.id}`,
            );
            return respond(status, data);
        },
    );
}
