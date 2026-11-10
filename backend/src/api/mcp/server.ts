import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { HunterClient } from './hunter-client';
import { registerCommunityTools } from './tools/communities';
import { registerContestTools } from './tools/contests';
import { registerMaterialTools } from './tools/materials';
import { registerQuestionTools } from './tools/questions';

export function buildMcpServer(hunter: HunterClient) {
    const server = new McpServer({
        name: 'hunter',
        version: '1.0.0',
    });

    registerContestTools(server, hunter);
    registerQuestionTools(server, hunter);
    registerCommunityTools(server, hunter);
    registerMaterialTools(server, hunter);

    return server;
}
