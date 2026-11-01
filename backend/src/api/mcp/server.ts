import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { HunterClient } from './hunter-client';
import { registerContestTools } from './tools/contests';
import { registerQuestionTools } from './tools/questions';

export function buildMcpServer(hunter: HunterClient) {
    const server = new McpServer({
        name: 'hunter',
        version: '1.0.0',
    });

    registerContestTools(server, hunter);
    registerQuestionTools(server, hunter);

    return server;
}
